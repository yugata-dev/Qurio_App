import pool from "../config/database/connection.js"

// ====================================================================
// GET RESPONSES (Ambil semua jawaban peserta untuk satu soal)
// ====================================================================
export const getResponses = async (req, res) => {
    const { pollId } = req.params

    try {
        // Step 1: Verifikasi bahwa soal ada dan guru yang login memiliki sesinya
        const pollResult = await pool.query(
            `SELECT p.id, s.teacher_id
             FROM polls p
             JOIN sessions s ON s.id = p.session_id
             WHERE p.id = $1`,
            [pollId]
        )

        if (pollResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Soal tidak ditemukan" })
        }

        if (pollResult.rows[0].teacher_id !== req.user.id) {
            return res.status(403).json({ success: false, message: "Anda bukan pemilik sesi ini!" })
        }

        // Step 2: Hitung hasil di server tanpa mengirim kunci jawaban ke client.
        const responsesResult = await pool.query(
            `SELECT
    r.poll_id,
    COUNT(*) FILTER (WHERE po.is_correct = TRUE)::int AS correct_count,
    COUNT(*) FILTER (WHERE po.is_correct = FALSE)::int AS incorrect_count,
    COUNT(*)::int AS total_count
    FROM responses r
    LEFT JOIN poll_options po
    ON po.id = r.option_id
    WHERE r.poll_id = $1
    GROUP BY r.poll_id`,
            [pollId]
        )

        // Step 3: Kirim data jawaban ke guru
        res.status(200).json({ success: true, data: responsesResult.rows })
    } catch (error) {
        console.error("Get responses error:", error.message)
        return res.status(500).json({ success: false, message: "Gagal mengambil jawaban" })
    }
}

export const createResponse = async (req, res) => {
    const { pollId } = req.params
    const { option_id, answer, participant_id } = req.body

    try {
        // 1. Pastikan soal sudah dipublikasikan
        const pollResult = await pool.query(
            `SELECT id, type, session_id
             FROM polls
             WHERE id = $1
             AND status = 'published'`,
            [pollId]
        )

        if (pollResult.rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Soal belum dipublikasikan atau tidak ditemukan!"
            })
        }

        const poll = pollResult.rows[0]
        let isCorrect = null

        // 2. Q&A punya endpoint sendiri
        if (poll.type === "qa") {
            return res.status(400).json({
                success: false,
                message: "Tipe qa mengirim pertanyaan melalui POST /api/questions."
            })
        }

        // 3. Word Cloud punya endpoint sendiri
        if (poll.type === "wordcloud") {
            return res.status(400).json({
                success: false,
                message: "Tipe wordcloud mengirim jawaban melalui endpoint wordcloud."
            })
        }

        // 4. Participant ID wajib
        if (!participant_id) {
            return res.status(400).json({
                success: false,
                message: "Participant ID wajib dikirim!"
            })
        }

        // 5. Pastikan participant berasal dari session yang sama
        const participantResult = await pool.query(
            `SELECT id
             FROM participants
             WHERE id = $1
             AND session_id = $2`,
            [participant_id, poll.session_id]
        )

        if (participantResult.rows.length === 0) {
            return res.status(403).json({
                success: false,
                message: "Peserta tidak valid untuk sesi ini!"
            })
        }

        // 6. Quiz dan polling wajib memilih option
        if (poll.type === "polling" || poll.type === "quiz") {
            if (!option_id) {
                return res.status(400).json({
                    success: false,
                    message: "Opsi jawaban wajib dipilih!"
                })
            }

            // Pastikan option memang milik soal ini
            const optionResult = await pool.query(
                `SELECT id, is_correct
                 FROM poll_options
                 WHERE id = $1
                 AND poll_id = $2`,
                [option_id, pollId]
            )

            if (optionResult.rows.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "Opsi jawaban tidak valid untuk soal ini!"
                })
            }

            isCorrect = optionResult.rows[0].is_correct
        }

        // 7. Cegah peserta menjawab soal yang sama dua kali
        const duplicateResult = await pool.query(
            `SELECT id
             FROM responses
             WHERE poll_id = $1
             AND participant_id = $2`,
            [pollId, participant_id]
        )

        if (duplicateResult.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Kamu sudah menjawab soal ini!"
            })
        }

        // 8. Bersihkan jawaban teks jika ada
        const answerText = answer
            ? String(answer).trim()
            : null

        // 9. Simpan jawaban siswa
        const insertResult = await pool.query(
            `INSERT INTO responses (
                poll_id,
                participant_id,
                answer,
                option_id,
                is_correct
            )
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *`,
            [
                pollId,
                participant_id,
                answerText,
                option_id || null,
                isCorrect
            ]
        )

        const newResponse = insertResult.rows[0]

        // 10. Broadcast response baru
        const io = req.app.get("io")

        if (io) {
            io.to(`session:${poll.session_id}`)
                .emit("response_created", newResponse)
        }

        return res.status(201).json({
            success: true,
            data: newResponse
        })

    } catch (error) {
        console.error("Create response error:", error.message)

        if (error.code === "23505") {
            return res.status(409).json({
                success: false,
                message: "Kamu sudah menjawab soal ini!"
            })
        }

        return res.status(500).json({
            success: false,
            message: "Jawaban gagal dikirim!"
        })
    }
}