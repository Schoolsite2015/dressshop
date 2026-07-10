import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { listPublicNotices, listAllNotices, createNotice, deleteNotice } from "../controllers/notices.controller.js";

const router = Router();

router.get("/public", listPublicNotices); // no auth — used by the website

router.use(requireAuth);
router.get("/", listAllNotices);
router.post("/", requireRole("principal", "office", "admin"), createNotice);
router.delete("/:id", requireRole("principal", "office", "admin"), deleteNotice);

export default router;
