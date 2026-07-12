import express from "express";
import multer from "multer";
import path from "path";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { tenantContext } from "../config/db.js";
import {
  addStudent,
  addStaff,
  updateStaff,
  listClasses,
  addClass,
  listSections,
  addSection,
  listAcademicYears,
  addAcademicYear,
  listSubjects,
  listStudentRoster,
  listStaffRoster,
  addTeacherAssignment,
  removeTeacherAssignment,
  deleteStudent,
  deleteStaff,
  resetPassword,
  getAnalytics,
  exportDatabase
} from "../controllers/admin.controller.js";
import { getReportsHubData } from "../controllers/reports.controller.js";

const router = express.Router();

// Multer config for photo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/photos/");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});
const upload = multer({ storage });

router.use(requireAuth);
router.use(requireRole("principal", "office", "admin"));

// Analytics
router.get("/analytics", getAnalytics);
router.get("/reports-hub", getReportsHubData);

// Backup
router.get("/backup", exportDatabase);

// Users
router.post("/students", upload.single("photo"), (req, res, next) => {
  tenantContext.run(req.tenantId, () => next());
}, addStudent);
router.delete("/students/:id", deleteStudent);

router.post("/staff", upload.single("photo"), (req, res, next) => {
  tenantContext.run(req.tenantId, () => next());
}, addStaff);
router.put("/staff/:id", updateStaff);
router.delete("/staff/:id", deleteStaff);

router.put("/users/:id/password", resetPassword);

// Academic Structure
router.get("/classes", listClasses);
router.post("/classes", addClass);

router.get("/sections", listSections);
router.post("/sections", addSection);

router.get("/academic-years", listAcademicYears);
router.post("/academic-years", addAcademicYear);

router.get("/subjects", listSubjects);

// Rosters
router.get("/roster/students", listStudentRoster);
router.get("/roster/staff", listStaffRoster);

// Teacher assignments
router.post("/teacher-assignments", addTeacherAssignment);
router.delete("/teacher-assignments/:id", removeTeacherAssignment);

export default router;
