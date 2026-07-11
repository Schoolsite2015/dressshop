import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { listRoutes, listBuses, getBusInfo, updateBusLocation, addRoute, addBus, updateBus, getMyBus, assignStudentToBus, listBusStudents } from "../controllers/transport.controller.js";

const router = Router();
router.use(requireAuth);

router.get("/routes", listRoutes);
router.post("/routes", requireRole("principal", "admin", "transport"), addRoute);
router.get("/buses", listBuses);
router.post("/buses", requireRole("principal", "admin", "transport"), addBus);
router.get("/buses/:id", getBusInfo);
router.put("/buses/:id", requireRole("principal", "admin", "transport"), updateBus);
router.get("/buses/:id/students", requireRole("principal", "admin", "transport", "office"), listBusStudents);
router.post("/buses/:id/location", updateBusLocation);

// Admin: assign a student to a bus
router.post("/assign", requireRole("principal", "admin", "transport", "office"), assignStudentToBus);

// Student/parent: get the bus assigned to the logged-in user's child
router.get("/my-bus", getMyBus);

export default router;
