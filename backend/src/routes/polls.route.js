import express from "express"
import { createPoll, getPoll, getPollsBySession, getPollsForStudent, updatePoll } from "../controllers/polls.controller.js"
import { teacherLimit } from "../middlewares/auth.middleware.js"

const router = express.Router()

// create poll dalam session (guru)
router.post("/sessions/:sessionId/polls", teacherLimit, createPoll)

// get polls dalam session
router.get("/sessions/:sessionId/polls", teacherLimit, getPollsBySession)

// get polls untuk diliat siswa
router.get("/sessions/:sessionId/current", getPollsForStudent)

// get detail 1 poll
router.get("/:pollId", getPoll)

// update quiz 
router.patch("/:pollId/status", teacherLimit, updatePoll)

export default router