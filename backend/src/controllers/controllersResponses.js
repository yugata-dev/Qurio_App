import pool from "../config/db/connection.js"

// ====================================================================
// GET RESPONSES (Ambil semua jawaban peserta untuk satu soal)
// ====================================================================
export const getResponses = async (req, res) => {
    const { pollId } = req.params

    try {
        // Step 1: Verifikasi bahwa soal (poll) ada
        const pollResult = await pool.query(
            "SELECT id FROM polls WHERE id = $1",
            [pollId]
        )

        if (pollResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Soal tidak ditemukan" })
        }

        // Step 2: Ambil semua jawaban peserta untuk soal ini
        // LEFT JOIN dengan poll_options untuk mendapat teks opsi yang dipilih
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

        // Step 3: Kirim data jawaban ke guru
        res.status(200).json({ success: true, data: responsesResult.rows })
    } catch (error) {
        console.error("Get responses error:", error.message)
        return res.status(500).json({ success: false, message: "Gagal mengambil jawaban" })
    }
}

// ====================================================================
// POST RESPONSE (Siswa submit jawaban untuk soal)
// ====================================================================
export const createResponse = async (req, res) => {
    const { pollId } = req.params
    const { option_id, answer, participant_name, student_id } = req.body

    try {
        // Step 1: Pastikan soal sudah dipublikasikan
        // Soal tidak boleh dijawab jika status masih "draft" atau "closed"
        const pollResult = await pool.query(
            "SELECT id, type, session_id FROM polls WHERE id = $1 AND status = 'published'",
            [pollId]
        )

        if (pollResult.rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Soal belum dipublikasikan atau tidak ditemukan!"
            })
        }

        const poll = pollResult.rows[0]

        // Step 2: Validasi input dasar dari peserta
        if (!participant_name) {
            return res.status(400).json({
                success: false,
                message: "Nama peserta wajib diisi!"
            })
        }

        // Untuk tipe polling/quiz, harus ada pilihan opsi
        if (poll.type === "polling" || poll.type === "quiz") {
            if (!option_id) {
                return res.status(400).json({
                    success: false,
                    message: "Opsi jawaban wajib dipilih!"
                })
            }
        }

        // Step 3: Tentukan apakah jawaban benar atau salah (untuk quiz)
        let isCorrect = null
        const answerText = answer ? String(answer).trim() : null

        // Jika ada opsi yang dipilih, cek apakah itu jawaban yang benar
        if (option_id) {
            const optionResult = await pool.query(
                "SELECT is_correct FROM poll_options WHERE id = $1 AND poll_id = $2",
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

        // Step 4: Cegah peserta yang sama menjawab soal yang sama dua kali
        if (student_id) {
            const duplicateResult = await pool.query(
                "SELECT id FROM responses WHERE poll_id = $1 AND student_id = $2",
                [pollId, student_id]
            )

            if (duplicateResult.rows.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: "Kamu sudah menjawab soal ini!"
                })
            }
        }

        // Step 5: Simpan jawaban ke database
        const insertResult = await pool.query(
            `INSERT INTO responses (poll_id, student_id, participant_name, answer, option_id, is_correct)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *`,
            [pollId, student_id || null, participant_name, answerText, option_id || null, isCorrect]
        )

        const newResponse = insertResult.rows[0]

        // Step 6: Broadcast jawaban baru ke semua peserta di ruang sesi via WebSocket
        const io = req.app.get("io")
        if (io) {
            io.to(`session:${poll.session_id}`).emit("response_created", newResponse)
        }

        res.status(201).json({ success: true, data: newResponse })
    } catch (error) {
        console.error("Create response error:", error.message)

        // Jika error kode 23505, berarti constraint unik di database tertrigger
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