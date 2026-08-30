import pool from "../config/db/connection.js"

const ALLOWED_POLL_TYPES = ["wordcloud", "polling", "qa", "quiz"]

// ⚠ Bug 1: Buang properti rahasia (is_correct) dari payload opsi
// SEBELUM data dikirim lewat WebSocket ke ruang sesi (termasuk layar
// siswa). Tanpa ini, siswa bisa melihat kunci jawaban via F12 > Network
// > WebSockets.
const sanitizeOptionsForClients = (options) =>
    options.map(({ is_correct, ...publicOption }) => publicOption)

// POST /api/polls/sessions/:sessionId/polls — buat poll baru (guru pemilik sesi)
export const createPoll = async (req, res) => {
    const { sessionId } = req.params
    const { type, question, options } = req.body

    // Validasi input
    if (!ALLOWED_POLL_TYPES.includes(type)) {
        return res.status(400).json({ success: false, error: "Tipe soal tidak valid!" })
    }

    if (!question || !String(question).trim()) {
        return res.status(400).json({ success: false, error: "Pertanyaan wajib diisi!" })
    }

    // ⚠ Bug 2: pastikan options benar-benar Array asli.
    // String juga punya properti `.length`, jadi validasi `!options || !options.length`
    // saja akan lolos untuk string lalu tiba-tiba crash di `.map()`.
    const isPollWithOptions = type === "polling" || type === "quiz"
    if (isPollWithOptions && (!Array.isArray(options) || options.length === 0)) {
        return res.status(400).json({ success: false, error: "Options wajib berupa array non-kosong untuk polling/quiz!" })
    }

    if (Array.isArray(options) && options.some((opt) => !opt || typeof opt.text !== "string" || !opt.text.trim())) {
        return res.status(400).json({ success: false, error: "Setiap opsi wajib memiliki teks valid!" })
    }

    let client
    try {
        // Ambil koneksi khusus untuk transaksi.
        client = await pool.connect()

        // Cek sesi & kepemilikan
        const sessionResult = await client.query(
            "SELECT teacher_id FROM sessions WHERE id = $1",
            [sessionId]
        )

        if (sessionResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: "Sesi tidak ditemukan!" })
        }

        if (sessionResult.rows[0].teacher_id !== req.user?.id) {
            return res.status(403).json({ success: false, error: "Anda bukan pemilik sesi ini!" })
        }

        // ==========================================
        // ⚠ Bug 3: bungkus dalam TRANSACTION.
        // Kalau satu opsi saja gagal disimpan, batalkan juga poll utamanya
        // agar tidak ada data menggantung (orphan data).
        // ==========================================
        await client.query("BEGIN")

        const pollResult = await client.query(
            "INSERT INTO polls (session_id, type, question) VALUES ($1, $2, $3) RETURNING *",
            [sessionId, type, question]
        )
        const newPoll = pollResult.rows[0]
        const savedOptions = []

        if (isPollWithOptions) {
            for (let i = 0; i < options.length; i++) {
                const option = options[i]
                const optionResult = await client.query(
                    "INSERT INTO poll_options (poll_id, option_text, is_correct, option_order) VALUES ($1, $2, $3, $4) RETURNING *",
                    [newPoll.id, option.text.trim(), option.is_correct || false, i + 1]
                )
                savedOptions.push(optionResult.rows[0])
            }
        }

        // Semua berhasil -> simpan permanen
        await client.query("COMMIT")

        const fullPollData = {
            ...newPoll,
            options: savedOptions
        }

        // ==========================================
        // ⚡ WEBSOCKET: beri tahu peserta di ruang sesi.
        // ⚠ Bug 1: yang dikirim ke siswa TIDAK BOLEH membawa is_correct,
        // gunakan versi yang sudah disanitasi.
        // ==========================================
        const io = req.app.get("io")
        if (io) {
            io.to(`session:${sessionId}`).emit("poll_created", {
                ...newPoll,
                options: sanitizeOptionsForClients(savedOptions)
            })
        }

        // Respons HTTP hanya untuk guru (pemilik sah) -> boleh membawa is_correct.
        res.status(201).json({ success: true, data: fullPollData })
    } catch (error) {
        // Ada galat -> batalkan seluruh perubahan
        if (client) await client.query("ROLLBACK").catch(() => {})
        console.error("Create poll error:", error.message)
        return res.status(400).json({ success: false, error: "Data gagal dibuat" })
    } finally {
        // Kembalikan koneksi ke pool
        if (client) client.release()
    }
}

