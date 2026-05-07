import { Router } from "express";
import {
  getCategorias, getCategoriaById, createCategoria, updateCategoria, deleteCategoria, cleanAndDeleteCategoria, deleteCategoriaWithArticles,
  getArticulos, getArticuloById, createArticulo, updateArticulo, deleteArticulo, getNextCodigo
} from "../controllers/kb.controller";
import { verifyToken, requireRole } from "../middlewares/auth.middleware";

const router = Router();

// Categorías
router.get("/categorias", verifyToken, getCategorias);
router.get("/categorias/:id", verifyToken, getCategoriaById);
router.post("/categorias", verifyToken, requireRole(["admin", "tecnico"]), createCategoria);
router.put("/categorias/:id", verifyToken, requireRole(["admin", "tecnico"]), updateCategoria);
router.delete("/categorias/:id", verifyToken, requireRole("admin"), deleteCategoria);
router.delete("/categorias/:id/clean", verifyToken, requireRole("admin"), cleanAndDeleteCategoria);
router.delete("/categorias/:id/force", verifyToken, requireRole("admin"), deleteCategoriaWithArticles);

// Artículos (Procedimientos)
router.get("/articulos/next-codigo", verifyToken, getNextCodigo);
router.get("/articulos", verifyToken, getArticulos);
router.get("/articulos/:id", verifyToken, getArticuloById);
router.post("/articulos", verifyToken, requireRole(["admin", "tecnico"]), createArticulo);
router.put("/articulos/:id", verifyToken, requireRole(["admin", "tecnico"]), updateArticulo);
router.delete("/articulos/:id", verifyToken, requireRole("admin"), deleteArticulo);

export default router; 