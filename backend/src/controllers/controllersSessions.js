import pool from \"../config/db/connection.js\"

// ====================================================================
// Helper: Generate kode akses 6 digit acak untuk sesi
// Digunakan siswa untuk join ke sesi
// ====================================================================
function generateAccessCode() {
    const minCode = 100000  // Angka terkecil 6 digit
    const maxCode = 999999  // Angka terbesar 6 digit
    const randomNumber = Math.floor(Math.random() * (maxCode - minCode + 1)) + minCode
    return randomNumber.toString()
} "

// ====================================================================
// POST SESSION (Guru membuat sesi baru)
// ====================================================================
export const createSession = async (req, res) => {
    const { title } = req.body

    // Step 1: Ambil ID guru dari token JWT yang sudah diverifikasi
    const teacherId = req.user ? req.user.id : null

    // Step 2: Validasi input dari guru
    if (!title) {
        return res.status(400).json({
            success: false, message: \"Judul sesi wajib diisi!\" })
    }

    if (!teacherId) {
            return res.status(401).json({
                success: false, message: \"Tidak terdeteksi guru pembuat sesi!\" })
    }

    try {
                // Step 3: Buat sesi baru di database dengan kode akses acak
                const createdSessionResult = await pool.query(
            \"INSERT INTO sessions (title, teacher_id, access_code) VALUES ($1, $2, $3) RETURNING *\",
[title, teacherId, generateAccessCode()]
        )

const newSession = createdSessionResult.rows[0]

// Step 4: Broadcast ke WebSocket sehingga guru menerima notifikasi sesi baru
const io = req.app.get(\"io\")
        if (io) {
    io.to(`teacher:${teacherId}`).emit(\"session_created\", newSession)
        }

res.status(201).json({ success: true, data: newSession })
    } catch (error) {
    console.error(\"Create session error:\", error.message)
        return res.status(500).json({
        success: false, message: \"Pembuatan sesi mengalami kegagalan!\" })
    }
} "

// ====================================================================
// GET SESSIONS (Guru mengambil daftar sesi miliknya)
// ====================================================================
export const getSessions = async (req, res) => {
    const { teacher_id } = req.query

    // Validasi parameter
    if (!teacher_id) {
        return res.status(400).json({
            success: false, message: \"Parameter teacher_id wajib diisi!\" })
    }

    try {
            // Ambil semua sesi milik guru, urutkan dari yang paling baru
            const sessionsResult = await pool.query(
            \"SELECT * FROM sessions WHERE teacher_id = $1 ORDER BY created_at DESC\",
[teacher_id]
        )

res.status(200).json({ success: true, data: sessionsResult.rows })
    } catch (error) {
    console.error(\"Get sessions error:\", error.message)
        return res.status(500).json({
        success: false, message: \"Sesi gagal dimuat!\" })
    }
}

// ====================================================================
// GET SESSION (Ambil detail satu sesi spesifik)
// ====================================================================
export const getSession = async (req, res) => {
    const { id } = req.params

    try {
        // Ambil detail sesi berdasarkan ID
        const sessionResult = await pool.query(
            \"SELECT * FROM sessions WHERE id = $1\",
[id]
        )

if (sessionResult.rows.length === 0) {
    return res.status(404).json({
        success: false, message: \"Sesi tidak ditemukan!\" })
        }

        res.status(200).json({ success: true, data: sessionResult.rows[0] })
    } catch (error) {
    console.error(\"Get session error:\", error.message)
        return res.status(500).json({
        success: false, message: \"Sesi gagal dimuat!\" })
    }
} "

// PUT /api/sessions/:id — ubah status sesi (active/ended), hanya guru pemilik
export const updateSession = async (req, res) => {
    const { id } = req.params
    const { status } = req.body

    try {
        // Cek kepemilikan: hanya guru yang punya sesi ini yang boleh mengubahnya
        const ownerResult = await pool.query(
            "SELECT teacher_id FROM sessions WHERE id = $1",
            [id]
        )

        if (ownerResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: "Sesi tidak ditemukan!" })
        }

        if (ownerResult.rows[0].teacher_id !== req.user?.id) {
            return res.status(403).json({ success: false, error: "Anda bukan pemilik sesi ini!" })
        }

        const updatedSessionResult = await pool.query(
            `UPDATE sessions
             SET status = $1,
                 ended_at = CASE WHEN $1 = 'ended' THEN CURRENT_TIMESTAMP ELSE ended_at END
             WHERE id = $2
             RETURNING *`,
            [status, id]
        )

        const updatedSession = updatedSessionResult.rows[0]

        // ==========================================
        // ⚡ WEBSOCKET: beri tahu semua peserta di ruang sesi
        // ==========================================
        const io = req.app.get("io")
        if (io) {
            io.to(`session:${id}`).emit("session_updated", updatedSession)
            if (status === "ended") {
                io.to(`session:${id}`).emit("session_ended", updatedSession)
            }
        }

        res.status(200).json({ success: true, data: updatedSession })
    } catch (error) {
        console.error("Update session error:", error.message)
        return res.status(400).json({ success: false, error: "Terjadi kesalahan" })
    }
}

