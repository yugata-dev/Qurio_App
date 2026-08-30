import pool from "../config/db/connection.js"

// GET semua response milik satu poll
export const getResponses = async (req, res) => {
    const { pollId } = req.params

    try {
        const pollResult = await pool.query(
            "SELECT id FROM polls WHERE id = $1",
            [pollId]
        )

        if (pollResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Poll tidak ditemukan" })
        }

        const responsesResult = await pool.query(
            `SELECT
                r.*,
                po.option_text
            FROM responses r
            LEFT JOIN poll_options po ON po.id = r.option_id
            WHERE r.poll_id = $1
            ORDER BY r.submitted_at ASC`,
            [pollId]
        )

        res.status(200).json({ success: true, data: responsesResult.rows })
    } catch (error) {
        console.error("Get responses error:", error.message)
        return res.status(500).json({ success: false, error: "Terjadi masalah server!!" })
    }
}

// POST submit jawaban peserta
export const createResponse = async (req, res) => {
    const { pollId } = req.params
    const { option_id, answer, participant_name, student_id } = req.body

    try {
        // 1. Pastikan poll sudah dipublikasikan
        const pollResult = await pool.query(
            "SELECT id, type, session_id FROM polls WHERE id = $1 AND status = 'published'",
            [pollId]
        )

        if (pollResult.rows.length === 0) {
            return res.status(400).json({ success: false, error: "Soal belum dipublikasikan atau tidak ditemukan!" })
        }

        const poll = pollResult.rows[0]

        // 2. Validasi input dasar
        if (!participant_name) {
            return res.status(400).json({ success: false, error: "Nama peserta wajib diisi!" })
        }

        if ((poll.type === "polling" || poll.type === "quiz") && !option_id) {
            return res.status(400).json({ success: false, error: "Opsi jawaban wajib dipilih!" })
        }

        // 3. Tentukan status benar/salah berdasarkan opsi yang dipilih peserta
        let isCorrect = null
        const answerText = answer && String(answer).trim() ? String(answer).trim() : null

        if (option_id) {
            const optionResult = await pool.query(
                "SELECT is_correct FROM poll_options WHERE id = $1 AND poll_id = $2",
                [option_id, pollId]
            )

            if (optionResult.rows.length === 0) {
                return res.status(400).json({ success: false, error: "Opsi jawaban tidak valid untuk soal ini!" })
            }

            isCorrect = optionResult.rows[0].is_correct
        }

        // 4. Cegah jawaban ganda oleh siswa yang sama (jika login)
        if (student_id) {
            const duplicateResult = await pool.query(
                "SELECT id FROM responses WHERE poll_id = $1 AND student_id = $2",
                [pollId, student_id]
            )

            if (duplicateResult.rows.length > 0) {
                return res.status(409).json({ success: false, error: "Kamu sudah menjawab soal ini!" })
            }
        }

        // 5. Simpan response
        const insertResult = await pool.query(
            `INSERT INTO responses (poll_id, student_id, participant_name, answer, option_id, is_correct)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *`,
            [pollId, student_id || null, participant_name, answerText, option_id || null, isCorrect]
        )

        const newResponse = insertResult.rows[0]

        // ==========================================
        // ⚡ WEBSOCKET: Pancarkan jawaban baru ke ruang sesi
        // ==========================================
        const io = req.app.get("io")
        if (io) {
            io.to(`session:${poll.session_id}`).emit("response_created", newResponse)
        }

        res.status(201).json({ success: true, data: newResponse })
    } catch (error) {
        console.error("Create response error:", error.message)

        // Jawaban ganda (tertangkap constraint unik di database)
        if (error.code === "23505") {
            return res.status(409).json({ success: false, error: "Kamu sudah menjawab soal ini!" })
        }

        return res.status(400).json({ success: false, error: "Jawaban gagal dikirim!" })
    }
}