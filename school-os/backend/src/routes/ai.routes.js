import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
  generateReportCardRemarks, getReportCard,
  generateLessonPlan, generateQuestionPaper, queryAssistant,
  generateTimetable, generateExamSchedule
} from "../controllers/ai.controller.js";

const router = Router();
router.use(requireAuth);

router.post("/report-card", requireRole("teacher", "principal", "admin"), generateReportCardRemarks);
router.get("/report-card/:studentId/:examId", getReportCard);
router.post("/lesson-plan", requireRole("teacher", "principal", "admin"), generateLessonPlan);
router.post("/question-paper", requireRole("teacher", "principal", "admin"), generateQuestionPaper);
router.post("/query", requireRole("principal", "admin"), queryAssistant);
router.post("/timetable", requireRole("principal", "admin", "office"), generateTimetable);
router.post("/exam-schedule", requireRole("principal", "admin", "office"), generateExamSchedule);

export default router;
