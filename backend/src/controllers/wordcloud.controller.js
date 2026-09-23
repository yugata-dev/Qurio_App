import pool from "../config/database/connection.js"

const buildWordCounts = (text) => {
    const stopWords = new Set([
        "yang", "dan", "ini", "itu", "dari", "untuk", "dengan", "saya",
        "kami", "kamu", "mereka", "bisa", "akan", "adalah", "apa", "jika", "karena",
        "di", "ke", "pada", "atau", "tidak", "saat", "setelah", "sebelum", "ada",
        "anjing", "anjrit", "anjir", "babi", "kunyuk", "monyet",
        "bangsat", "kontol", "memek", "pantek", "puki", "pepek",
        "goblok", "tolol", "geblek", "bego", "itil", "bajingan",
        "fuck", "fucking", "fucker", "shit", "shitting", "bullshit",
        "bitch", "bitches", "bastard", "asshole", "ass", "dick",
        "pussy", "cunt", "cock", "prick", "motherfucker", "dumbass",
        "idiot", "stupid"
    ])

    return String(text || "")
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .map((word) => word.trim())
        .filter((word) => word.length > 2 && !stopWords.has(word))
}

const calculateWordCloud = async (pollId) => {
    const result = await pool.query(
        "SELECT answer FROM responses WHERE poll_id = $1 AND answer IS NOT NULL",
        [pollId]
    )

    const counts = {}

    for (const row of result.rows) {
        const words = buildWordCounts(row.answer)
        for (const word of words) {
            counts[word] = (counts[word] || 0) + 1
        }
    }

    return Object.entries(counts)
        .map(([word, count]) => ({ word, count }))
        .sort((a, b) => b.count - a.count)
}

export const submitWordCloudResponse = async (req, res) => {
    const body = req.body || {}
    const pollId = body.poll_id ?? body.pollId
    const participantId = body.participant_id ?? body.participantId ?? null
    const word = body.word ?? body.answer ?? ""
    const cleanWord = String(word || "").trim()

    try {
        if (!pollId) {
            return res.status(400).json({
                success: false,
                message: "poll_id wajib diisi."
            })
        }

        if (!cleanWord) {
            return res.status(400).json({
                success: false,
                message: "Kata tidak boleh kosong."
            })
        }

        const pollResult = await pool.query(
            "SELECT id, session_id, type, status FROM polls WHERE id = $1",
            [pollId]
        )

        if (pollResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Poll tidak ditemukan."
            })
        }

        const poll = pollResult.rows[0]

        if (poll.type !== "wordcloud") {
            return res.status(400).json({
                success: false,
                message: "Endpoint ini hanya untuk tipe wordcloud."
            })
        }

        if (participantId) {
            const participantCheck = await pool.query(
                "SELECT id FROM participants WHERE id = $1 AND session_id = $2",
                [participantId, poll.session_id]
            )

            if (participantCheck.rows.length === 0) {
                return res.status(403).json({
                    success: false,
                    message: "Peserta tidak valid untuk sesi ini."
                })
            }
        }

        const duplicateCheck = await pool.query(
            "SELECT id FROM responses WHERE poll_id = $1 AND participant_id = $2",
            [pollId, participantId]
        )

        if (participantId && duplicateCheck.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Kamu sudah mengirim kata untuk poll ini."
            })
        }

        const insertResult = await pool.query(
            `INSERT INTO responses (poll_id, participant_id, answer, option_id, is_correct)
             VALUES ($1, $2, $3, NULL, NULL)
             RETURNING *`,
            [pollId, participantId || null, cleanWord]
        )

        const words = await calculateWordCloud(pollId)

        const io = req.app.get("io")
        if (io) {
            io.to(`session:${poll.session_id}`).emit("wordcloud_updated", {
                session_id: poll.session_id,
                poll_id: pollId,
                words
            })
        }

        return res.status(201).json({
            success: true,
            data: {
                response: insertResult.rows[0],
                words,
                poll_id: pollId,
                participant_id: participantId,
                word: cleanWord,
            },
            message: "Jawaban wordcloud berhasil dikirim."
        })
    } catch (error) {
        console.error("Submit word cloud error:", error.message)
        return res.status(500).json({
            success: false,
            message: "Jawaban wordcloud gagal dikirim."
        })
    }
}

export const getWordCloudResponsesByPoll = async (req, res) => {
    const { pollId } = req.params

    try {
        const pollResult = await pool.query(
            "SELECT id, session_id, type FROM polls WHERE id = $1",
            [pollId]
        )

        if (pollResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Poll tidak ditemukan."
            })
        }

        const words = await calculateWordCloud(pollId)

        return res.status(200).json({
            success: true,
            data: words
        })
    } catch (error) {
        console.error("Get wordcloud responses error:", error.message)
        return res.status(500).json({
            success: false,
            message: "Gagal mengambil data wordcloud."
        })
    }
}

export const getWordCloudResults = async (req, res) => {
    const { sessionId } = req.params

    try {
        const pollResult = await pool.query(
            `SELECT *
             FROM polls
             WHERE session_id = $1 AND type = 'wordcloud'
             ORDER BY created_at DESC
             LIMIT 1`,
            [sessionId]
        )

        if (pollResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Belum ada word cloud di sesi ini."
            })
        }

        const poll = pollResult.rows[0]
        const words = await calculateWordCloud(poll.id)

        return res.status(200).json({
            success: true,
            data: {
                session_id: sessionId,
                poll_id: poll.id,
                question: poll.question,
                words
            }
        })
    } catch (error) {
        console.error("Get word cloud results error:", error.message)
        return res.status(500).json({
            success: false,
            message: "Gagal mengambil hasil word cloud."
        })
    }
}
