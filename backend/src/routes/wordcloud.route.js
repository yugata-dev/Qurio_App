import express from "express"
import {
    getWordCloudResults,
    getWordCloudResponsesByPoll,
    submitWordCloudResponse
} from "../controllers/wordcloud.controller.js"

const router = express.Router()

// Siswa: kirim kata untuk word cloud
router.post("/responses", submitWordCloudResponse)

// Guru: lihat daftar kata untuk satu poll
router.get("/:pollId/responses", getWordCloudResponsesByPoll)

// Ambil hasil word cloud untuk satu sesi
router.get("/sessions/:sessionId/results", getWordCloudResults)

export default router
