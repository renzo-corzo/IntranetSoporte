import { Router } from "express";
import {
  obtenerCredenciales,
  crearCredencial,
  actualizarCredencial,
  eliminarCredencial,
  revelarCredencial,
} from "../controllers/credenciales.controller";
import { verifyToken, requirePermission } from "../middlewares/auth.middleware";
import { requireEmpresa } from "../middlewares/empresa.middleware";

const router = Router();

router.use(verifyToken);
router.use(requireEmpresa);

// 📌 Rutas: /api/credenciales
router.get("/", requirePermission(["cmdb:read", "cmdb:manage"]), obtenerCredenciales);
router.post("/", requirePermission(["cmdb:manage"]), crearCredencial);
router.put("/:id", requirePermission(["cmdb:manage"]), actualizarCredencial);
router.delete("/:id", requirePermission(["cmdb:manage"]), eliminarCredencial);
router.post("/:id/revelar", requirePermission(["cmdb:manage"]), revelarCredencial);

export default router;
