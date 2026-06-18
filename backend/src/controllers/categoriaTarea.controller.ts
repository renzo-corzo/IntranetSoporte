import { Request, Response } from "express";
import prisma from '../lib/prisma';


// Obtener todas las categorías de tareas
export const getCategoriasTarea = async (req: Request, res: Response) => {
  try {
    const empresaId = (req as any).empresaId;
    const categorias = await prisma.categoriaTarea.findMany({
      where: { empresaId, activa: true },
      include: {
        _count: {
          select: { tareas: true }
        }
      },
      orderBy: { nombre: 'asc' }
    });
    res.json(categorias);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener categorías de tareas" });
  }
};

// Obtener una categoría por ID
export const getCategoriaTareaById = async (req: Request, res: Response) => {
  try {
    const empresaId = (req as any).empresaId;
    const categoria = await prisma.categoriaTarea.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        tareas: {
          include: {
            responsable: { select: { id: true, nombre: true } },
            creadaPor: { select: { id: true, nombre: true } }
          }
        },
        _count: {
          select: { tareas: true }
        }
      }
    });

    if (!categoria || categoria.empresaId !== empresaId) {
      return res.status(404).json({ error: "Categoría no encontrada" });
    }

    res.json(categoria);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener categoría" });
  }
};

// Crear nueva categoría
export const createCategoriaTarea = async (req: Request, res: Response) => {
  try {
    const empresaId = (req as any).empresaId;
    const { nombre, descripcion, color, icono } = req.body;

    if (!nombre) {
      return res.status(400).json({ error: "El nombre es obligatorio" });
    }

    const categoria = await prisma.categoriaTarea.create({
      data: {
        empresaId,
        nombre,
        descripcion,
        color,
        icono
      }
    });

    res.status(201).json(categoria);
  } catch (err: any) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: "Ya existe una categoría con ese nombre" });
    }
    res.status(500).json({ error: "Error al crear categoría" });
  }
};

// Actualizar categoría
export const updateCategoriaTarea = async (req: Request, res: Response) => {
  try {
    const empresaId = (req as any).empresaId;
    const { nombre, descripcion, color, icono, activa } = req.body;

    const existente = await prisma.categoriaTarea.findUnique({ where: { id: Number(req.params.id) } });
    if (!existente || existente.empresaId !== empresaId) {
      return res.status(404).json({ error: "Categoría no encontrada" });
    }

    const categoria = await prisma.categoriaTarea.update({
      where: { id: Number(req.params.id) },
      data: {
        nombre,
        descripcion,
        color,
        icono,
        activa
      }
    });

    res.json(categoria);
  } catch (err: any) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: "Categoría no encontrada" });
    }
    if (err.code === 'P2002') {
      return res.status(409).json({ error: "Ya existe una categoría con ese nombre" });
    }
    res.status(500).json({ error: "Error al actualizar categoría" });
  }
};

// Eliminar categoría (soft delete)
export const deleteCategoriaTarea = async (req: Request, res: Response) => {
  try {
    const empresaId = (req as any).empresaId;
    const categoriaId = Number(req.params.id);

    // Verificar si tiene tareas asociadas
    const categoria = await prisma.categoriaTarea.findUnique({
      where: { id: categoriaId },
      include: {
        _count: {
          select: { tareas: true }
        }
      }
    });

    if (!categoria || categoria.empresaId !== empresaId) {
      return res.status(404).json({ error: "Categoría no encontrada" });
    }

    if (categoria._count.tareas > 0) {
      // Soft delete - marcar como inactiva
      await prisma.categoriaTarea.update({
        where: { id: categoriaId },
        data: { activa: false }
      });
      res.json({ message: "Categoría desactivada (tiene tareas asociadas)" });
    } else {
      // Hard delete - eliminar permanentemente
      await prisma.categoriaTarea.delete({
        where: { id: categoriaId }
      });
      res.json({ message: "Categoría eliminada" });
    }
  } catch (err) {
    res.status(500).json({ error: "Error al eliminar categoría" });
  }
};
