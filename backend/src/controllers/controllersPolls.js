import pool from "../config/db/connection.js"

export const createPoll = async (req, res) => {
    const { sessionId } = req.params
    const { type, question, options } = req.body

    try {
        const pollResult = await pool.query(
            "INSERT INTO polls (session_id, type, question) VALUES ($1, $2, $3) RETURNING *",
            [sessionId, type, question]
        )

        const newPoll = pollResult.rows[0]
        let savedOptions = []

        if (type === "polling" || type === "quiz") {
            if (options && Array.isArray(options)) {
                const promisesOption = options.map((opt, i) => {
                    return pool.query(
                        "INSERT INTO poll_options (poll_id, option_text, is_correct, option_order) VALUES ($1, $2, $3, $4) RETURNING *",
                        [newPoll.id, opt.text, opt.is_correct || false, i + 1]
                    );
                })

                const optionResult = await Promise.all(promisesOption)
                savedOptions = optionResult.map(result => result.rows[0])
            }
        }

        const fullPollData = {
            ...newPoll,
            options: savedOptions
        }

        // ==========================================
        // ⚡ WEBSOCKET: Pancarkan sinyal ke room session ini
        // ==========================================
        const io = req.app.get("io")
        if (io) {
            io.to(sessionId).emit("poll_created", fullPollData)
        }

        res.status(201).json({
            success: true,
            data: fullPollData
        })

    } catch (error) {
        console.error("Create poll error:", error.message)
        return res.status(400).json({ success: false, error: "Data gagal dibuat" })
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
        return res.status(500).json({ success: false, error: "Terjadi masalah server!!" })
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
        return res.status(500).json({ success: false, error: error.message })
    }
}

export const updatePoll = async (req, res) => {
    const { pollId } = req.params
    const { status } = req.body // Menerima: 'draft', 'published', atau 'closed'

    try {
        let queryText = ""
        let values = []

        if (status === "published") {
            queryText = `
                UPDATE polls 
                SET status = $1, published_at = CURRENT_TIMESTAMP 
                WHERE id = $2 
                RETURNING *
            `
            values = [status, pollId]

        } else if (status === "closed") {
            queryText = `
                UPDATE polls 
                SET status = $1, closed_at = CURRENT_TIMESTAMP 
                WHERE id = $2 
                RETURNING *
            `
            values = [status, pollId]

        } else {
            queryText = `
                UPDATE polls 
                SET status = $1 
                WHERE id = $2 
                RETURNING *
            `
            values = [status, pollId]
        }

        const updatePollResult = await pool.query(queryText, values)

        if (updatePollResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Poll tidak ditemukan" })
        }

        const updatedPoll = updatePollResult.rows[0]

        // ==========================================
        // ⚡ WEBSOCKET: Kirim kabar perubahan status (Published/Closed)
        // ==========================================
        const io = req.app.get("io")
        if (io) {
            // Mengirim ke ruang kelas spesifik (session_id)
            io.to(updatedPoll.session_id).emit("poll_updated", updatedPoll)
        }

        res.status(200).json({ success: true, data: updatedPoll })

    } catch (error) {
        console.error("Update poll error:", error.message)
        return res.status(400).json({ success: false, error: error.message })
    }
}