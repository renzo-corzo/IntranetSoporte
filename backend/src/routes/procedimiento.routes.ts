import { Router } from "express";
import {
  getProcedimientos,
  getProcedimientoById,
  createProcedimiento,
  updateProcedimiento,
  deleteProcedimiento
} from "../controllers/procedimiento.controller";
import { authenticate } from "../middlewares/auth";

const router = Router();

router.use(authenticate);

router.get("/", getProcedimientos);
router.get("/:id", getProcedimientoById);
router.post("/", createProcedimiento);
router.put("/:id", updateProcedimiento);
router.delete("/:id", deleteProcedimiento);

export default router; 