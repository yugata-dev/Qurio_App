import express from "express"
import { createPoll, getPoll, getPollsBySession, updatePoll } from "../controllers/controllersPolls.js"

const router = express.Router()

// create poll dalam session
router.post("/sessions/:sessionId/polls", createPoll)

// get polls dalam session
router.get("/sessions/:sessionId/polls", getPollsBySession)

// get detail 1 poll
router.get("/:pollId", getPoll)

// update poll
router.put("/:pollId", updatePoll)

export default router