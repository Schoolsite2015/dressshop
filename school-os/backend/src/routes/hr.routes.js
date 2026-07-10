import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
  listStaff, getStaffMember, addStaff,
  listPayroll, createPayrollEntry, markPaid,
  markStaffAttendance, getStaffAttendance,
} from "../controllers/hr.controller.js";

const router = Router();
router.use(requireAuth);
router.get("/staff", listStaff);
router.get("/staff/:id", getStaffMember);
router.post("/staff", requireRole("principal", "hr", "admin"), addStaff);
router.get("/payroll", listPayroll);
router.post("/payroll", requireRole("principal", "hr", "admin"), createPayrollEntry);
router.patch("/payroll/:id/pay", requireRole("principal", "hr", "admin"), markPaid);
router.get("/attendance", getStaffAttendance);
router.post("/attendance", requireRole("principal", "hr", "admin", "teacher"), markStaffAttendance);
export default router;
