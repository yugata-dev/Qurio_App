import pool from "../config/db/connection.js"
import bcrypt from "bcrypt"
import EmailValidator from "validator"
import { generateCode } from "../middleware/JWT.js";

export const usersReg = async (req, res) => {
    const { name, role, email, password } = req.body;

    if (!name || !role || !password || typeof email !== "string" || !EmailValidator.isEmail(email)) {
        return res.status(422).json({ message: "Isi format dengan benar" })
    }

    try {


        const validating = await pool.query("SELECT name, email FROM users WHERE name = $1 OR email = $2", [name, email])

        if (validating.rows.length > 0) {
            return res.status(409).json({ message: "Nama atau email sudah terdaftar" })
        }

        const hash = await bcrypt.hash(password, 10)
        const createUser = await pool.query(
            "INSERT INTO users(name, role, email, password) VALUES($1, $2, $3, $4) RETURNING id, name, role, email, created_at",
            [name, role, email, hash]
        )

        const getAllData = await pool.query(
            "SELECT id, role, name, email, password FROM users WHERE email = $1",
            [email]
        )

        const user = getAllData.rows[0]
        const createToken = generateCode(
            {
                id: user.id,
                role: user.role,
                name: user.name,
                email: user.email
            }
        )
        const data = createUser.rows[0]
        const dataAndToken = { ...data, token: createToken }

        res.status(201).json({
            success: true,
            data: dataAndToken
        })
    } catch (error) {
        if (error.code === "23505") {
            return res.status(409).json({ message: "Nama atau email sudah terdaftar" })
        }
        console.error("error", error)
        res.status(500).json({ success: false, error: error })
    }
};

export const usersLog = async (req, res) => {
    const { email, password } = req.body

    try {
        const getAllData = await pool.query(
            "SELECT id, role, name, email, password FROM users WHERE email = $1",
            [email]
        )

        if (getAllData.rows.length === 0) {
            return res.status(401).json({ message: "Email atau password salah" })
        }

        const user = getAllData.rows[0]
        const comparePw = await bcrypt.compare(password, user.password)

        if (!comparePw) {
            return res.status(401).json({ message: "Email atau password salah" })
        }

        const token = generateCode({
            id: user.id,
            role: user.role,
            name: user.name,
            email: user.email
        })

        res.status(200).json({ success: true, result: token })

    } catch (error) {
        console.error("generate code error:", error.message)
        res.status(500).json({ success: false, error: "Server Down" })
    }
};
