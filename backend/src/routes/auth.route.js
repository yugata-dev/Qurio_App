import express from "express"
import { getCurrentUser, usersLog, usersLogOut, usersReg } from "../controllers/auth.controller.js";
import { authLimit } from "../middlewares/auth.middleware.js"
const router = express.Router()

// membuat data registers
router.post("/register", usersReg)

// mencari data users yang cocok 
router.post("/login", usersLog)
router.post("/logout", usersLogOut)
router.get("/me", authLimit, getCurrentUser)

export default router