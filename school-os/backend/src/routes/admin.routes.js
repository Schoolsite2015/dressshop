import express from "express";
import multer from "multer";
import path from "path";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
  addStudent,
  addStaff,
  listClasses,
  addClass,
  listSections,
  addSection,
  listAcademicYears,
  addAcademicYear
} from "../controllers/admin.controller.js";

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

// Users
router.post("/students", upload.single("photo"), addStudent);
router.post("/staff", upload.single("photo"), addStaff);

// Academic Structure
router.get("/classes", listClasses);
router.post("/classes", addClass);

router.get("/sections", listSections);
router.post("/sections", addSection);

router.get("/academic-years", listAcademicYears);
router.post("/academic-years", addAcademicYear);

export default router;
