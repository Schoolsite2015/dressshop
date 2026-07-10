import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { listRoutes, listBuses, getBusInfo, updateBusLocation, addRoute, addBus, getMyBus } from "../controllers/transport.controller.js";

const router = Router();
router.use(requireAuth);

router.get("/routes", listRoutes);
router.post("/routes", requireRole("principal", "admin", "transport"), addRoute);
router.get("/buses", listBuses);
router.post("/buses", requireRole("principal", "admin", "transport"), addBus);
router.get("/buses/:id", getBusInfo);
router.post("/buses/:id/location", updateBusLocation);

// Student/parent: get the bus assigned to the logged-in user's child
router.get("/my-bus", getMyBus);

export default router;
