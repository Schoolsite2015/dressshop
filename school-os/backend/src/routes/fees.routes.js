import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
  listFeeStructure, recordPayment, getStudentFees, feeCollectionSummary,
} from "../controllers/fees.controller.js";

const router = Router();
router.use(requireAuth);

router.get("/structure", listFeeStructure);
router.get("/summary", requireRole("principal", "office", "admin"), feeCollectionSummary);
router.get("/student/:studentId", getStudentFees);
router.post("/pay", requireRole("office", "principal", "admin"), recordPayment);

export default router;
