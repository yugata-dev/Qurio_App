import express from "express"
import { createResponse, getResponses } from "../controllers/controllersResponses.js"

const router = express.Router()

// peserta submit response
router.post("/polls/:pollId/responses", createResponse)

// get semua responses untuk poll
router.get("/polls/:pollId/responses", getResponses)

export default router