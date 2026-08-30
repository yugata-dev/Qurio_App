import pool from "../config/db/connection.js"

// Buat kode akses 6 digit acak
const generateAccessCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString()
}

// POST /api/sessions — buat sesi baru (guru)
export const createSession = async (req, res) => {
    const { title } = req.body
    const teacher_id = req.user?.id || req.body.teacher_id

    if (!title) {
        return res.status(400).json({ success: false, error: "Judul sesi wajib diisi!" })
    }

    if (!teacher_id) {
        return res.status(401).json({ success: false, error: "Tidak terdeteksi guru pembuat sesi!" })
    }

    try {
        const createdSessionResult = await pool.query(
            "INSERT INTO sessions (title, teacher_id, access_code) VALUES ($1, $2, $3) RETURNING *",
            [title, teacher_id, generateAccessCode()]
        )

        const newSession = createdSessionResult.rows[0]

        // ==========================================
        // ⚡ WEBSOCKET: beri tahu guru bahwa sesi berhasil dibuat
        // ==========================================
        const io = req.app.get("io")
        if (io) {
            io.to(`teacher:${teacher_id}`).emit("session_created", newSession)
        }

        res.status(201).json({ success: true, data: newSession })
    } catch (error) {
        console.error("Create session error:", error.message)
        return res.status(400).json({ success: false, error: "Pembuatan sesi mengalami kegagalan!" })
    }
}

// GET /api/sessions?teacher_id=... — daftar sesi milik guru
export const getSessions = async (req, res) => {
    const { teacher_id } = req.query

    if (!teacher_id) {
        return res.status(400).json({ success: false, error: "Parameter teacher_id wajib diisi!" })
    }

    try {
        const sessionsResult = await pool.query(
            "SELECT * FROM sessions WHERE teacher_id = $1 ORDER BY created_at DESC",
            [teacher_id]
        )

        res.status(200).json({ success: true, data: sessionsResult.rows })
    } catch (error) {
        console.error("Get sessions error:", error.message)
        return res.status(500).json({ success: false, error: "Sesi gagal dimuat!" })
    }
}

// GET /api/sessions/:id — detail satu sesi
export const getSession = async (req, res) => {
    const { id } = req.params

    try {
        const sessionResult = await pool.query(
            "SELECT * FROM sessions WHERE id = $1",
            [id]
        )

        if (sessionResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: "Sesi tidak ditemukan!" })
        }

        res.status(200).json({ success: true, data: sessionResult.rows[0] })
    } catch (error) {
        console.error("Get session error:", error.message)
        return res.status(500).json({ success: false, error: "Sesi gagal dimuat!" })
    }
}

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

