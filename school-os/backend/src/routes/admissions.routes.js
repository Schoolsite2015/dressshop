import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
  applyOnline, trackApplication, listApplications, updateApplicationStatus,
} from "../controllers/admissions.controller.js";

const router = Router();

// Public routes — used by the school website's admissions page
router.post("/apply", applyOnline);
router.get("/track/:id", trackApplication);

// Staff routes
router.get("/", requireAuth, requireRole("office", "principal", "admin"), listApplications);
router.patch("/:id", requireAuth, requireRole("office", "principal", "admin"), updateApplicationStatus);

export default router;
