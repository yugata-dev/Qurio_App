import express from "express"
import { createSession, getSessions, getSession, updateSession } from "../controllers/controllersSessions.js"
import { teacherLimit } from "../middleware/JWT.js";
const router = express.Router()

// create session baru
router.post("/", teacherLimit, createSession)

// list semua session
router.get("/", getSessions)

// get detail 1 session
router.get("/:id", getSession)

// update session
router.put("/:id", updateSession)

export default router