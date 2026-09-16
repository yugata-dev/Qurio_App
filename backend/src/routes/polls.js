import express from "express"
import { createPoll, getPoll, getPollsBySession, updatePoll } from "../controllers/controllersPolls.js"
import { teacherLimit } from "../middleware/JWT.js"

const router = express.Router()

// create poll dalam session (guru)
router.post("/sessions/:sessionId/polls", teacherLimit, createPoll)

// get polls dalam session
router.get("/sessions/:sessionId/polls", teacherLimit, getPollsBySession)

// get detail 1 poll
router.get("/:pollId", getPoll)

// update quiz 
router.patch("/:pollId/status", teacherLimit, updatePoll)

export default router