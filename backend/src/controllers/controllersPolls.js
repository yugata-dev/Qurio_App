import pool from "../config/db/connection.js"

const ALLOWED_POLL_TYPES = ["wordcloud", "polling", "qa", "quiz"]

// Helper: Hapus kunci jawaban (is_correct) sebelum dikirim ke siswa via WebSocket
// Siswa tidak boleh tahu jawaban yang benar sebelum poll ditutup
function sanitizeOptions(options) {
    return options.map((option) => {
        // Ambil semua field kecuali is_correct
        const { is_correct, ...safeOption } = option
        return safeOption
    })
}

// Helper: Validasi input saat membuat poll
// Memastikan type, question, dan options valid sesuai tipe poll
function validatePollInput(type, question, options) {
    // Cek apakah type adalah salah satu dari tipe yang diizinkan
    if (!ALLOWED_POLL_TYPES.includes(type)) {
        return "Tipe soal tidak valid!"
    }

    // Pertanyaan harus ada dan tidak boleh kosong/spasi
    const cleanQuestion = question ? String(question).trim() : ""
    if (!cleanQuestion) {
        return "Pertanyaan wajib diisi!"
    }

    // Polling dan Quiz memerlukan opsi jawaban
    const requiresOptions = (type === "polling" || type === "quiz")
    if (requiresOptions) {
        // Cek apakah options adalah array dan tidak kosong
        if (!Array.isArray(options) || options.length === 0) {
            return "Options wajib berupa array non-kosong untuk polling/quiz!"
        }

        // Setiap opsi harus memiliki teks yang valid
        for (const opt of options) {
            const optText = opt && opt.text ? String(opt.text).trim() : ""
            if (!optText) {
                return "Setiap opsi wajib memiliki teks valid!"
            }
        }
    }

    // Jika semua validasi lolos, return null (tidak ada error)
    return null
}

// ====================================================================
// 1. CREATE POLL (Membuat soal baru di dalam sesi)
// ====================================================================
export const createPoll = async (req, res) => {
    const { sessionId } = req.params
    const { type, question, options = [] } = req.body

    // Step 1: Validasi input yang dikirim dari client
    const validationError = validatePollInput(type, question, options)
    if (validationError) {
        return res.status(400).json({ success: false, message: validationError })
    }

    // Step 2: Ambil koneksi database untuk transaksi
    let client
    try {
        client = await pool.connect()

        // Step 3: Cek apakah sesi ada dan milik guru yang login
        const sessionRes = await client.query(
            "SELECT teacher_id FROM sessions WHERE id = $1",
            [sessionId]
        )

        if (sessionRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Sesi tidak ditemukan!" })
        }

        // Verifikasi bahwa guru yang login adalah pemilik sesi
        const teacherId = sessionRes.rows[0].teacher_id
        const loggedInTeacherId = req.user ? req.user.id : null
        if (teacherId !== loggedInTeacherId) {
            return res.status(403).json({ success: false, message: "Anda bukan pemilik sesi ini!" })
        }

        // Step 4: Mulai transaksi database untuk menjaga konsistensi data
        await client.query("BEGIN")

        // Step 5: Simpan poll ke database
        const pollRes = await client.query(
            "INSERT INTO polls (session_id, type, question) VALUES ($1, $2, $3) RETURNING *",
            [sessionId, type, question]
        )
        const newPoll = pollRes.rows[0]
        const savedOptions = []

        // Step 6: Jika tipe polling/quiz, simpan opsi jawaban
        if (type === "polling" || type === "quiz") {
            for (let i = 0; i < options.length; i++) {
                const optionText = options[i].text.trim()
                const isCorrect = options[i].is_correct === true ? true : false
                const optionOrder = i + 1

                const optRes = await client.query(
                    "INSERT INTO poll_options (poll_id, option_text, is_correct, option_order) VALUES ($1, $2, $3, $4) RETURNING *",
                    [newPoll.id, optionText, isCorrect, optionOrder]
                )
                savedOptions.push(optRes.rows[0])
            }
        }

        // Step 7: Selesaikan transaksi (commit)
        await client.query("COMMIT")

        // Step 8: Broadcast ke WebSocket untuk semua peserta di ruang sesi
        // PENTING: Jangan kirim is_correct ke siswa, hanya untuk guru via HTTP
        const io = req.app.get("io")
        if (io) {
            io.to(`session:${sessionId}`).emit("poll_created", {
                ...newPoll,
                options: sanitizeOptions(savedOptions)
            })
        }

        // Step 9: Kirim response ke guru (dengan kunci jawaban lengkap)
        return res.status(201).json({
            success: true,
            data: { ...newPoll, options: savedOptions }
        })

    } catch (error) {
        // Jika terjadi error, batalkan transaksi (rollback)
        if (client) {
            await client.query("ROLLBACK").catch(() => { })
        }
        console.error("Create poll error:", error.message)
        return res.status(500).json({ success: false, message: "Gagal membuat soal" })
    } finally {
        // Selalu lepaskan koneksi database
        if (client) {
            client.release()
        }
    }
}

