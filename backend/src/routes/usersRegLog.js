import express from "express"
import { usersLog, usersReg } from "../controllers/controllersUsersRegLog.js";
const router = express.Router()

// membuat data registers
router.post("/register", usersReg)

// mencari data users yang cocok 
router.post("/login", usersLog)

export default router