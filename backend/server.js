import express from "express"
import { createServer } from "node:http"
import { Server } from "socket.io"
import dotenv from "dotenv"
import cors from "cors"
import helmet from "helmet"
import morgan from "morgan"

import sessionsRouter from "./src/routes/sessions.js"
import pollsRouter from "./src/routes/polls.js"
import responsesRouter from "./src/routes/responses.js"
import questionsRouter from "./src/routes/questions.js"
import wordcloudRouter from "./src/routes/wordcloud.js"
import usersRegLogRouter from "./src/routes/usersRegLog.js"

dotenv.config({ quiet: true })

const app = express()
const PORT = process.env.SERVER_PORT || process.env.PORT || 5000
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000"

// =====================
// HTTP + WEBSOCKET SERVER
// =====================
const httpServer = createServer(app)
const io = new Server(httpServer, {
    cors: {
        origin: FRONTEND_URL,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE"]
    }
})

// Simpan io ke app agar bisa dipakai di controller (req.app.get("io"))
app.set("io", io)

// =====================
// MIDDLEWARE
// =====================
app.use(cors({ origin: FRONTEND_URL }))
app.use(express.json())
app.use(helmet())
app.use(morgan("dev"))

// =====================
// ROUTES
// =====================
app.use("/api/sessions", sessionsRouter)
app.use("/api/polls", pollsRouter)
app.use("/api/responses", responsesRouter)
app.use("/api/questions", questionsRouter)
app.use("/api/wordcloud", wordcloudRouter)
app.use("/api/users", usersRegLogRouter)
app.use("/api/test", (req, res) => {
    res.send("Test")
})

// 404 untuk endpoint yang tidak dikenal
app.use((req, res) => {
    res.status(404).json({ success: false, error: "Endpoint tidak ditemukan" })
})

// Handler error global
app.use((err, req, res, next) => {
    console.error("Unexpected error:", err.message)
    res.status(500).json({ success: false, error: "Terjadi kesalahan di server" })
})

// =====================
// WEBSOCKET EVENT
// =====================
io.on("connection", (socket) => {
    // Peserta/Guru masuk ke ruang sesi agar menerima event real-time
    socket.on("join_session", (sessionId) => {
        if (sessionId) socket.join(`session:${sessionId}`)
    })

    socket.on("leave_session", (sessionId) => {
        if (sessionId) socket.leave(`session:${sessionId}`)
    })

    // Guru masuk ke ruang personal agar menerima notifikasi sesi
    socket.on("join_teacher", (teacherId) => {
        if (teacherId) socket.join(`teacher:${teacherId}`)
    })

    socket.on("leave_teacher", (teacherId) => {
        if (teacherId) socket.leave(`teacher:${teacherId}`)
    })
})

httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server Backend aktif di http://localhost:${PORT}`)
})
