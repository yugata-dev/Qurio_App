import jwt from "jsonwebtoken"

export const generateCode = (data) => {
    const token = jwt.sign(data, process.env.JWT_SECRET, { expiresIn: "1h" })
    return token
}

export function verifyToken(token) {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
}

// membuat middleware yang berfungsi agar portal createSession hanya bisa di buat oleh guru
export const teacherLimit = (req, res, next) => {
    const authHeader = req.headers['authorization']
    const token = authHeader.split(' ')[1]

    if (!token) {
        return res.status(401).json({ message: 'Token tidak ada, akses ditolak!' });
    }

    try {
        const decoded = verifyToken(token)
        if (decoded.role !== 'guru') {
            return res.status(403).json({ message: 'Hanya Guru yang boleh buat session!' });
        }

        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ message: 'Token palsu atau kadaluwarsa!' });
    }
}