import { Router } from "express";
import * as relevamientoCtrl from "../controllers/relevamiento.controller";
import { authenticate } from "../middlewares/auth";

const router = Router();

router.use(authenticate);

router.get("/", relevamientoCtrl.getRelevamientos);
router.get("/:id", relevamientoCtrl.getRelevamientoById);
router.post("/", relevamientoCtrl.createRelevamiento);
router.put("/:id", relevamientoCtrl.updateRelevamiento);
router.delete("/:id", relevamientoCtrl.deleteRelevamiento);

export default router; 