import express from "express"
import { createSession, getSessions, getSession, updateSession } from "../controllers/controllersSessions.js"
import { studentLimit, teacherLimit } from "../middleware/JWT.js"
import { joinSession } from "../controllers/controllersParticipants.js"

const router = express.Router()

// create session baru (guru)
router.post("/", teacherLimit, createSession)

// list semua sessionnp
router.get("/", teacherLimit, getSessions)

// get detail 1 session
router.get("/:id", teacherLimit, getSession)

router.post("/:sessionId/participants/join", studentLimit, joinSession)

// update session (guru pemilik)
router.put("/:id", teacherLimit, updateSession)

export default router