import { Router } from "express";
import * as relevamientoCtrl from "../controllers/relevamiento.controller";
import { verifyToken } from "../middlewares/auth.middleware";
import { requireEmpresa } from "../middlewares/empresa.middleware";

const router = Router();

router.use(verifyToken);
router.use(requireEmpresa);

router.get("/", relevamientoCtrl.getRelevamientos);
router.get("/:id", relevamientoCtrl.getRelevamientoById);
router.post("/", relevamientoCtrl.createRelevamiento);
router.put("/:id", relevamientoCtrl.updateRelevamiento);
router.delete("/:id", relevamientoCtrl.deleteRelevamiento);

export default router; 