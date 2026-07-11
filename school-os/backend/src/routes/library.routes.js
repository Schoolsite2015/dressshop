import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { listBooks, addBook, issueBook, returnBook, listIssues } from "../controllers/library.controller.js";

const router = Router();
router.use(requireAuth);

router.get("/books", listBooks);
router.post("/books", requireRole("librarian", "principal", "admin"), addBook);
router.get("/issues", listIssues);
router.post("/issue", requireRole("librarian", "teacher", "principal", "admin"), issueBook);
router.post("/return", requireRole("librarian", "teacher", "principal", "admin"), returnBook);

export default router;
