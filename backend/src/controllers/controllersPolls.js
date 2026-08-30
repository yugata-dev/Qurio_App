import pool from "../config/db/connection.js"

const ALLOWED_POLL_TYPES = ["wordcloud", "polling", "qa", "quiz"]

// Helper: Hapus kunci jawaban sebelum dikirim ke siswa (WebSocket)
const sanitizeOptions = (options) =>
    options.map(({ is_correct, ...publicOpt }) => publicOpt)

// Helper: Validasi input pembuatan poll
const validatePollInput = (type, question, options) => {
    if (!ALLOWED_POLL_TYPES.includes(type)) return "Tipe soal tidak valid!"
    if (!question?.trim()) return "Pertanyaan wajib diisi!"

    const requiresOptions = type === "polling" || type === "quiz"
    if (requiresOptions) {
        if (!Array.isArray(options) || options.length === 0) {
            return "Options wajib berupa array non-kosong untuk polling/quiz!"
        }
        if (options.some(opt => !opt?.text?.trim())) {
            return "Setiap opsi wajib memiliki teks valid!"
        }
    }
    return null
}

// ----------------------------------------------------------------------
// 1. CREATE POLL
// ----------------------------------------------------------------------
export const createPoll = async (req, res) => {
    const { sessionId } = req.params
    const { type, question, options = [] } = req.body

    const validationError = validatePollInput(type, question, options)
    if (validationError) return res.status(400).json({ success: false, error: validationError })

    let client
    try {
        client = await pool.connect()

        // Cek kepemilikan sesi
        const sessionRes = await client.query("SELECT teacher_id FROM sessions WHERE id = $1", [sessionId])
        if (!sessionRes.rows.length) return res.status(404).json({ success: false, error: "Sesi tidak ditemukan!" })
        if (sessionRes.rows[0].teacher_id !== req.user?.id) {
            return res.status(403).json({ success: false, error: "Anda bukan pemilik sesi ini!" })
        }

        // Mulai Transaksi
        await client.query("BEGIN")

        const pollRes = await client.query(
            "INSERT INTO polls (session_id, type, question) VALUES ($1, $2, $3) RETURNING *",
            [sessionId, type, question]
        )
        const newPoll = pollRes.rows[0]
        const savedOptions = []

        if (["polling", "quiz"].includes(type)) {
            for (let i = 0; i < options.length; i++) {
                const { text, is_correct = false } = options[i]
                const optRes = await client.query(
                    "INSERT INTO poll_options (poll_id, option_text, is_correct, option_order) VALUES ($1, $2, $3, $4) RETURNING *",
                    [newPoll.id, text.trim(), is_correct, i + 1]
                )
                savedOptions.push(optRes.rows[0])
            }
        }

        await client.query("COMMIT")

        // Broadcast ke WebSocket (Tanpa kunci jawaban)
        const io = req.app.get("io")
        if (io) {
            io.to(`session:${sessionId}`).emit("poll_created", {
                ...newPoll,
                options: sanitizeOptions(savedOptions)
            })
        }

        // Response HTTP ke Guru (Lengkap dengan kunci jawaban)
        return res.status(201).json({
            success: true,
            data: { ...newPoll, options: savedOptions }
        })

    } catch (error) {
        if (client) await client.query("ROLLBACK").catch(() => { })
        console.error("Create poll error:", error.message)
        return res.status(400).json({ success: false, error: "Data gagal dibuat" })
    } finally {
        if (client) client.release()
    }
}

// ----------------------------------------------------------------------
// 2. GET ALL POLLS BY SESSION
// ----------------------------------------------------------------------
export const getPollsBySession = async (req, res) => {
    const { sessionId } = req.params

    try {
        const pollsRes = await pool.query(
            "SELECT * FROM polls WHERE session_id = $1 ORDER BY created_at ASC",
            [sessionId]
        )
        const optionsRes = await pool.query(
            "SELECT * FROM poll_options WHERE poll_id IN (SELECT id FROM polls WHERE session_id = $1) ORDER BY option_order ASC",
            [sessionId]
        )

        // Penggabungan data poll dan options
        const pollsWithOptions = pollsRes.rows.map(poll => ({
            ...poll,
            options: optionsRes.rows.filter(opt => opt.poll_id === poll.id)
        }))

        return res.status(200).json({ success: true, data: pollsWithOptions })
    } catch (error) {
        console.error("Get polls error:", error.message)
        return res.status(500).json({ success: false, error: "Terjadi masalah server!" })
    }
}

// ----------------------------------------------------------------------
// 3. GET SINGLE POLL
// ----------------------------------------------------------------------
export const getPoll = async (req, res) => {
    const { pollId } = req.params

    try {
        const pollRes = await pool.query("SELECT * FROM polls WHERE id = $1", [pollId])
        if (!pollRes.rows.length) return res.status(404).json({ success: false, message: "Poll tidak ditemukan" })

        const optionsRes = await pool.query(
            "SELECT * FROM poll_options WHERE poll_id = $1 ORDER BY option_order ASC",
            [pollId]
        )

        return res.status(200).json({
            success: true,
            data: { ...pollRes.rows[0], options: optionsRes.rows }
        })
    } catch (error) {
        console.error("Get poll error:", error.message)
        return res.status(500).json({ success: false, error: "Terjadi masalah server!" })
    }
}

// ----------------------------------------------------------------------
// 4. UPDATE POLL STATUS
// ----------------------------------------------------------------------
export const updatePoll = async (req, res) => {
    const { pollId } = req.params
    const { status } = req.body

    if (!["draft", "published", "closed"].includes(status)) {
        return res.status(400).json({ success: false, error: "Status tidak valid!" })
    }

    try {
        // Cek Akses / Kepemilikan Sesi
        const ownerRes = await pool.query(
            `SELECT p.session_id, s.teacher_id 
       FROM polls p 
       JOIN sessions s ON s.id = p.session_id 
       WHERE p.id = $1`,
            [pollId]
        )

        if (!ownerRes.rows.length) return res.status(404).json({ success: false, message: "Poll tidak ditemukan" })
        if (ownerRes.rows[0].teacher_id !== req.user?.id) {
            return res.status(403).json({ success: false, error: "Anda bukan pemilik sesi ini!" })
        }

        // Query update dinamis menggunakan timestamp sesuai status
        const timeColumn = status === "published" ? ", published_at = CURRENT_TIMESTAMP" :
            status === "closed" ? ", closed_at = CURRENT_TIMESTAMP" : ""

        const updatedPollRes = await pool.query(
            `UPDATE polls SET status = $1 ${timeColumn} WHERE id = $2 RETURNING *`,
            [status, pollId]
        )
        const updatedPoll = updatedPollRes.rows[0]

        // Ambil opsi publik tanpa `is_correct` untuk kebutuhan penyiaran/klien
        const optionsRes = await pool.query(
            "SELECT id, poll_id, option_text, option_order FROM poll_options WHERE poll_id = $1 ORDER BY option_order ASC",
            [updatedPoll.id]
        )

        const fullPollData = { ...updatedPoll, options: optionsRes.rows }

        // Broadcast update via WebSocket
        const io = req.app.get("io")
        if (io) {
            io.to(`session:${updatedPoll.session_id}`).emit("poll_updated", fullPollData)
        }

        return res.status(200).json({ success: true, data: fullPollData })
    } catch (error) {
        console.error("Update poll error:", error.message)
        return res.status(400).json({ success: false, error: error.message })
    }
}