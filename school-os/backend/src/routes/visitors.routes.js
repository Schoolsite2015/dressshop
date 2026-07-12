import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { getVisitors, checkInVisitor, checkOutVisitor } from "../controllers/visitors.controller.js";

const router = Router();
router.use(requireAuth);
// Only admin, principal, and office staff can manage visitors
router.use(requireRole("admin", "principal", "office"));

router.get("/", getVisitors);
router.post("/check-in", checkInVisitor);
router.put("/:id/check-out", checkOutVisitor);

export default router;
