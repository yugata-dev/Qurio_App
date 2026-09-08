import express from "express"
import { createPoll, getPoll, updatePoll } from "../controllers/controllersPolls.js"
import { teacherLimit } from "../middleware/JWT.js"

const router = express.Router()

// Buat poll baru di dalam sesi (guru)
router.post("/sessions/:sessionId/polls", teacherLimit, createPoll)

// URL Asli: /api/polls/:pollId
router.get("/:pollId", getPoll)
router.put("/:pollId", teacherLimit, updatePoll)

export default router