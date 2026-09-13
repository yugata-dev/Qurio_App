import jwt from "jsonwebtoken"

// Membuat token JWT
export const generateCode = (data) => {
    return jwt.sign(data, process.env.JWT_SECRET, { expiresIn: "1h" })
}

// Memverifikasi token JWT
export function verifyToken(token) {
    return jwt.verify(token, process.env.JWT_SECRET)
}

// Mengambil token dari header Authorization ("Bearer <token>")
export const getTokenFromHeader = (req) => {
    const authHeader = req.headers["authorization"]
    if (!authHeader) return null

    const [scheme, token] = authHeader.split(" ")
    return scheme === "Bearer" && token ? token : null
}

// Middleware: hanya guru yang boleh mengakses route berikutnya
export const teacherLimit = (req, res, next) => {
    const token = getTokenFromHeader(req)

    if (!token) {
        return res.status(401).json({ success: false, message: "Token tidak ada, akses ditolak!" })
    }

    try {
        const decoded = verifyToken(token)

        if (decoded.role !== "guru") {
            return res.status(403).json({ success: false, message: "Hanya Guru yang boleh mengakses fitur ini!" })
        }

        req.user = decoded
        next()
    } catch (error) {
        return res.status(403).json({ success: false, message: "Token palsu atau kadaluwarsa!" })
    }
}