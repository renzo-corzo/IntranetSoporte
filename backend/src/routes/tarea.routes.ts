import { Router } from "express";
import {
  getTareas,
  getTareaById,
  createTarea,
  updateTarea,
  deleteTarea,
  addComentario,
  completarTarea
} from "../controllers/tarea.controller";

const router = Router();

router.get("/", getTareas);
router.get("/:id", getTareaById);
router.post("/", createTarea);
router.put("/:id", updateTarea);
router.delete("/:id", deleteTarea);
router.post("/:id/comentarios", addComentario);
router.post("/:id/completar", completarTarea);

export default router; 