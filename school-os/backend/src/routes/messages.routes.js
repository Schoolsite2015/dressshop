import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { listConversations, getThread, sendMessage, listContacts } from "../controllers/messages.controller.js";

const router = Router();
router.use(requireAuth);
router.get("/conversations", listConversations);
router.get("/contacts", listContacts);
router.get("/thread/:userId", getThread);
router.post("/", sendMessage);
export default router;
