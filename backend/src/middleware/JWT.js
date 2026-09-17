import jwt from "jsonwebtoken"

// Membuat token JWT
export const generateCode = (data) => {
    return jwt.sign(data, process.env.JWT_SECRET, { expiresIn: "1h" })
}

// Memverifikasi token JWT
export function verifyToken(token) {
    return jwt.verify(token, process.env.JWT_SECRET)
}

export const getAuthCookieOptions = (req) => {
    const forwardedProtocol = req.headers["x-forwarded-proto"]
    const isHttps = req.secure || forwardedProtocol === "https" || process.env.NODE_ENV === "production"

    return {
        httpOnly: true,
        secure: isHttps,
        sameSite: isHttps ? "none" : "lax",
        maxAge: 60 * 60 * 1000,
        path: "/"
    }
}

// Mengambil token dari header Authorization atau cookie HttpOnly
export const getTokenFromHeader = (req) => {
    const authHeader = req.headers["authorization"]
    if (authHeader) {
        const [scheme, token] = authHeader.split(" ")
        if (scheme === "Bearer" && token) return token
    }

    const cookieHeader = req.headers.cookie || ""
    const tokenCookie = cookieHeader
        .split(";")
        .map((cookie) => cookie.trim())
        .find((cookie) => cookie.startsWith("token="))

    return tokenCookie ? decodeURIComponent(tokenCookie.slice("token=".length)) : null
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

// Middleware: hanya siswa yang boleh mengakses route berikutnya
export const studentLimit = (req, res, next) => {
    const token = getTokenFromHeader(req)

    if (!token) {
        return res.status(401).json({ success: false, message: "Token tidak ada, akses ditolak!" })
    }

    try {
        const decoded = verifyToken(token)

        if (decoded.role !== "siswa") {
            return res.status(403).json({ success: false, message: "Hanya Siswa yang boleh mengakses fitur ini!" })
        }

        req.user = decoded
        next()
    } catch (error) {
        return res.status(403).json({ success: false, message: "Token palsu atau kadaluwarsa!" })
    }
}

// Middleware autentikasi umum untuk endpoint yang tidak membatasi role
export const authLimit = (req, res, next) => {
    const token = getTokenFromHeader(req)

    if (!token) {
        return res.status(401).json({ success: false, message: "Token tidak ada, akses ditolak!" })
    }

    try {
        req.user = verifyToken(token)
        next()
    } catch (error) {
        return res.status(401).json({ success: false, message: "Token palsu atau kadaluwarsa!" })
    }
}