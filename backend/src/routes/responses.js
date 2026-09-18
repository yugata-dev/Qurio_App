import express from "express"
import { createResponse, getResponses } from "../controllers/controllersResponses.js"
import { teacherLimit } from "../middleware/JWT.js"

const router = express.Router()

// peserta submit response
router.post("/:pollId/responses", createResponse)

// get semua responses untuk poll (guru)
router.get("/:pollId/responses", teacherLimit, getResponses)

export default router