import { Router } from "express";
import {
  getTareas,
  getTareaById,
  createTarea,
  updateTarea,
  deleteTarea,
  addComentario,
  completarTarea,
  changeEstadoTarea,
  asignarResponsableTarea,
  cerrarTarea,
  reabrirTarea,
  getTareasKpis,
  getTareasTablero,
  getTareasAgenda,
  getComentariosTarea
} from "../controllers/tarea.controller";
import { verifyToken, requirePermission } from "../middlewares/auth.middleware";
import { requireEmpresa } from "../middlewares/empresa.middleware";

const router = Router();

router.use(verifyToken);
router.use(requireEmpresa);

router.get("/kpis", requirePermission("tareas:read"), getTareasKpis);
router.get("/tablero", requirePermission("tareas:read"), getTareasTablero);
router.get("/agenda", requirePermission("tareas:read"), getTareasAgenda);
router.get("/", requirePermission("tareas:read"), getTareas);
router.post("/", requirePermission("tareas:create"), createTarea);
router.get("/:id", requirePermission("tareas:read"), getTareaById);
router.put("/:id", requirePermission("tareas:update"), updateTarea);
router.patch("/:id/estado", requirePermission("tareas:update"), changeEstadoTarea);
router.patch("/:id/asignacion", requirePermission("tareas:update"), asignarResponsableTarea);
router.post("/:id/cerrar", requirePermission("tareas:update"), cerrarTarea);
router.post("/:id/reabrir", requirePermission("tareas:update"), reabrirTarea);
router.delete("/:id", requirePermission("tareas:delete"), deleteTarea);
router.get("/:id/comentarios", requirePermission("tareas:read"), getComentariosTarea);
router.post("/:id/comentarios", requirePermission("tareas:update"), addComentario);
router.post("/:id/completar", requirePermission("tareas:update"), completarTarea);

export default router; 