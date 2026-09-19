import pool from "../config/db/connection.js"

// ------------------------------------------------------------
// Helper: pecah teks jawaban menjadi kata-kata yang bisa dihitung
// ------------------------------------------------------------
const buildWordCounts = (text) => {
    const stopWords = new Set([
        // Kata hubung / umum (Bahasa Indonesia)
        "yang", "dan", "ini", "itu", "dari", "untuk", "dengan", "saya",
        "kami", "kamu", "mereka", "bisa", "akan", "adalah", "apa", "jika", "karena",
        "di", "ke", "pada", "atau", "tidak", "saat", "setelah", "sebelum", "ada",

        // Kata kasar (Bahasa Indonesia)
        "anjing", "anjrit", "anjir", "babi", "kunyuk", "monyet",
        "bangsat", "kontol", "memek", "pantek", "puki", "pepek",
        "goblok", "tolol", "geblek", "bego", "itil", "bajingan",

        // Kata kasar (Bahasa Inggris)
        "fuck", "fucking", "fucker", "shit", "shitting", "bullshit",
        "bitch", "bitches", "bastard", "asshole", "ass", "dick",
        "pussy", "cunt", "cock", "prick", "motherfucker", "dumbass",
        "idiot", "stupid"
    ])

    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .map((word) => word.trim())
        .filter((word) => word.length > 2 && !stopWords.has(word))
}

// ------------------------------------------------------------
// Helper: hitung frekuensi kata dari semua jawaban word cloud
// ------------------------------------------------------------
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
        .map(([text, count]) => ({ text, count }))
        .sort((a, b) => b.count - a.count)
}

// ------------------------------------------------------------
// 1) Siswa submit jawaban terbuka untuk word cloud
// ------------------------------------------------------------
export const submitWordCloudResponse = async (req, res) => {
    const { sessionId } = req.params
    const { participant_name, student_id, answer } = req.body

    try {
        const cleanAnswer = String(answer || "").trim()

        if (!participant_name || !String(participant_name).trim()) {
            return res.status(400).json({
                success: false,
                message: "Nama peserta wajib diisi."
            })
        }

        if (!cleanAnswer) {
            return res.status(400).json({
                success: false,
                message: "Jawaban tidak boleh kosong."
            })
        }

        // Cari poll word cloud yang aktif di sesi ini
        const pollQuery = await pool.query(
            `SELECT *
             FROM polls
             WHERE session_id = $1 AND type = 'wordcloud' AND status = 'published'
             ORDER BY created_at DESC
             LIMIT 1`,
            [sessionId]
        )

        if (pollQuery.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Word cloud belum dipublikasikan untuk sesi ini."
            })
        }

        const poll = pollQuery.rows[0]

        const insertResult = await pool.query(
            `INSERT INTO responses (poll_id, student_id, participant_name, answer, option_id, is_correct)
             VALUES ($1, $2, $3, $4, NULL, NULL)
             RETURNING *`,
            [poll.id, student_id || null, String(participant_name).trim(), cleanAnswer]
        )

        const wordCloudData = await calculateWordCloud(poll.id)

        const io = req.app.get("io")
        if (io) {
            io.to(`session:${sessionId}`).emit("wordcloud_updated", {
                session_id: sessionId,
                poll_id: poll.id,
                words: wordCloudData
            })
        }

        return res.status(201).json({
            success: true,
            data: {
                response: insertResult.rows[0],
                words: wordCloudData
            },
            message: "Jawaban word cloud berhasil dikirim."
        })
    } catch (error) {
        console.error("Submit word cloud error:", error.message)
        return res.status(500).json({
            success: false,
            message: "Jawaban word cloud gagal dikirim."
        })
    }
}

// ------------------------------------------------------------
// 2) Ambil hasil word cloud dari sesi tertentu
// ------------------------------------------------------------
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
