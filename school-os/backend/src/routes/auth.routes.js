import { Router } from "express";
import { login, me, refreshToken, getSessions, revokeSession } from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/login", login);
router.post("/refresh-token", refreshToken);
router.get("/me", requireAuth, me);
router.get("/sessions", requireAuth, getSessions);
router.delete("/sessions/:sessionId", requireAuth, revokeSession);

export default router;
