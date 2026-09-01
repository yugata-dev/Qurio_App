import express from "express"
import {
    answerQuestion,
    createQuestion,
    getQuestionsBySession,
    upvoteQuestion
} from "../controllers/controllersQuestions.js"
import { teacherLimit } from "../middleware/JWT.js"

const router = express.Router()

// Ambil semua pertanyaan dalam satu sesi
router.get("/sessions/:sessionId", getQuestionsBySession)

// Siswa mengirim pertanyaan baru
router.post("/", createQuestion)

// Siswa lain memberi upvote
router.post("/:id/upvote", upvoteQuestion)

// Guru menandai pertanyaan sudah terjawab
router.patch("/:id/answer", teacherLimit, answerQuestion)

export default router
