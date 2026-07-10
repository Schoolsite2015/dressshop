import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { listRooms, addRoom, listAllocations, allocateRoom, deallocateRoom } from "../controllers/hostel.controller.js";

const router = Router();
router.use(requireAuth);
router.get("/rooms", listRooms);
router.post("/rooms", requireRole("principal", "office", "admin"), addRoom);
router.get("/allocations", listAllocations);
router.post("/allocations", requireRole("principal", "office", "admin"), allocateRoom);
router.delete("/allocations/:id", requireRole("principal", "office", "admin"), deallocateRoom);
export default router;
