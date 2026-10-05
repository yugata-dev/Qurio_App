import pool from "../config/database/connection.js";

// ====================================================================
// Helper: Generate kode akses 6 digit acak untuk sesi
// Digunakan siswa untuk join ke sesi
// ====================================================================
function generateAccessCode() {
  const minCode = 100000; // Angka terkecil 6 digit
  const maxCode = 999999; // Angka terbesar 6 digit
  const randomNumber =
    Math.floor(Math.random() * (maxCode - minCode + 1)) + minCode;
  return randomNumber.toString();
}

function validateClassSize(classSize) {
  const normalizedClassSize =
    classSize === undefined || classSize === null || classSize === ""
      ? null
      : classSize;

  if (
    normalizedClassSize !== null &&
    (typeof normalizedClassSize !== "number" ||
      !Number.isInteger(normalizedClassSize) ||
      normalizedClassSize < 1 ||
      normalizedClassSize > 500)
  ) {
    return {
      valid: false,
      message: "Jumlah siswa harus berupa angka antara 1 dan 500.",
    };
  }

  return {
    valid: true,
    value: normalizedClassSize,
  };
}

// ====================================================================
// POST SESSION (Guru membuat sesi baru)
// ====================================================================
export const createSession = async (req, res) => {
  const { title, class_size, mode } = req.body;

  const allowedModes = ["interactive", "quiz"];

  // Step 1: Ambil ID guru dari token JWT yang sudah diverifikasi
  const teacherId = req.user ? req.user.id : null;

  // Step 2: Validasi input dari guru
  if (!title) {
    return res.status(400).json({
      success: false,
      message: "Judul sesi wajib diisi!",
    });
  }

  if (!teacherId) {
    return res.status(401).json({
      success: false,
      message: "Tidak terdeteksi guru pembuat sesi!",
    });
  }

  const normalizedMode = mode === undefined || mode === null || mode === "" ? "interactive" : mode;
  if (!allowedModes.includes(normalizedMode)) {
    return res.status(400).json({
      success: false,
      message: "Mode sesi harus berupa 'interactive' atau 'quiz'.",
    });
  }

  const classSizeValidation = validateClassSize(class_size);
  if (!classSizeValidation.valid) {
    return res.status(400).json({
      success: false,
      message: classSizeValidation.message,
    });
  }

  try {
    // Step 3: Buat sesi baru di database dengan kode akses acak
    const createdSessionResult = await pool.query(
      "INSERT INTO sessions (title, teacher_id, access_code, status, class_size, mode) VALUES ($1, $2, $3, 'active', $4, $5) RETURNING *",
      [title, teacherId, generateAccessCode(), classSizeValidation.value, normalizedMode],
    );

    const newSession = createdSessionResult.rows[0];

    // Step 4: Broadcast ke WebSocket sehingga guru menerima notifikasi sesi baru
    const io = req.app.get("io");
    if (io) {
      io.to(`teacher:${teacherId}`).emit("session_created", newSession);
    }

    res.status(201).json({ success: true, data: newSession });
  } catch (error) {
    console.error("Create session error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Pembuatan sesi mengalami kegagalan!",
    });
  }
};

// ====================================================================
// GET SESSIONS (Guru mengambil daftar sesi miliknya)
// ====================================================================
export const getSessions = async (req, res) => {
  const teacher_id = req.user.id;

  // Validasi parameter
  if (!teacher_id) {
    return res.status(400).json({
      success: false,
      message: "Parameter teacher_id wajib diisi!",
    });
  }

  try {
    // Step 1: Ambil semua sesi milik guru, urutkan dari yang paling baru
    const sessionsResult = await pool.query(
      `
  SELECT
    s.*,
    COUNT(p.id)::int AS participant_count
  FROM sessions s
  LEFT JOIN participants p
    ON p.session_id = s.id
  WHERE s.teacher_id = $1
  GROUP BY s.id
  ORDER BY s.created_at DESC
  `,
      [teacher_id],
    );

    res.status(200).json({ success: true, data: sessionsResult.rows });
  } catch (error) {
    console.error("Get sessions error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Sesi gagal dimuat!",
    });
  }
};

