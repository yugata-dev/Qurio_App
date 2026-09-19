import express from "express"
import { createResponse, getResponses } from "../controllers/responses.controller.js"
import { teacherLimit } from "../middlewares/auth.middleware.js"

const router = express.Router()

// peserta submit response
router.post("/:pollId/responses", createResponse)

// get semua responses untuk poll (guru)
router.get("/:pollId/responses", teacherLimit, getResponses)

export default router