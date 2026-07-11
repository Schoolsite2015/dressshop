import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { listItems, addItem, updateItem, deleteItem } from "../controllers/inventory.controller.js";

const router = Router();
router.use(requireAuth);
router.get("/", listItems);
router.post("/", requireRole("principal", "office", "admin"), addItem);
router.patch("/:id", requireRole("principal", "office", "admin"), updateItem);
router.delete("/:id", requireRole("principal", "admin"), deleteItem);
export default router;
