import { Router } from "express";
import {
  getCategorias, getCategoriaById, createCategoria, updateCategoria, deleteCategoria, cleanAndDeleteCategoria, deleteCategoriaWithArticles,
  getArticulos, getArticuloById, createArticulo, updateArticulo, deleteArticulo, getNextCodigo
} from "../controllers/kb.controller";
import { verifyToken, requireRole } from "../middlewares/auth.middleware";
import { requireEmpresa, requireModulo } from "../middlewares/empresa.middleware";

const router = Router();

router.use(verifyToken);
router.use(requireEmpresa);
router.use(requireModulo("kb"));

// Categorías
router.get("/categorias", getCategorias);
router.get("/categorias/:id", getCategoriaById);
router.post("/categorias", requireRole(["admin", "tecnico"]), createCategoria);
router.put("/categorias/:id", requireRole(["admin", "tecnico"]), updateCategoria);
router.delete("/categorias/:id", requireRole("admin"), deleteCategoria);
router.delete("/categorias/:id/clean", requireRole("admin"), cleanAndDeleteCategoria);
router.delete("/categorias/:id/force", requireRole("admin"), deleteCategoriaWithArticles);

// Artículos (Procedimientos)
router.get("/articulos/next-codigo", getNextCodigo);
router.get("/articulos", getArticulos);
router.get("/articulos/:id", getArticuloById);
router.post("/articulos", requireRole(["admin", "tecnico"]), createArticulo);
router.put("/articulos/:id", requireRole(["admin", "tecnico"]), updateArticulo);
router.delete("/articulos/:id", requireRole("admin"), deleteArticulo);

export default router;
