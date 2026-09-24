import pool from "../config/database/connection.js"

const toQuestionPayload = (row, pollId) => ({
    id: row.id,
    poll_id: pollId,
    participant_id: row.student_id || row.participant_id || null,
    participant_name: row.student_name || row.participant_name || null,
    text: row.text ?? row.question_text ?? "",
    question_text: row.question_text ?? row.text ?? "",
    created_at: row.created_at,
    answered: row.answered,
    answer: row.answer,
})

export const getQuestionsByPollId = async (req, res) => {
    const { poll_id: pollId } = req.query

    if (!pollId) {
        return res.status(400).json({
            success: false,
            message: "poll_id wajib diisi."
        })
    }

    try {
        const pollResult = await pool.query(
            "SELECT id, session_id, type FROM polls WHERE id = $1",
            [pollId]
        )

        if (pollResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Poll tidak ditemukan."
            })
        }

        const sessionId = pollResult.rows[0].session_id
        const result = await pool.query(
            `SELECT *
             FROM questions
             WHERE session_id = $1
             ORDER BY created_at ASC`,
            [sessionId]
        )

        return res.status(200).json({
            success: true,
            data: result.rows.map((row) => toQuestionPayload(row, pollId))
        })
    } catch (error) {
        console.error("Get questions by poll error:", error.message)
        return res.status(500).json({
            success: false,
            message: "Gagal mengambil pertanyaan untuk poll ini."
        })
    }
}

export const getQuestionsBySession = async (req, res) => {
    const { sessionId } = req.params

    try {
        const sessionResult = await pool.query(
            "SELECT teacher_id FROM sessions WHERE id = $1",
            [sessionId]
        )

        if (sessionResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Sesi tidak ditemukan."
            })
        }

        if (sessionResult.rows[0].teacher_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "Anda bukan pemilik sesi ini!"
            })
        }

        const result = await pool.query(
            `SELECT *
             FROM questions
             WHERE session_id = $1
             ORDER BY created_at ASC`,
            [sessionId]
        )

        return res.status(200).json({
            success: true,
            data: result.rows.map((row) => ({
                ...row,
                text: row.text ?? row.question_text ?? "",
                question_text: row.question_text ?? row.text ?? "",
                participant_id: row.student_id,
                participant_name: row.student_name,
                poll_id: null,
            }))
        })
    } catch (error) {
        console.error("Get questions error:", error.message)
        return res.status(500).json({
            success: false,
            message: "Gagal mengambil data pertanyaan."
        })
    }
}

export const createQuestion = async (req, res) => {
    const body = req.body || {}
    const pollId = body.poll_id ?? body.pollId
    const participantId = body.participant_id ?? body.participantId ?? null
    const questionText = body.question_text ?? body.questionText ?? body.question ?? body.text ?? ""
    const cleanText = String(questionText || "").trim()

    try {
        if (!pollId) {
            return res.status(400).json({ success: false, message: "poll_id wajib diisi." })
        }

        if (!cleanText) {
            return res.status(400).json({ success: false, message: "Pertanyaan tidak boleh kosong." })
        }

        const pollResult = await pool.query(
            "SELECT id, session_id, type, status FROM polls WHERE id = $1",
            [pollId]
        )

        if (pollResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Poll tidak ditemukan."
            })
        }

        const poll = pollResult.rows[0]
        if (poll.type !== "qa") {
            return res.status(400).json({
                success: false,
                message: "Endpoint ini hanya untuk tipe qa."
            })
        }

        if (participantId) {
            const participantResult = await pool.query(
                "SELECT id, name FROM participants WHERE id = $1 AND session_id = $2",
                [participantId, poll.session_id]
            )

            if (participantResult.rows.length === 0) {
                return res.status(403).json({
                    success: false,
                    message: "Peserta tidak terdaftar pada sesi ini. Silakan masuk kembali ke sesi."
                })
            }
        }

        const participantName = body.participant_name ?? body.name ?? (participantId ? "Siswa" : "Anonim")

        const insertResult = await pool.query(
            `INSERT INTO questions (session_id, student_id, participant_id, student_name, text, upvotes, answered, answer)
             VALUES ($1, NULL, $2, $3, $4, 0, false, NULL)
             RETURNING *`,
            [poll.session_id, participantId || null, String(participantName).trim() || "Anonim", cleanText]
        )

        const newQuestion = insertResult.rows[0]
        const responseData = toQuestionPayload(newQuestion, pollId)

        const io = req.app.get("io")
        if (io) {
            io.to(`session:${poll.session_id}`).emit("question_created", responseData)
        }

        return res.status(201).json({
            success: true,
            data: responseData,
            message: "Pertanyaan berhasil dikirim."
        })
    } catch (error) {
        console.error("Create question error:", error.message)
        return res.status(500).json({
            success: false,
            message: "Pertanyaan gagal dikirim. Silakan coba lagi."
        })
    }
}

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
