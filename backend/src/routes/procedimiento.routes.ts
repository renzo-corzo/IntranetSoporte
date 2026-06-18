import { Router } from "express";
import {
  getProcedimientos,
  getProcedimientoById,
  createProcedimiento,
  updateProcedimiento,
  deleteProcedimiento
} from "../controllers/procedimiento.controller";
import { verifyToken } from "../middlewares/auth.middleware";
import { requireEmpresa } from "../middlewares/empresa.middleware";

const router = Router();

router.use(verifyToken);
router.use(requireEmpresa);

router.get("/", getProcedimientos);
router.get("/:id", getProcedimientoById);
router.post("/", createProcedimiento);
router.put("/:id", updateProcedimiento);
router.delete("/:id", deleteProcedimiento);

export default router; 