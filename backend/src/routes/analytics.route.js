import express from "express";
import { teacherLimit } from "../middlewares/auth.middleware.js";
import {
    getAnalyticsScoreBySession,
    getAnalyticsScores,
    getAnalyticsStudents,
    getAnalyticsSummary,
    getAnalyticsTopics,
} from "../controllers/analytics.controller.js";

const router = express.Router();

// Analytics endpoints only expose data for the authenticated teacher.
router.get("/summary", teacherLimit, getAnalyticsSummary);
router.get("/scores", teacherLimit, getAnalyticsScores);
router.get("/students", teacherLimit, getAnalyticsStudents);
router.get("/topics", teacherLimit, getAnalyticsTopics);
router.get("/score-by-session", teacherLimit, getAnalyticsScoreBySession);

export default router;
