import express from "express"
import {
    getWordCloudResults,
    submitWordCloudResponse
} from "../controllers/controllersWordCloud.js"

const router = express.Router()

// Ambil hasil word cloud untuk satu sesi
router.get("/sessions/:sessionId/results", getWordCloudResults)

// Siswa mengirim jawaban terbuka untuk word cloud
router.post("/sessions/:sessionId/responses", submitWordCloudResponse)

export default router
