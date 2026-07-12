import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
  listStudents, getStudent, createStudent,
  listClasses, listSections, listSubjects,
  getMyProfile, getMyChildren, lookupStudent, updateStudent
} from "../controllers/students.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/classes", listClasses);
router.get("/sections", listSections);
router.get("/subjects", listSubjects);
router.get("/profile", getMyProfile);        // student's own record
router.get("/children", getMyChildren);       // parent's children
router.get("/lookup", lookupStudent);
router.get("/", listStudents);
router.get("/:id", getStudent);
router.post("/", requireRole("office", "principal", "admin"), createStudent);
router.put("/:id", requireRole("office", "principal", "admin"), updateStudent);

export default router;
