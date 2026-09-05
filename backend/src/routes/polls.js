import express from "express"
import { getPoll, updatePoll } from "../controllers/controllersPolls.js"
import { teacherLimit } from "../middleware/JWT.js"

const router = express.Router()

// URL Asli: /api/polls/:pollId
router.get("/:pollId", getPoll)
router.put("/:pollId", teacherLimit, updatePoll)

export default router