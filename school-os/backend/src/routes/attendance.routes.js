import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
  markAttendance, getAttendanceForClass, getStudentAttendance,
} from "../controllers/attendance.controller.js";

const router = Router();
router.use(requireAuth);

router.post("/", requireRole("teacher", "principal", "admin"), markAttendance);
router.get("/", getAttendanceForClass);
router.get("/student/:studentId", getStudentAttendance);

export default router;
