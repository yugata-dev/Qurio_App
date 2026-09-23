import express from "express"
import {
    answerQuestion,
    createQuestion,
    getQuestionsByPollId,
    getQuestionsBySession,
    upvoteQuestion
} from "../controllers/questions.controller.js"
import { teacherLimit } from "../middlewares/auth.middleware.js"

const router = express.Router()

// Untuk siswa: kirim pertanyaan baru / ambil list berdasarkan poll
router.get("/", getQuestionsByPollId)

// Ambil semua pertanyaan dalam satu sesi (guru)
router.get("/sessions/:sessionId", teacherLimit, getQuestionsBySession)

// Siswa mengirim pertanyaan baru
router.post("/", createQuestion)

// Siswa lain memberi upvote
router.post("/:id/upvote", upvoteQuestion)

// Guru menandai pertanyaan sudah terjawab
router.patch("/:id/answer", teacherLimit, answerQuestion)

export default router
