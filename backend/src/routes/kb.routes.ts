import { Router } from "express";
import {
  getCategorias, getCategoriaById, createCategoria, updateCategoria, deleteCategoria, cleanAndDeleteCategoria, deleteCategoriaWithArticles,
  getArticulos, getArticuloById, createArticulo, updateArticulo, deleteArticulo, getNextCodigo
} from "../controllers/kb.controller";
import { verifyToken, requireRole } from "../middlewares/auth.middleware";
import { requireEmpresa } from "../middlewares/empresa.middleware";

const router = Router();

// Categorías
router.get("/categorias", verifyToken, requireEmpresa, getCategorias);
router.get("/categorias/:id", verifyToken, requireEmpresa, getCategoriaById);
router.post("/categorias", verifyToken, requireEmpresa, requireRole(["admin", "tecnico"]), createCategoria);
router.put("/categorias/:id", verifyToken, requireEmpresa, requireRole(["admin", "tecnico"]), updateCategoria);
router.delete("/categorias/:id", verifyToken, requireEmpresa, requireRole("admin"), deleteCategoria);
router.delete("/categorias/:id/clean", verifyToken, requireEmpresa, requireRole("admin"), cleanAndDeleteCategoria);
router.delete("/categorias/:id/force", verifyToken, requireEmpresa, requireRole("admin"), deleteCategoriaWithArticles);

// Artículos (Procedimientos)
router.get("/articulos/next-codigo", verifyToken, requireEmpresa, getNextCodigo);
router.get("/articulos", verifyToken, requireEmpresa, getArticulos);
router.get("/articulos/:id", verifyToken, requireEmpresa, getArticuloById);
router.post("/articulos", verifyToken, requireEmpresa, requireRole(["admin", "tecnico"]), createArticulo);
router.put("/articulos/:id", verifyToken, requireEmpresa, requireRole(["admin", "tecnico"]), updateArticulo);
router.delete("/articulos/:id", verifyToken, requireEmpresa, requireRole("admin"), deleteArticulo);

export default router;
