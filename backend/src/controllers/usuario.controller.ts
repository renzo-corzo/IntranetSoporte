import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import prisma from '../lib/prisma';

// Lista optimizada para RRHH: id, nombreCompleto, departamento
export const getUsuariosConDepartamento = async (req: Request, res: Response) => {
  try {
    const usuarios = await prisma.usuario.findMany({
      select: {
        id: true,
        nombre: true,
        departamento: true,
      },
      orderBy: { nombre: 'asc' },
    });

    const data = usuarios.map(u => ({
      id: u.id,
      nombreCompleto: u.nombre,
      departamento: u.departamento,
    }));

    res.json(data);
  } catch (err) {
    console.error('Error al obtener usuarios con departamento:', err);
    res.status(500).json({ error: 'Error al obtener usuarios con departamento' });
  }
};

export const getUsuarios = async (req: Request, res: Response) => {
  try {
    const usuarios = await prisma.usuario.findMany({ include: { rol: true } });
    res.json(usuarios);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
};

export const getUsuarioById = async (req: Request, res: Response) => {
  try {
    const usuario = await prisma.usuario.findUnique({ where: { id: Number(req.params.id) }, include: { rol: true } });
    if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });
    res.json(usuario);
  } catch (err) {

    res.status(500).json({ error: "Error al obtener usuario" });
  }
};

export const createUsuario = async (req: Request, res: Response) => {
  try {
    const { username, email, password, nombre, rolId } = req.body;
    
    console.log('Datos recibidos:', { username, email, nombre, rolId });
    
    if (!username || !password || !nombre || !rolId) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }
    
    const existe = await prisma.usuario.findUnique({ where: { username } });
    if (existe) {
      return res.status(409).json({ error: "El usuario ya existe" });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const usuario = await prisma.usuario.create({
      data: { 
        username, 
        email, 
        password: hashedPassword, 
        nombre, 
        rolId: Number(rolId) // Asegurar que rolId sea número
      },
      include: { rol: true }
    });
    
    console.log('Usuario creado exitosamente:', usuario.id);
    res.status(201).json(usuario);
  } catch (err) {
    console.error('Error al crear usuario:', err);
    res.status(500).json({ error: "Error al crear usuario", details: err });
  }
};

export const updateUsuario = async (req: Request, res: Response) => {
  try {
    const { nombre, email, password, rolId, activo } = req.body;

    const data: any = {
      nombre,
      email,
      activo: typeof activo === 'boolean' ? activo : activo !== 'false',
    };

    if (rolId !== undefined) {
      const parsedRolId = Number(rolId);
      if (Number.isNaN(parsedRolId)) {
        return res.status(400).json({ error: 'rolId inválido' });
      }
      data.rolId = parsedRolId;
    }

    if (password) {
      data.password = await bcrypt.hash(password, 10);
    }

    const usuario = await prisma.usuario.update({
      where: { id: Number(req.params.id) },
      data,
      include: { rol: true },
    });
    res.json(usuario);
  } catch (err) {
    console.error('Error al actualizar usuario:', err);
    res.status(500).json({ error: "Error al actualizar usuario", details: err });
  }
};

export const deleteUsuario = async (req: Request, res: Response) => {
  try {
    await prisma.usuario.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: "Usuario eliminado" });
  } catch (err) {

    res.status(500).json({ error: "Error al eliminar usuario" });
  }
};

// CRUD de roles
export const getRoles = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      // Por compatibilidad, si no hay user en contexto devolver vacío
      return res.status(401).json({ error: 'No autenticado' });
    }

    const usuario = await prisma.usuario.findUnique({ where: { id: Number(userId) }, include: { rol: true } });
    if (!usuario) return res.status(401).json({ error: 'Usuario no encontrado' });

    const nombreRol = usuario.rol?.nombre?.toLowerCase() || '';
    const permisosRol: string[] = (usuario.rol as any)?.permisos || [];
    const esAdmin = nombreRol === 'admin';
    const puedeVerRoles = permisosRol.includes('ver_roles');

    if (esAdmin || puedeVerRoles) {
      const roles = await prisma.rol.findMany();
      return res.json(roles);
    }

    // Sin permiso: devolver solo su propio rol para no exponer catálogos completos
    const rolPropio = await prisma.rol.findUnique({ where: { id: usuario.rolId } });
    return res.json(rolPropio ? [rolPropio] : []);
  } catch (err) {

    res.status(500).json({ error: "Error al obtener roles" });
  }
};

