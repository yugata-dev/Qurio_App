import pool from "../config/database/connection.js"

const ALLOWED_POLL_TYPES = ["wordcloud", "polling", "qa", "quiz"]

/**
 * Menghapus properti is_correct dari setiap opsi sebelum data dikirim ke siswa.
 * Informasi kunci jawaban tidak boleh terekspos sebelum poll ditutup.
 *
 * @param {Array} options - Daftar opsi jawaban
 * @returns {Array} Daftar opsi tanpa properti is_correct
 */
function sanitizeOptions(options) {
    return options.map((option) => {
        const { is_correct, ...safeOption } = option
        return safeOption
    })
}

/**
 * Memvalidasi input pembuatan poll berdasarkan tipe, pertanyaan, dan opsi.
 *
 * @param {string} type - Tipe poll yang diminta
 * @param {string} question - Teks pertanyaan
 * @param {Array} options - Daftar opsi jawaban
 * @returns {string|null} Pesan error jika tidak valid, null jika valid
 */
function validatePollInput(type, question, options) {
    if (!ALLOWED_POLL_TYPES.includes(type)) {
        return "Tipe soal tidak valid!"
    }

    const cleanQuestion = question ? String(question).trim() : ""
    if (!cleanQuestion) {
        return "Pertanyaan wajib diisi!"
    }

    const requiresOptions = (type === "polling" || type === "quiz")
    if (requiresOptions) {
        if (!Array.isArray(options) || options.length === 0) {
            return "Options wajib berupa array non-kosong untuk polling/quiz!"
        }

        for (const opt of options) {
            const optText = opt && opt.text ? String(opt.text).trim() : ""
            if (!optText) {
                return "Setiap opsi wajib memiliki teks valid!"
            }
        }
    }

    return null
}

