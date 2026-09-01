import pool from "../config/db/connection.js"

// ------------------------------------------------------------
// 1) Ambil semua pertanyaan di satu sesi
// ------------------------------------------------------------
export const getQuestionsBySession = async (req, res) => {
    const { sessionId } = req.params

    try {
        const result = await pool.query(
            `SELECT *
             FROM questions
             WHERE session_id = $1
             ORDER BY created_at ASC`,
            [sessionId]
        )

        return res.status(200).json({
            success: true,
            data: result.rows
        })
    } catch (error) {
        console.error("Get questions error:", error.message)
        return res.status(500).json({
            success: false,
            message: "Gagal mengambil data pertanyaan."
        })
    }
}

// ------------------------------------------------------------
// 2) Siswa mengirimkan pertanyaan baru ke sesi
// ------------------------------------------------------------
export const createQuestion = async (req, res) => {
    const body = req.body || {}
    const session_id = body.session_id ?? body.sessionId
    const student_id = body.student_id ?? body.studentId ?? null
    const student_name = body.student_name ?? body.studentName ?? body.name
    const text = body.text ?? body.question ?? ""
    const cleanText = String(text || "").trim()

    try {
        // Validasi dasar agar input tidak kosong
        if (!session_id) {
            return res.status(400).json({ success: false, message: "session_id wajib diisi." })
        }

        if (!student_name || !String(student_name).trim()) {
            return res.status(400).json({ success: false, message: "Nama siswa wajib diisi." })
        }

        if (!cleanText) {
            return res.status(400).json({ success: false, message: "Pertanyaan tidak boleh kosong." })
        }

        // Pastikan sesi memang ada sebelum menyimpan pertanyaan
        const sessionCheck = await pool.query(
            "SELECT id FROM sessions WHERE id = $1",
            [session_id]
        )

        if (sessionCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Sesi tidak ditemukan."
            })
        }

        const insertResult = await pool.query(
            `INSERT INTO questions (session_id, student_id, student_name, text, upvotes, answered, answer)
             VALUES ($1, $2, $3, $4, 0, false, NULL)
             RETURNING *`,
            [session_id, student_id || null, String(student_name).trim(), cleanText]
        )

        const newQuestion = insertResult.rows[0]

        // Emit ke semua peserta di room sesi agar guru dan siswa melihat pertanyaan baru
        const io = req.app.get("io")
        if (io) {
            io.to(`session:${session_id}`).emit("question_created", newQuestion)
        }

        return res.status(201).json({
            success: true,
            data: newQuestion,
            message: "Pertanyaan berhasil dikirim."
        })
    } catch (error) {
        console.error("Create question error:", error.message)
        return res.status(500).json({
            success: false,
            message: error.message || "Pertanyaan gagal dikirim."
        })
    }
}

// ------------------------------------------------------------
// 3) Siswa lain memberi upvote pada pertanyaan
// ------------------------------------------------------------
export const upvoteQuestion = async (req, res) => {
    const { id } = req.params
    const { student_id } = req.body

    try {
        if (!student_id) {
            return res.status(400).json({
                success: false,
                message: "student_id wajib diisi untuk upvote."
            })
        }

        // Cek apakah pertanyaan ada
        const questionResult = await pool.query(
            "SELECT * FROM questions WHERE id = $1",
            [id]
        )

        if (questionResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Pertanyaan tidak ditemukan."
            })
        }

        const question = questionResult.rows[0]

        // Cegah pengguna mengulang vote untuk pertanyaan yang sama
        const voteCheck = await pool.query(
            "SELECT id FROM question_votes WHERE question_id = $1 AND student_id = $2",
            [id, student_id]
        )

        if (voteCheck.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Kamu sudah memberikan upvote pada pertanyaan ini."
            })
        }

        await pool.query("BEGIN")

        await pool.query(
            `INSERT INTO question_votes (question_id, student_id)
             VALUES ($1, $2)`,
            [id, student_id]
        )

        const updatedQuestion = await pool.query(
            `UPDATE questions
             SET upvotes = upvotes + 1
             WHERE id = $1
             RETURNING *`,
            [id]
        )

        await pool.query("COMMIT")

        const finalQuestion = updatedQuestion.rows[0]

        const io = req.app.get("io")
        if (io) {
            io.to(`session:${question.session_id}`).emit("question_upvoted", finalQuestion)
        }

        return res.status(200).json({
            success: true,
            data: finalQuestion,
            message: "Upvote berhasil ditambahkan."
        })
    } catch (error) {
        await pool.query("ROLLBACK").catch(() => { })
        console.error("Upvote question error:", error.message)
        return res.status(500).json({
            success: false,
            message: "Upvote gagal diproses."
        })
    }
}

// ------------------------------------------------------------
// 4) Guru menandai pertanyaan telah dijawab
// ------------------------------------------------------------
export const answerQuestion = async (req, res) => {
    const { id } = req.params
    const { answer } = req.body
    const cleanAnswer = String(answer || "").trim()

    try {
        if (!cleanAnswer) {
            return res.status(400).json({
                success: false,
                message: "Jawaban guru tidak boleh kosong."
            })
        }

        const questionResult = await pool.query(
            "SELECT * FROM questions WHERE id = $1",
            [id]
        )

        if (questionResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Pertanyaan tidak ditemukan."
            })
        }

        const question = questionResult.rows[0]

        // Hanya guru pemilik sesi yang boleh menandai jawaban
        const sessionResult = await pool.query(
            "SELECT teacher_id FROM sessions WHERE id = $1",
            [question.session_id]
        )

        if (sessionResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Sesi tidak ditemukan."
            })
        }

        if (sessionResult.rows[0].teacher_id !== req.user?.id) {
            return res.status(403).json({
                success: false,
                message: "Anda bukan guru pemilik sesi ini."
            })
        }

        const updatedQuestion = await pool.query(
            `UPDATE questions
             SET answer = $1, answered = true, answered_at = CURRENT_TIMESTAMP
             WHERE id = $2
             RETURNING *`,
            [cleanAnswer, id]
        )

        const finalQuestion = updatedQuestion.rows[0]

        const io = req.app.get("io")
        if (io) {
            io.to(`session:${question.session_id}`).emit("question_answered", finalQuestion)
        }

        return res.status(200).json({
            success: true,
            data: finalQuestion,
            message: "Pertanyaan berhasil dijawab."
        })
    } catch (error) {
        console.error("Answer question error:", error.message)
        return res.status(500).json({
            success: false,
            message: "Gagal menandai pertanyaan sebagai terjawab."
        })
    }
}
