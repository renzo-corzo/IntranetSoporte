import { Router } from "express";
import { getLinks, createLink, updateLink, deleteLink } from "../controllers/link.controller";
import { verifyToken, requireRole } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", verifyToken, getLinks);
router.post("/", verifyToken, requireRole("admin"), createLink);
router.put("/:id", verifyToken, requireRole("admin"), updateLink);
router.delete("/:id", verifyToken, requireRole("admin"), deleteLink);

export default router; 