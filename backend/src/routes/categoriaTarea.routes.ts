import { Router } from "express";
import { verifyToken, requireRole } from "../middlewares/auth.middleware";
import {
  getCategoriasTarea,
  getCategoriaTareaById,
  createCategoriaTarea,
  updateCategoriaTarea,
  deleteCategoriaTarea
} from "../controllers/categoriaTarea.controller";

const router = Router();

// Todas las rutas requieren autenticación
router.use(verifyToken);

// Obtener todas las categorías (todos los roles)
router.get("/", getCategoriasTarea);

// Obtener categoría por ID (todos los roles)
router.get("/:id", getCategoriaTareaById);

// Crear nueva categoría (solo admin y técnico)
router.post("/", requireRole(["admin", "tecnico"]), createCategoriaTarea);

// Actualizar categoría (solo admin y técnico)
router.put("/:id", requireRole(["admin", "tecnico"]), updateCategoriaTarea);

// Eliminar categoría (solo admin)
router.delete("/:id", requireRole(["admin"]), deleteCategoriaTarea);

export default router;