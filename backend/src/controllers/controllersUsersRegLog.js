import pool from "../config/db/connection.js"
import bcrypt from "bcrypt"
import EmailValidator from "validator"
import { generateCode } from "../middleware/JWT.js"

const VALID_ROLES = ["guru", "siswa"]

// POST /api/users/register — daftar akun baru (guru/siswa)
export const usersReg = async (req, res) => {
    const { name, role, email, password } = req.body

    // Validasi input
    if (!name || !email || !password) {
        return res.status(422).json({ success: false, message: "Isi format dengan benar" })
    }

    if (typeof email !== "string" || !EmailValidator.isEmail(email)) {
        return res.status(422).json({ success: false, message: "Format email tidak valid" })
    }

    if (!VALID_ROLES.includes(role)) {
        return res.status(422).json({ success: false, message: "Role harus 'guru' atau 'siswa'" })
    }

    try {
        const existing = await pool.query(
            "SELECT id FROM users WHERE name = $1 OR email = $2",
            [name, email]
        )

        if (existing.rows.length > 0) {
            return res.status(409).json({ success: false, message: "Nama atau email sudah terdaftar" })
        }

        const hash = await bcrypt.hash(password, 10)
        const createUser = await pool.query(
            `INSERT INTO users (name, role, email, password)
             VALUES ($1, $2, $3, $4)
             RETURNING id, name, role, email, password`,
            [name, role, email, hash]
        )

        const user = createUser.rows[0]
        const token = generateCode({
            id: user.id,
            role: user.role,
            name: user.name,
            email: user.email
        })

        res.status(201).json({
            success: true,
            data: {
                user: { id: user.id, name: user.name, role: user.role, email: user.email },
                token
            }
        })
    } catch (error) {
        if (error.code === "23505") {
            return res.status(409).json({ success: false, message: "Nama atau email sudah terdaftar" })
        }
        console.error("Register error detail:", error)

        const errorMessage = error instanceof Error && error.message
            ? error.message
            : error?.code || "Pendaftaran gagal, silakan coba lagi"
        const message = process.env.NODE_ENV === "production"
            ? "Pendaftaran gagal, silakan coba lagi"
            : errorMessage

        return res.status(500).json({ success: false, message })
    }
}

// POST /api/users/login — masuk & dapatkan token JWT
export const usersLog = async (req, res) => {
    const { email, password } = req.body

    if (!email || !password) {
        return res.status(422).json({ success: false, message: "Email dan password wajib diisi" })
    }

    try {
        const getAllData = await pool.query(
            "SELECT id, role, name, email, password FROM users WHERE email = $1",
            [email]
        )

        if (getAllData.rows.length === 0) {
            return res.status(401).json({ success: false, message: "Email atau password salah" })
        }

        const user = getAllData.rows[0]
        const comparePw = await bcrypt.compare(password, user.password)

        if (!comparePw) {
            return res.status(401).json({ success: false, message: "Email atau password salah" })
        }

        const token = generateCode({
            id: user.id,
            role: user.role,
            name: user.name,
            email: user.email
        })

        res.status(200).json({
            success: true,
            data: {
                user: { id: user.id, name: user.name, role: user.role, email: user.email },
                token
            }
        })
    } catch (error) {
        console.error("Login error:", error.message)
        res.status(500).json({ success: false, error: "Server Down" })
    }
}