// ====================================================================
// 2. GET ALL POLLS BY SESSION (Ambil semua soal dalam satu sesi)
// ====================================================================
export const getPollsBySession = async (req, res) => {
    const { sessionId } = req.params

    try {
        // Step 1: Ambil semua poll dalam sesi ini
        const pollsRes = await pool.query(
            "SELECT * FROM polls WHERE session_id = $1 ORDER BY created_at ASC",
            [sessionId]
        )

        // Step 2: Ambil semua poll_options untuk semua poll dalam sesi ini
        const optionsRes = await pool.query(
            "SELECT * FROM poll_options WHERE poll_id IN (SELECT id FROM polls WHERE session_id = $1) ORDER BY option_order ASC",
            [sessionId]
        )

        // Step 3: Gabungkan data poll dengan options-nya
        // Setiap poll akan memiliki array options yang sesuai
        const pollsWithOptions = pollsRes.rows.map(poll => {
            const pollOptions = optionsRes.rows.filter(opt => opt.poll_id === poll.id)
            return {
                ...poll,
                options: pollOptions
            }
        })

        return res.status(200).json({ success: true, data: pollsWithOptions })
    } catch (error) {
        console.error("Get polls error:", error.message)
        return res.status(500).json({ success: false, message: "Gagal mengambil soal" })
    }
}

// ====================================================================
// 3. GET SINGLE POLL (Ambil detail satu soal spesifik)
// ====================================================================
export const getPoll = async (req, res) => {
    const { pollId } = req.params

    try {
        // Step 1: Ambil detail poll berdasarkan ID
        const pollRes = await pool.query(
            "SELECT * FROM polls WHERE id = $1",
            [pollId]
        )

        // Step 2: Jika poll tidak ada, return 404
        if (pollRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Soal tidak ditemukan" })
        }

        // Step 3: Ambil semua opsi jawaban untuk poll ini
        const optionsRes = await pool.query(
            "SELECT * FROM poll_options WHERE poll_id = $1 ORDER BY option_order ASC",
            [pollId]
        )

        // Step 4: Gabungkan poll data dengan options-nya
        const pollData = {
            ...pollRes.rows[0],
            options: optionsRes.rows
        }

        return res.status(200).json({
            success: true,
            data: pollData
        })
    } catch (error) {
        console.error("Get poll error:", error.message)
        return res.status(500).json({ success: false, message: "Gagal mengambil soal" })
    }
}

// ====================================================================
// 4. UPDATE POLL STATUS (Ubah status soal: draft -> published -> closed)
// ====================================================================
export const updatePoll = async (req, res) => {
    const { pollId } = req.params
    const { status } = req.body

    // Validasi status yang dikirim
    const validStatuses = ["draft", "published", "closed"]
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: "Status tidak valid! (draft/published/closed)" })
    }

    try {
        // Step 1: Cek apakah poll ada dan ambil info sesi & guru pemiliknya
        const ownerRes = await pool.query(
            `SELECT p.session_id, s.teacher_id 
             FROM polls p 
             JOIN sessions s ON s.id = p.session_id 
             WHERE p.id = $1`,
            [pollId]
        )

        if (ownerRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Soal tidak ditemukan" })
        }

        // Step 2: Verifikasi bahwa guru yang login adalah pemilik sesi
        const teacherId = ownerRes.rows[0].teacher_id
        const loggedInTeacherId = req.user ? req.user.id : null
        if (teacherId !== loggedInTeacherId) {
            return res.status(403).json({ success: false, message: "Anda bukan pemilik sesi ini!" })
        }

        // Step 3: Update status dan set timestamp yang sesuai
        let query = "UPDATE polls SET status = $1"
        if (status === "published") {
            query += ", published_at = CURRENT_TIMESTAMP"
        } else if (status === "closed") {
            query += ", closed_at = CURRENT_TIMESTAMP"
        }
        query += " WHERE id = $2 RETURNING *"

        const updatedPollRes = await pool.query(query, [status, pollId])
        const updatedPoll = updatedPollRes.rows[0]
        const sessionId = ownerRes.rows[0].session_id

        // Step 4: Ambil opsi jawaban (tanpa is_correct untuk keamanan)
        const optionsRes = await pool.query(
            "SELECT id, poll_id, option_text, option_order FROM poll_options WHERE poll_id = $1 ORDER BY option_order ASC",
            [updatedPoll.id]
        )
        const options = optionsRes.rows

        // Step 5: Buat data lengkap untuk response
        const fullPollData = { ...updatedPoll, options: options }

        // Step 6: Broadcast update ke semua peserta di ruang sesi
        const io = req.app.get("io")
        if (io) {
            io.to(`session:${sessionId}`).emit("poll_updated", fullPollData)
        }

        return res.status(200).json({ success: true, data: fullPollData })
    } catch (error) {
        console.error("Update poll error:", error.message)
        return res.status(500).json({ success: false, message: "Gagal mengubah status soal" })
    }
}