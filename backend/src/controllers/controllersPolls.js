import pool from "../config/db/connection.js"

export const createPoll = async (req, res) => {
    // 1. Ambil sessionId dari URL params sesuai dengan nama di file router Anda
    const { sessionId } = req.params
    // 2. Ambil sisanya dari body JSON
    const { type, question, options } = req.body

    try {
        // Gunakan variabel sessionId di dalam query INSERT Anda
        const pollResult = await pool.query(
            "INSERT INTO polls (session_id, type, question) VALUES ($1, $2, $3) RETURNING *",
            [sessionId, type, question]
        )

        const pollId = pollResult.rows[0].id

        if (type === "polling" || type === "quiz") {

            if (options && Array.isArray(options)) {
                for (let i = 0; i < options.length; i++) {
                    const opt = options[i]
                    await pool.query(
                        "INSERT INTO poll_options (poll_id, option_text, is_correct, option_order) VALUES ($1, $2, $3, $4)",
                        [pollId, opt.text, opt.is_correct || false, i + 1]
                    )
                }
            }
        }

        // Kembalikan data poll utama yang berhasil dibuat
        res.status(201).json({ success: true, data: pollResult.rows[0] })

    } catch (error) {
        console.log("Error:", error)
        res.status(400).json({ success: false, error: "Data gagal dibuat" })
    }
}

export const getPollsBySession = (req, res) => { }
export const getPoll = (req, res) => { }
export const updatePoll = (req, res) => { }
