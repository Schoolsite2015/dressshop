import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { requireClassAccess, requireStudentAccess } from "../middleware/permissions.middleware.js";
import {
  markAttendance, getAttendanceForClass, getStudentAttendance, markQuickAttendance
} from "../controllers/attendance.controller.js";

const router = Router();
router.use(requireAuth);

router.post("/", requireRole("teacher", "principal", "admin"), requireClassAccess, markAttendance);
router.post("/quick", requireRole("teacher", "principal", "admin"), requireStudentAccess, markQuickAttendance);
router.get("/", requireClassAccess, getAttendanceForClass);
router.get("/student/:studentId", requireStudentAccess, getStudentAttendance);

export default router;
