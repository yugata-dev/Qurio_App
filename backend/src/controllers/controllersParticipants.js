import pool from "../config/db/connection.js";

export const joinSession = async (req, res) => {
    const { access_code, nama, absen } = req.body
    try {

        if (!nama || !absen || !access_code) {
            return res.status(400).json({
                success: false,
                message: "Input code, nama dan absen wajib di isi."
            })
        }

        const sessionCodeAccess = await pool.query("SELECT id FROM sessions WHERE access_code = $1", [access_code])

        if (sessionCodeAccess.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Kode tidak cocok!"
            })
        }

        const foundSessionId = sessionCodeAccess.rows[0]?.id

        const existingParticipants = await pool.query("SELECT * FROM participants WHERE session_id = $1 AND absen = $2", [foundSessionId, absen])

        if (existingParticipants.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Anda sudah bergabung dengan sesi ini!",
                data: existingParticipants.rows[0]
            })
        }

        const newParticipant = await pool.query("INSERT INTO participants (session_id, name, absen) VALUES ($1, $2, $3) RETURNING *",
            [foundSessionId, nama, absen]
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

