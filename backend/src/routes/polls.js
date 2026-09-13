import express from "express"
import { createPoll, getPoll, getPollsBySession, updateAllPollsBySession } from "../controllers/controllersPolls.js"
import { teacherLimit } from "../middleware/JWT.js"

const router = express.Router()

// create poll dalam session (guru)
router.post("/sessions/:sessionId/polls", teacherLimit, createPoll)

// get polls dalam session
router.get("/sessions/:sessionId/polls", teacherLimit, getPollsBySession)

// get detail 1 poll
router.get("/:pollId", getPoll)

// update poll (guru)
router.put("/:sessionId", teacherLimit, updateAllPollsBySession)

export default router