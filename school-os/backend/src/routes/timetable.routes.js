import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { getTimetable, getTeacherTimetable, generateTimetable } from "../controllers/timetable.controller.js";

const router = Router();
router.use(requireAuth);

router.get("/", getTimetable);
router.get("/teacher/:teacherId", getTeacherTimetable);
router.post("/generate", requireRole("principal", "admin"), generateTimetable);

export default router;
