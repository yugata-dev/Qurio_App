import pool from "../config/db/connection.js";

export const joinSession = async (req, res) => {
    const { sessionId } = req.params
    const { nama, absen } = req.body
    try {
        if (!nama || !absen) {
            return res.status(400).json({
                success: false,
                message: "Input nama dan absen wajib di isi."
            })
        }

        const sessionCheck = await pool.query("SELECT id FROM sessions WHERE id = $1", [sessionId])

        if (sessionCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Sesi tidak ditemukan!"
            })
        }

        const existingParticipants = await pool.query("SELECT * FROM participants WHERE sessions_id = $1 AND absen = $2", [sessionId, absen])

        if (existingParticipants.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Anda sudah bergabung dengan sesi ini!",
                data: existingParticipants.rows[0]
            })
        }

        const newParticipant = pool.query("INSERT INTO (session_id, name, absen) VALUES ($1, $2, $3) RETURNING *",
            [sessionId, name, absen]
        )

        return res.status(201).json({
            success: true,
            message: "Berhasil bergabung dengan sesi",
            data: newParticipant.rows[0]
        })

    } catch (error) {
        console.error("Join session error:", error)

        if (error.code === "23505") {
            return res.status(409).json({
                success: false
                , message: "Absen ini sudah digunakan di sesi ini."
            })
        }

        return res.status(500).json({
            success: false,
            message: "Gagal bergabung sesi"
        })

    }
}