import express from "express"
import { createPoll, getPoll, getPollsBySession, getPollsForStudent, updatePoll } from "../controllers/polls.controller.js"
import { teacherLimit } from "../middlewares/auth.middleware.js"

const router = express.Router()

// create poll dalam session (guru)
router.post("/sessions/:sessionId/polls", teacherLimit, createPoll)

// get polls dalam session
router.get("/sessions/:sessionId/polls", teacherLimit, getPollsBySession)

// legacy alias untuk bot/test client
router.get("/current", (req, res) => {
    const sessionId = req.query.session_id || req.query.sessionId
    if (!sessionId) {
        return res.status(400).json({ success: false, message: "session_id wajib diisi." })
    }
    req.params = { ...req.params, sessionId }
    return getPollsForStudent(req, res)
})

// get polls untuk diliat siswa
router.get("/sessions/:sessionId/current", getPollsForStudent)

// get detail 1 poll
router.get("/:pollId", getPoll)

// update quiz 
router.patch("/:pollId/status", teacherLimit, updatePoll)

export default router