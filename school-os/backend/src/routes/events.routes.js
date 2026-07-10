import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { listEvents, addEvent, updateEvent, deleteEvent } from "../controllers/events.controller.js";

const router = Router();
router.use(requireAuth);
router.get("/", listEvents);
router.post("/", requireRole("principal", "office", "admin"), addEvent);
router.patch("/:id", requireRole("principal", "office", "admin"), updateEvent);
router.delete("/:id", requireRole("principal", "admin"), deleteEvent);
export default router;
