import pool from "../config/db/connection.js"

export const createSession = async (req, res) => {
    const { title, teacher_id } = req.body
    const code_access = Math.floor(Math.random() * (999999 - 100000) + 100000)

    try {
        // ambil id guru bandingan dengan id users lalu cek juga role nya jika role nya guru maka bisa create guru

        const createdSessionResult = await pool.query(
            "INSERT INTO sessions (title, teacher_id, access_code) VALUES ($1, $2, $3) RETURNING *",
            [title, teacher_id, code_access]
        )


        res.status(201).json({ success: true, data: createdSessionResult.rows })
    } catch (error) {
        console.error("Create session error:", error.message)
        return res.status(400).json({ success: false, error: "Pembuatan sesi mengalami kegagalan!!" })
    }
}

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
        return res.status(500).json({ success: false, error: "Sesi gagal dimuat!!" })
    }
}

export const getSession = async (req, res) => {
    const { id } = req.params

    try {
        const sessionResult = await pool.query(
            "SELECT sessions.* FROM sessions WHERE id = $1",
            [id]
        )

        res.status(200).json({ success: true, data: sessionResult.rows })
    } catch (error) {
        console.error("Get session error:", error.message)
        return res.status(404).json({ success: false, error: "Sesi tidak ditemukan!!" })
    }
}

export const updateSession = async (req, res) => {
    const { id } = req.params
    const { status } = req.body

    try {
        const updatedSessionResult = await pool.query(
            "UPDATE sessions SET status = $1, ended_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
            [status, id]
        )

        if (updatedSessionResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: "Sesi tidak ditemukan!!" })
        }
        res.status(200).json({ success: true, data: updatedSessionResult.rows[0] })
    } catch (error) {
        console.error("Update session error:", error.message)
        return res.status(400).json({ success: false, error: "Terjadi kesalahan" })
    }
}

