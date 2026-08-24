import pool from "../config/db/connection.js"

export const createSession = async (req, res) => {
    const { title, teacher_id } = req.body
    const code_access = Math.floor(Math.random() * (999999 - 100000) + 100000)
    try {
        const result = await pool.query(
            "INSERT INTO sessions (title, teacher_id, access_code) VALUES ($1, $2, $3) RETURNING *",
            [title, teacher_id, code_access]
        )
        res.status(201).json({ success: true, data: result.rows })
    } catch (error) {
        console.log("Error Database:", error);
        res.status(400).json({ success: false, error: "Pembuatan sesi mengalami kegagalan!!" })
    }
}

export const getSessions = async (req, res) => {
    const { teacher_id } = req.query

    if (!teacher_id) {
        return res.status(400).json({ success: false, error: "Parameter teacher_id wajib diisi!" })
    }

    try {
        const result = await pool.query(
            "SELECT * FROM sessions WHERE teacher_id = $1 ORDER BY created_at DESC",
            [teacher_id]
        )

        res.status(200).json({ success: true, data: result.rows })
    } catch (error) {
        console.log("Error Database:", error);
        res.status(500).json({ success: false, error: "Sesi gagal dimuat!!" })
    }
}

export const getSession = async (req, res) => {
    const id = req.params.id

    try {
        const result = await pool.query(
            "SELECT sessions.* FROM sessions WHERE id = $1",
            [id]
        )

        res.status(200).json({ success: true, data: result.rows })
    } catch (error) {
        console.log("Error Database:", error);
        res.status(404).json({ success: false, error: "Sesi tidak ditemukan!!" })
    }
}

export const updateSession = async (req, res) => {
    const { id } = req.params
    const { status } = req.body

    try {
        const result = await pool.query(
            "UPDATE sessions SET status = $1, ended_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
            [status, id]
        )

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: "Sesi tidak ditemukan!!" })
        }
        res.status(200).json({ success: true, data: result.rows[0] })
    } catch (error) {
        console.log("Error Update Session Database:", error);
        res.status(400).json({ success: false, error: "Gagal memperbarui data!!" })
    }
}