// ====================================================================
// GET SESSION (Ambil detail satu sesi spesifik)
// ====================================================================
export const getSession = async (req, res) => {
  const { id } = req.params;

  try {
    // Ambil detail sesi berdasarkan ID
    const sessionResult = await pool.query(
      "SELECT * FROM sessions WHERE id = $1",
      [id],
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Sesi tidak ditemukan!",
      });
    }

    const teacherId = sessionResult.rows[0].teacher_id;
    const loggedInTeacherId = req.user ? req.user.id : null;
    if (teacherId !== loggedInTeacherId) {
      return res
        .status(403)
        .json({ success: false, message: "Anda bukan pemilik sesi ini!" });
    }

    res.status(200).json({ success: true, data: sessionResult.rows[0] });
  } catch (error) {
    console.error("Get session error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Sesi gagal dimuat!",
    });
  }
};

export const getPublicSession = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "SELECT id, title, access_code, status FROM sessions WHERE id = $1",
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Sesi tidak ditemukan!",
      });
    }

    return res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error("Get public session error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Sesi gagal dimuat!",
    });
  }
};

// ====================================================================
// PUT SESSION (Ubah status sesi: active/ended, hanya guru pemilik)
// ====================================================================
export const updateSession = async (req, res) => {
  const { id } = req.params;
  const { status, class_size } = req.body;

  try {
    if (
      status !== undefined &&
      status !== null &&
      status !== "active" &&
      status !== "ended"
    ) {
      return res.status(400).json({
        success: false,
        message: "Status sesi harus active atau ended.",
      });
    }

    const hasClassSizeField = Object.prototype.hasOwnProperty.call(
      req.body,
      "class_size",
    );
    const classSizeValidation = validateClassSize(class_size);
    if (
      hasClassSizeField &&
      class_size !== undefined &&
      class_size !== null &&
      !classSizeValidation.valid
    ) {
      return res.status(400).json({
        success: false,
        message: classSizeValidation.message,
      });
    }

    // Cek kepemilikan: hanya guru yang punya sesi ini yang boleh mengubahnya
    const ownerResult = await pool.query(
      "SELECT teacher_id FROM sessions WHERE id = $1",
      [id],
    );

    if (ownerResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Sesi tidak ditemukan!",
      });
    }

    if (ownerResult.rows[0].teacher_id !== req.user?.id) {
      return res.status(403).json({
        success: false,
        message: "Anda bukan pemilik sesi ini!",
      });
    }

    const updates = [];
    const values = [];

    if (status !== undefined && status !== null) {
      updates.push("status = $" + (values.length + 1));
      values.push(status);

      const endedAt = status === "ended" ? new Date() : null;
      updates.push("ended_at = $" + (values.length + 1));
      values.push(endedAt);
    }

    if (hasClassSizeField) {
      updates.push("class_size = $" + (values.length + 1));
      values.push(classSizeValidation.value);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Tidak ada data yang diubah.",
      });
    }

    values.push(id);
    const updatedSessionResult = await pool.query(
      `UPDATE sessions
             SET ${updates.join(", ")}
             WHERE id = $${values.length}
             RETURNING *`,
      values,
    );

    const updatedSession = updatedSessionResult.rows[0];

    // Broadcast perubahan status ke WebSocket
    const io = req.app.get("io");
    if (io) {
      io.to(`session:${id}`).emit("session_updated", updatedSession);
      if (status === "ended") {
        io.to(`session:${id}`).emit("session_ended", updatedSession);
      }
    }

    res.status(200).json({ success: true, data: updatedSession });
  } catch (error) {
    console.error("Update session error:", error);
    return res.status(500).json({
      success: false,
      message: "Gagal memperbarui status sesi",
    });
  }
};

// ====================================================================
// DELETE SESSION (Hapus sesi dan data turunannya, hanya guru pemilik)
// ====================================================================
export const deleteSession = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedSessionResult = await pool.query(
      "DELETE FROM sessions WHERE id = $1 AND teacher_id = $2 RETURNING id",
      [id, req.user.id],
    );

    if (deletedSessionResult.rows.length === 0) {
      const sessionResult = await pool.query(
        "SELECT teacher_id FROM sessions WHERE id = $1",
        [id],
      );

      if (sessionResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Sesi tidak ditemukan!",
        });
      }

      return res.status(403).json({
        success: false,
        message: "Anda bukan pemilik sesi ini!",
      });
    }

    const io = req.app.get("io");
    if (io) {
      io.to(`session:${id}`).emit("session_deleted", { id });
    }

    return res.status(200).json({ success: true, data: { id } });
  } catch (error) {
    console.error("Delete session error:", error);
    return res.status(500).json({
      success: false,
      message: "Gagal menghapus sesi",
    });
  }
};