export const createRol = async (req: Request, res: Response) => {
  try {
    const { nombre, descripcion } = req.body;
    if (!nombre) return res.status(400).json({ error: "Falta el nombre del rol" });
    const existe = await prisma.rol.findUnique({ where: { nombre } });
    if (existe) return res.status(409).json({ error: "El rol ya existe" });
    const rol = await prisma.rol.create({ data: { nombre, descripcion } });
    res.status(201).json(rol);
  } catch (err) {

    res.status(500).json({ error: "Error al crear rol" });
  }
};

export const updateRol = async (req: Request, res: Response) => {
  try {
    const { nombre, descripcion } = req.body;
    const rol = await prisma.rol.update({ where: { id: Number(req.params.id) }, data: { nombre, descripcion } });
    res.json(rol);
  } catch (err) {

    res.status(500).json({ error: "Error al actualizar rol" });
  }
};

export const deleteRol = async (req: Request, res: Response) => {
  try {
    await prisma.rol.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: "Rol eliminado" });
  } catch (err) {

    res.status(500).json({ error: "Error al eliminar rol" });
  }
}; 

// Permisos por rol
export const getRolePermissions = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const rol = await prisma.rol.findUnique({ where: { id } });
    if (!rol) return res.status(404).json({ error: "Rol no encontrado" });
    res.json({ id: rol.id, nombre: rol.nombre, permisos: rol.permisos || [] });
  } catch (err) {
    res.status(500).json({ error: "Error al obtener permisos del rol" });
  }
};

export const updateRolePermissions = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { permisos } = req.body as { permisos: string[] };
    if (!Array.isArray(permisos)) {
      return res.status(400).json({ error: "'permisos' debe ser un arreglo de strings" });
    }
    // Normalizar: quitar duplicados y strings vacíos
    const normalizados = Array.from(new Set(permisos.map(p => String(p).trim()).filter(Boolean)));
    const rol = await prisma.rol.update({ where: { id }, data: { permisos: normalizados } });
    res.json({ id: rol.id, nombre: rol.nombre, permisos: rol.permisos || [] });
  } catch (err) {
    res.status(500).json({ error: "Error al actualizar permisos del rol" });
  }
};

export const getPermissionsCatalog = async (_req: Request, res: Response) => {
  // Catálogo básico agrupado; se puede mover a BD si se requiere
  const catalogo = {
    generales: [
      "ver_dashboard",
    ],
    usuarios: [
      "ver_usuarios",
      "editar_usuarios",
      "crear_usuarios",
      "eliminar_usuarios",
    ],
    roles: [
      "ver_roles",
      "editar_roles",
      "crear_roles",
      "eliminar_roles",
      "asignar_permisos",
    ],
    rrhh: [
      "rrhh:ver",
      "rrhh:stats",
      "empleados:read",
      "empleados:manage",
      "vacaciones:read",
      "vacaciones:manage",
      "vacaciones:approve",
      "licencias:read",
      "licencias:manage",
      "documentos_rrhh:read",
      "documentos_rrhh:manage",
    ],
    monitor: [
      "ver_monitor",
      "editar_monitor",
      "zabbix:read",
      "zabbix:manage",
    ],
    trafico: [
      "trafico:read",
      "trafico:manage",
    ],
    stock: [
      "ver_stock",
      "stock:read",
      "stock:create",
      "stock:update",
      "stock:delete",
      "aprobar_movimientos_stock",
    ],
  };
  res.json(catalogo);
};