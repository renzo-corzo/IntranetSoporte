import { Request, Response } from "express";
import prisma from '../lib/prisma';

interface ItemInput {
  tipo: string;
  marca: string;
  modelo: string;
  serie: string;
  estado: string;
  observaciones?: string;
}

export const getRelevamientos = async (req: Request, res: Response) => {
  try {
    const empresaId = (req as any).empresaId;
    const relevamientos = await prisma.relevamiento.findMany({
      where: { empresaId },
      include: { items: true },
      orderBy: { fecha: 'desc' }
    });
    res.json(relevamientos);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener relevamientos" });
  }
};

export const getRelevamientoById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const empresaId = (req as any).empresaId;
    const relevamiento = await prisma.relevamiento.findUnique({
      where: { id: Number(id) },
      include: { items: true }
    });
    if (!relevamiento || relevamiento.empresaId !== empresaId) return res.status(404).json({ error: "No encontrado" });
    res.json(relevamiento);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener relevamiento" });
  }
};

export const createRelevamiento = async (req: Request, res: Response) => {
  try {
    const { fecha, responsable, ubicacion, observaciones, items } = req.body;
    const usuarioId = (req as any).user.id;
    const empresaId = (req as any).empresaId;

    if (!fecha || !responsable || !ubicacion) {
      return res.status(400).json({ error: "fecha, responsable y ubicacion son obligatorios" });
    }

    const relevamiento = await prisma.relevamiento.create({
      data: {
        empresaId,
        fecha: new Date(fecha),
        responsable,
        ubicacion,
        observaciones,
        usuarioId,
        items: {
          create: (items ?? []) as ItemInput[]
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
    const empresaId = (req as any).empresaId;
    const { fecha, responsable, ubicacion, observaciones, items } = req.body;

    const existente = await prisma.relevamiento.findUnique({ where: { id: Number(id) } });
    if (!existente || existente.empresaId !== empresaId) return res.status(404).json({ error: "No encontrado" });

    const resultado = await prisma.$transaction(async (tx) => {
      await tx.relevamiento.update({
        where: { id: Number(id) },
        data: {
          fecha: fecha ? new Date(fecha) : undefined,
          responsable,
          ubicacion,
          observaciones
        }
      });

      if (items) {
        await tx.item.deleteMany({ where: { relevamientoId: Number(id) } });
        await tx.item.createMany({
          data: (items as ItemInput[]).map(item => ({ ...item, relevamientoId: Number(id) }))
        });
      }

      return tx.relevamiento.findUnique({
        where: { id: Number(id) },
        include: { items: true }
      });
    });

    res.json(resultado);
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar relevamiento" });
  }
};

export const deleteRelevamiento = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const empresaId = (req as any).empresaId;

    const existente = await prisma.relevamiento.findUnique({ where: { id: Number(id) } });
    if (!existente || existente.empresaId !== empresaId) return res.status(404).json({ error: "No encontrado" });

    // onDelete: Cascade en el schema elimina los items automáticamente
    await prisma.relevamiento.delete({ where: { id: Number(id) } });
    res.json({ message: "Relevamiento eliminado" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar relevamiento" });
  }
};
