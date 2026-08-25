import express from "express"
import { createServer } from "node:http"
import { Server } from "socket.io"
const app = express();
import dotenv from "dotenv"
import cors from "cors"
import helmet from "helmet"
import morgan from "morgan"
import sessionsRouter from "./src/routes/sessions.js"
import pollsRouter from "./src/routes/polls.js"
import responsesRouter from "./src/routes/responses.js"
import usersRegLogRouter from "./src/routes/usersRegLog.js"

dotenv.config()
const PORT = process.env.SERVER_PORT;
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST", "PUT"]
  }
})

app.set("io", io)

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use("/api/sessions", sessionsRouter)
app.use("/api/polls", pollsRouter)
app.use("/api/responses", responsesRouter)
app.use("/api/users", usersRegLogRouter)

io.on("connection", (socket) => {
  socket.on("join_session", (sessionId) => {
    if (sessionId) {
      socket.join(String(sessionId))
    }
  })

  socket.on("leave_session", (sessionId) => {
    if (sessionId) {
      socket.leave(String(sessionId))
    }
  })
})

httpServer.listen(PORT, () => {
  console.log(`Server Backend aktif di http://localhost:${PORT}`);
});
