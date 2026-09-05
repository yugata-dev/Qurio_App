import express from "express"
import { createSession, getSessions, getSession, updateSession } from "../controllers/controllersSessions.js"
// Import controller poll
import { createPoll, getPollsBySession } from "../controllers/controllersPolls.js"
import { teacherLimit } from "../middleware/JWT.js"

const router = express.Router()

// --- SESSION ROUTES ---
router.post("/", teacherLimit, createSession)
router.get("/", getSessions)
router.get("/:id", getSession)
router.put("/:id", teacherLimit, updateSession)

// --- POLLS IN SESSION ROUTES ---
// URL Asli: /api/sessions/:sessionId/polls
router.post("/:sessionId/polls", teacherLimit, createPoll)
router.get("/:sessionId/polls", getPollsBySession)

export default router