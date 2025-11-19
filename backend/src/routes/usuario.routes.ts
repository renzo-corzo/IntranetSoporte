import { Router } from "express";
import {
  getUsuarios, getUsuarioById, createUsuario, updateUsuario, deleteUsuario,
  getRoles, createRol, updateRol, deleteRol,
  getRolePermissions, updateRolePermissions, getPermissionsCatalog,
  getUsuariosConDepartamento
} from "../controllers/usuario.controller";
import { verifyToken, requireRole, requirePermission } from "../middlewares/auth.middleware";

const router = Router();

// Roles (debe ir antes)
router.get("/roles", verifyToken, getRoles);
router.post("/roles", verifyToken, requireRole("admin"), createRol);
router.put("/roles/:id", verifyToken, requireRole("admin"), updateRol);
router.delete("/roles/:id", verifyToken, requireRole("admin"), deleteRol);
// Permisos por rol
router.get("/roles/:id/permisos", verifyToken, getRolePermissions);
router.put("/roles/:id/permisos", verifyToken, requirePermission("asignar_permisos"), updateRolePermissions);
router.get("/roles/permisos/catalogo", verifyToken, getPermissionsCatalog);

// Usuarios
router.get("/", verifyToken, getUsuarios);
router.get("/con-departamento", verifyToken, getUsuariosConDepartamento);
router.get("/:id", verifyToken, getUsuarioById);
router.post("/", verifyToken, requireRole("admin"), createUsuario);
router.put("/:id", verifyToken, requireRole("admin"), updateUsuario);
router.delete("/:id", verifyToken, requireRole("admin"), deleteUsuario);

export default router; 