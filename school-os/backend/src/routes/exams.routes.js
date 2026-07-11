import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
  createExam, listExams, getExamSubjects, getGradebook, saveMarks, getStudentExamMarks,
} from "../controllers/exams.controller.js";

const router = Router();
router.use(requireAuth);

router.post("/", requireRole("teacher", "principal", "admin"), createExam);
router.get("/", listExams);
router.get("/:examId/subjects", getExamSubjects);
router.get("/:examId/gradebook", getGradebook);
router.get("/:examId/marks/:studentId", getStudentExamMarks);
router.post("/marks", requireRole("teacher", "principal", "admin"), saveMarks);

export default router;