export const getPollsBySession = async (req, res) => {
    const { sessionId } = req.params

    try {
        const pollsResult = await pool.query(
            "SELECT * FROM polls WHERE session_id = $1 ORDER BY created_at ASC",
            [sessionId]
        )
        const polls = pollsResult.rows

        const optionsResult = await pool.query(
            "SELECT * FROM poll_options WHERE poll_id IN (SELECT id FROM polls WHERE session_id = $1) ORDER BY option_order ASC",
            [sessionId]
        )
        const allOptions = optionsResult.rows

        const pollsWithOptions = polls.map((poll) => ({
            ...poll,
            options: allOptions.filter((opt) => opt.poll_id === poll.id)
        }))

        res.status(200).json({ success: true, data: pollsWithOptions })
    } catch (error) {
        console.error("Get polls error:", error.message)
        return res.status(500).json({ success: false, error: "Terjadi masalah server!" })
    }
}

export const getPoll = async (req, res) => {
    const { pollId } = req.params

    try {
        const pollResult = await pool.query(
            "SELECT * FROM polls WHERE id = $1",
            [pollId]
        )

        if (pollResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Poll tidak ditemukan" })
        }

        const optionsResult = await pool.query(
            "SELECT * FROM poll_options WHERE poll_id = $1 ORDER BY option_order ASC",
            [pollId]
        )

        const pollData = {
            ...pollResult.rows[0],
            options: optionsResult.rows
        }

        res.status(200).json({ success: true, data: pollData })
    } catch (error) {
        console.error("Get poll error:", error.message)
        return res.status(500).json({ success: false, error: "Terjadi masalah server!" })
    }
}

export const updatePoll = async (req, res) => {
    const { pollId } = req.params
    const { status } = req.body

    if (!["draft", "published", "closed"].includes(status)) {
        return res.status(400).json({ success: false, error: "Status tidak valid!" })
    }

    try {
        // Cek kepemilikan: poll harus milik sesi guru yang login
        const ownerResult = await pool.query(
            `SELECT p.session_id, s.teacher_id
             FROM polls p
             JOIN sessions s ON s.id = p.session_id
             WHERE p.id = $1`,
            [pollId]
        )

        if (ownerResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Poll tidak ditemukan" })
        }

        if (ownerResult.rows[0].teacher_id !== req.user?.id) {
            return res.status(403).json({ success: false, error: "Anda bukan pemilik sesi ini!" })
        }

        let queryText = ""
        let values = []

        if (status === "published") {
            queryText = "UPDATE polls SET status = $1, published_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *"
            values = [status, pollId]
        } else if (status === "closed") {
            queryText = "UPDATE polls SET status = $1, closed_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *"
            values = [status, pollId]
        } else {
            queryText = "UPDATE polls SET status = $1 WHERE id = $2 RETURNING *"
            values = [status, pollId]
        }

        const updatePollResult = await pool.query(queryText, values)
        const updatedPoll = updatePollResult.rows[0]

        // Ambil opsi jawaban untuk dikirim ke klien.
        // ⚠ Bug 1: TIDAK mengambil kolom is_correct sama sekali, agar kunci
        // jawaban tidak bocor lewat WebSocket ke layar siswa.
        // Catatan: kolom di tabel poll_options adalah `id` (bukan `option_id`).
        const optionsResult = await pool.query(
            "SELECT id, poll_id, option_text, option_order FROM poll_options WHERE poll_id = $1 ORDER BY option_order ASC",
            [updatedPoll.id]
        )

        const fullPollData = {
            ...updatedPoll,
            options: optionsResult.rows
        }

        // ==========================================
        // ⚡ WEBSOCKET: beri tahu semua peserta di ruang sesi
        // ==========================================
        const io = req.app.get("io")
        if (io) {
            io.to(`session:${updatedPoll.session_id}`).emit("poll_updated", fullPollData)
        }

        res.status(200).json({ success: true, data: fullPollData })
    } catch (error) {
        console.error("Update poll error:", error.message)
        return res.status(400).json({ success: false, error: error.message })
    }
}