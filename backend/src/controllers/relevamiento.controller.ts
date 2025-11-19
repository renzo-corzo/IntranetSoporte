import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getRelevamientos = async (req: Request, res: Response) => {
  try {
    const relevamientos = await prisma.relevamiento.findMany({
      include: { items: true }
    });
    res.json(relevamientos);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener relevamientos" });
  }
};

export const getRelevamientoById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const relevamiento = await prisma.relevamiento.findUnique({
      where: { id: Number(id) },
      include: { items: true }
    });
    if (!relevamiento) return res.status(404).json({ error: "No encontrado" });
    res.json(relevamiento);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener relevamiento" });
  }
};

export const createRelevamiento = async (req: Request, res: Response) => {
  try {
    const { fecha, responsable, ubicacion, observaciones, usuarioId, items } = req.body;
    const relevamiento = await prisma.relevamiento.create({
      data: {
        fecha: new Date(fecha),
        responsable,
        ubicacion,
        observaciones,
        usuarioId,
        items: {
          create: items
        }
      },
      include: { items: true }
    });
    res.status(201).json(relevamiento);
  } catch (error) {
    res.status(500).json({ error: "Error al crear relevamiento" });
  }
};

export const updateRelevamiento = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { fecha, responsable, ubicacion, observaciones, items } = req.body;
    // Actualizar relevamiento
    const relevamiento = await prisma.relevamiento.update({
      where: { id: Number(id) },
      data: {
        fecha: fecha ? new Date(fecha) : undefined,
        responsable,
        ubicacion,
        observaciones
      }
    });
    // Actualizar ítems (borrado y recreación simplificada)
    if (items) {
      await prisma.item.deleteMany({ where: { relevamientoId: Number(id) } });
      await prisma.item.createMany({ data: items.map((item: any) => ({ ...item, relevamientoId: Number(id) })) });
    }
    const relevamientoActualizado = await prisma.relevamiento.findUnique({
      where: { id: Number(id) },
      include: { items: true }
    });
    res.json(relevamientoActualizado);
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar relevamiento" });
  }
};

export const deleteRelevamiento = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.item.deleteMany({ where: { relevamientoId: Number(id) } });
    await prisma.relevamiento.delete({ where: { id: Number(id) } });
    res.json({ message: "Relevamiento eliminado" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar relevamiento" });
  }
}; 