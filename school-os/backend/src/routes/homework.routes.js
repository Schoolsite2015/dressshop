import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { createHomework, listHomework, deleteHomework } from "../controllers/homework.controller.js";

const router = Router();
router.use(requireAuth);

router.get("/", listHomework);
router.post("/", requireRole("teacher", "principal", "admin"), createHomework);
router.delete("/:id", requireRole("teacher", "principal", "admin"), deleteHomework);

export default router;