// ====================================================================
// 1. CREATE POLL
// Membuat soal baru di dalam sesi dan menutup poll yang sedang aktif.
// ====================================================================
export const createPoll = async (req, res) => {
    const { sessionId } = req.params
    const { type, question, options = [] } = req.body

    // Validasi input dari client
    const validationError = validatePollInput(type, question, options)
    if (validationError) {
        return res.status(400).json({ success: false, message: validationError })
    }

    const status = "published"

    let client
    try {
        client = await pool.connect()
        await client.query("BEGIN")

        // Kunci baris sesi untuk mencegah perubahan lifecycle secara bersamaan
        const sessionRes = await client.query(
            "SELECT teacher_id FROM sessions WHERE id = $1 FOR UPDATE",
            [sessionId]
        )

        if (sessionRes.rows.length === 0) {
            await client.query("ROLLBACK")
            return res.status(404).json({ success: false, message: "Sesi tidak ditemukan!" })
        }

        // Verifikasi kepemilikan sesi oleh guru yang terautentikasi
        const teacherId = sessionRes.rows[0].teacher_id
        const loggedInTeacherId = req.user ? req.user.id : null
        if (teacherId !== loggedInTeacherId) {
            await client.query("ROLLBACK")
            return res.status(403).json({ success: false, message: "Anda bukan pemilik sesi ini!" })
        }

        // Tutup semua poll yang masih berstatus published sebelum membuat poll baru
        await client.query(
            `UPDATE polls
             SET status = 'closed', closed_at = CURRENT_TIMESTAMP
             WHERE session_id = $1 AND status = 'published'`,
            [sessionId]
        )

        // Simpan data poll ke database
        const pollRes = await client.query(
            `INSERT INTO polls (session_id, type, question, status, published_at)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [sessionId, type, question, status, new Date()]
        )
        const newPoll = pollRes.rows[0]
        const savedOptions = []

        // Simpan opsi jawaban untuk tipe polling dan quiz
        if (type === "polling" || type === "quiz") {
            for (let i = 0; i < options.length; i++) {
                const optionText = options[i].text.trim()
                const isCorrect = options[i].is_correct === true ? true : false
                const optionOrder = i + 1

                const optRes = await client.query(
                    "INSERT INTO poll_options (poll_id, option_text, is_correct, option_order) VALUES ($1, $2, $3, $4) RETURNING *",
                    [newPoll.id, optionText, isCorrect, optionOrder]
                )
                savedOptions.push(optRes.rows[0])
            }
        }

        await client.query("COMMIT")

        // Broadcast ke seluruh peserta sesi melalui WebSocket
        // Kunci jawaban disanitasi agar tidak terekspos ke siswa
        const io = req.app.get("io")
        if (io) {
            io.to(`session:${sessionId}`).emit("poll_created", {
                ...newPoll,
                options: sanitizeOptions(savedOptions)
            })
        }

        // Response ke guru menyertakan data lengkap termasuk kunci jawaban
        return res.status(201).json({
            success: true,
            data: { ...newPoll, options: savedOptions }
        })

    } catch (error) {
        if (client) {
            await client.query("ROLLBACK").catch(() => { })
        }
        console.error("Create poll error:", error)
        return res.status(500).json({ success: false, message: "Gagal membuat soal" })
    } finally {
        if (client) {
            client.release()
        }
    }
}

// ====================================================================
// 2. GET ALL POLLS BY SESSION
// Mengambil seluruh soal beserta opsinya dalam satu sesi.
// ====================================================================
export const getPollsBySession = async (req, res) => {
    const { sessionId } = req.params

    try {
        // Ambil semua poll dalam sesi ini
        const pollsRes = await pool.query(
            "SELECT * FROM polls WHERE session_id = $1 ORDER BY created_at ASC",
            [sessionId]
        )

        // Ambil semua opsi terkait poll dalam sesi ini
        const optionsRes = await pool.query(
            "SELECT * FROM poll_options WHERE poll_id IN (SELECT id FROM polls WHERE session_id = $1) ORDER BY option_order ASC",
            [sessionId]
        )

        // Gabungkan setiap poll dengan opsinya masing-masing
        const pollsWithOptions = pollsRes.rows.map(poll => {
            const pollOptions = optionsRes.rows.filter(opt => opt.poll_id === poll.id)
            return {
                ...poll,
                options: pollOptions
            }
        })

        return res.status(200).json({ success: true, data: pollsWithOptions })
    } catch (error) {
        console.error("Get polls error:", error.message)
        return res.status(500).json({ success: false, message: "Gagal mengambil soal" })
    }
}

// ====================================================================
// 3. GET SINGLE POLL
// Mengambil detail satu soal spesifik beserta opsinya.
// ====================================================================
export const getPoll = async (req, res) => {
    const { pollId } = req.params

    try {
        // Ambil detail poll berdasarkan ID
        const pollRes = await pool.query(
            "SELECT * FROM polls WHERE id = $1",
            [pollId]
        )

        if (pollRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Soal tidak ditemukan" })
        }

        // Ambil seluruh opsi jawaban untuk poll ini
        const optionsRes = await pool.query(
            "SELECT * FROM poll_options WHERE poll_id = $1 ORDER BY option_order ASC",
            [pollId]
        )

        const pollData = {
            ...pollRes.rows[0],
            options: optionsRes.rows
        }

        return res.status(200).json({
            success: true,
            data: pollData
        })
    } catch (error) {
        console.error("Get poll error:", error.message)
        return res.status(500).json({ success: false, message: "Gagal mengambil soal" })
    }
}

// ====================================================================
// UPDATE ALL POLLS STATUS IN A SESSION
// Endpoint: PATCH /api/sessions/:sessionId/polls/status
// Mengubah status seluruh poll dalam satu sesi secara massal.
// ====================================================================
export const updateAllPollsBySession = async (req, res) => {
    const { sessionId } = req.params;
    const { status } = req.body;

    // Validasi nilai status yang diperbolehkan
    const validStatuses = ["draft", "published", "closed"];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: "Status tidak valid! (draft/published/closed)" });
    }

    if (status === "published") {
        return res.status(400).json({
            success: false,
            message: "Publish harus dilakukan untuk satu poll, bukan seluruh sesi."
        });
    }

    let client
    try {
        client = await pool.connect()
        await client.query("BEGIN")

        // Verifikasi keberadaan sesi dan kepemilikannya
        const sessionRes = await client.query(
            `SELECT id, teacher_id FROM sessions WHERE id = $1 FOR UPDATE`,
            [sessionId]
        );

        if (sessionRes.rows.length === 0) {
            await client.query("ROLLBACK")
            return res.status(404).json({ success: false, message: "Sesi tidak ditemukan." });
        }

        const teacherId = sessionRes.rows[0].teacher_id;
        const loggedInTeacherId = req.user ? req.user.id : null;

        if (teacherId !== loggedInTeacherId) {
            await client.query("ROLLBACK")
            return res.status(403).json({ success: false, message: "Anda bukan pemilik sesi ini!" });
        }

        // Perbarui status seluruh poll dalam sesi ini
        let query = "UPDATE polls SET status = $1";
        if (status === "published") {
            query += ", published_at = CURRENT_TIMESTAMP, closed_at = NULL";
        } else if (status === "closed") {
            query += ", closed_at = CURRENT_TIMESTAMP";
        } else {
            query += ", published_at = NULL, closed_at = NULL";
        }

        query += " WHERE session_id = $2 RETURNING *";

        const updatedPollsRes = await client.query(query, [status, sessionId]);
        const updatedPolls = updatedPollsRes.rows;

        if (updatedPolls.length === 0) {
            await client.query("ROLLBACK")
            return res.status(404).json({
                success: false,
                message: "Tidak ada poll yang ditemukan di sesi ini."
            });
        }

        await client.query("COMMIT")

        // Broadcast perubahan status ke seluruh peserta sesi
        const io = req.app.get("io");
        if (io) {
            io.to(`session:${sessionId}`).emit("all_polls_updated", {
                sessionId,
                status,
                polls: updatedPolls
            });
        }

        return res.status(200).json({
            success: true,
            message: `Semua poll berhasil diubah menjadi ${status}`,
            data: updatedPolls
        });

    } catch (error) {
        if (client) await client.query("ROLLBACK").catch(() => { })
        console.error("Bulk update poll error:", error.message);
        return res.status(500).json({ success: false, message: "Gagal mengubah status semua poll" });
    } finally {
        if (client) client.release()
    }
};

// ====================================================================
// UPDATE SINGLE POLL
// Mengubah status satu poll (khusus tipe quiz).
// ====================================================================
export const updatePoll = async (req, res) => {
    const { pollId } = req.params;
    const { status } = req.body;

    // Validasi nilai status yang diperbolehkan
    const validStatuses = ["draft", "published", "closed"];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: "Status tidak valid! (draft/published/closed)" });
    }

    let client
    try {
        client = await pool.connect()
        await client.query("BEGIN")

        // Ambil data poll beserta informasi kepemilikan sesi
        const pollRes = await client.query(
            `SELECT p.id, p.type, p.session_id, s.teacher_id
             FROM polls p
             JOIN sessions s ON p.session_id = s.id
             WHERE p.id = $1`,
            [pollId]
        );

        if (pollRes.rows.length === 0) {
            await client.query("ROLLBACK")
            return res.status(404).json({ success: false, message: "Poll tidak ditemukan." });
        }

        const poll = pollRes.rows[0];

        // Endpoint ini hanya diperuntukkan bagi tipe quiz
        if (poll.type !== "quiz") {
            await client.query("ROLLBACK")
            return res.status(400).json({
                success: false,
                message: "Endpoint ini hanya untuk poll bertipe quiz."
            });
        }

        // Verifikasi kepemilikan sesi
        const teacherId = pollRes.rows[0].teacher_id;
        const loggedInTeacherId = req.user ? req.user.id : null;

        if (teacherId !== loggedInTeacherId) {
            await client.query("ROLLBACK")
            return res.status(403).json({ success: false, message: "Anda bukan pemilik sesi ini!" });
        }

        // Kunci baris sesi dan poll untuk mencegah race condition
        await client.query("SELECT id FROM sessions WHERE id = $1 FOR UPDATE", [poll.session_id])
        const lockedPollRes = await client.query(
            "SELECT id FROM polls WHERE id = $1 FOR UPDATE",
            [pollId]
        )

        if (lockedPollRes.rows.length === 0) {
            await client.query("ROLLBACK")
            return res.status(404).json({ success: false, message: "Poll tidak ditemukan." });
        }

        // Tutup poll lain yang sedang published sebelum mempublikasikan poll ini
        if (status === "published") {
            await client.query(
                `UPDATE polls
                 SET status = 'closed', closed_at = CURRENT_TIMESTAMP
                 WHERE session_id = $1 AND status = 'published' AND id <> $2`,
                [poll.session_id, pollId]
            )
        }

        // Perbarui status poll yang dituju
        let query = "UPDATE polls SET status = $1";
        if (status === "published") {
            query += ", published_at = CURRENT_TIMESTAMP, closed_at = NULL";
        } else if (status === "closed") {
            query += ", closed_at = CURRENT_TIMESTAMP";
        } else {
            query += ", published_at = NULL, closed_at = NULL";
        }
        query += " WHERE id = $2 RETURNING *";

        const updatedRes = await client.query(query, [status, pollId]);
        if (updatedRes.rows.length === 0) {
            await client.query("ROLLBACK")
            return res.status(404).json({ success: false, message: "Poll tidak ditemukan." });
        }
        const updatedPoll = updatedRes.rows[0];
        await client.query("COMMIT");

        // Broadcast perubahan status poll ke seluruh peserta sesi
        const io = req.app.get("io");
        if (io) {
            io.to(`session:${poll.session_id}`).emit("poll_updated", {
                pollId,
                status,
                poll: updatedPoll
            });
        }

        return res.status(200).json({
            success: true,
            message: `Poll berhasil diubah menjadi ${status}`,
            data: updatedPoll
        });

    } catch (error) {
        if (client) await client.query("ROLLBACK").catch(() => { })
        console.error("Update single poll error:", error.message);
        return res.status(500).json({ success: false, message: "Gagal mengubah status poll" });
    } finally {
        if (client) client.release()
    }
};

// ====================================================================
// GET POLLS FOR STUDENT
// Mengambil satu poll aktif untuk siswa tanpa menyertakan kunci jawaban.
// ====================================================================
export const getPollsForStudent = async (req, res) => {
    const { sessionId } = req.params;

    let client

    try {
        client = await pool.connect()
        await client.query("BEGIN")

        // Ambil poll aktif (published) terbaru dalam sesi ini
        const publishedPollsRes = await client.query(
            `SELECT *
             FROM polls
             WHERE session_id = $1
             AND status = 'published'
             ORDER BY published_at DESC NULLS LAST, created_at DESC`,
            [sessionId]
        )

        if (publishedPollsRes.rows.length === 0) {
            await client.query("COMMIT")
            return res.status(404).json({
                success: false,
                message: "Tidak ada soal aktif saat ini untuk sesi ini."
            })
        }

        const canonicalPoll = publishedPollsRes.rows[0]

        // Tutup poll duplikat yang masih berstatus published (jika ada)
        if (publishedPollsRes.rows.length > 1) {
            const stalePollIds = publishedPollsRes.rows.slice(1).map(poll => poll.id)

            if (stalePollIds.length > 0) {
                await client.query(
                    `UPDATE polls
                     SET status = 'closed',
                         closed_at = CURRENT_TIMESTAMP
                     WHERE session_id = $1
                       AND status = 'published'
                       AND id = ANY($2)`,
                    [sessionId, stalePollIds]
                )
            }
        }

        await client.query("COMMIT")

        // Quiz dan polling memerlukan data opsi (tanpa kunci jawaban)
        if (canonicalPoll.type === "quiz" || canonicalPoll.type === "polling") {
            const getDataPollOption = await client.query(
                `SELECT
                    id,
                    poll_id,
                    option_text,
                    option_order
                 FROM poll_options
                 WHERE poll_id = $1
                 ORDER BY option_order ASC`,
                [canonicalPoll.id]
            )

            return res.status(200).json({
                success: true,
                message: "Poll berhasil didapat!",
                data: {
                    ...canonicalPoll,
                    options: getDataPollOption.rows
                }
            })
        }

        // Tipe poll selain quiz dan polling tidak memerlukan opsi
        return res.status(200).json({
            success: true,
            message: "Poll berhasil didapat!",
            data: {
                ...canonicalPoll,
                options: []
            }
        })

    } catch (error) {
        if (client) {
            await client.query("ROLLBACK").catch(() => { })
        }

        console.error("Get data poll error:", error.message)

        return res.status(500).json({
            success: false,
            message: "Gagal mengambil data Soal"
        })
    } finally {
        if (client) {
            client.release()
        }
    }
};