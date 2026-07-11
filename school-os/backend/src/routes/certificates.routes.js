import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { issueCertificate, listCertificates, verifyCertificate } from "../controllers/certificates.controller.js";

const router = Router();
// Public verification route (no auth)
router.get("/verify/:id", verifyCertificate);

router.use(requireAuth);
router.get("/", listCertificates);
router.post("/", requireRole("principal", "office", "admin"), issueCertificate);
export default router;
