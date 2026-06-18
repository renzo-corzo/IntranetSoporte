import { Request, Response } from "express";
import prisma from '../lib/prisma';

export const getProcedimientos = async (req: Request, res: Response) => {
  try {
    const empresaId = (req as any).empresaId;
    const procedimientos = await prisma.procedimiento.findMany({
      where: { empresaId },
      include: { creadoPor: true, tareas: true }
    });
    res.json(procedimientos);
  } catch (err) {

    res.status(500).json({ error: "Error al obtener procedimientos" });
  }
};

export const getProcedimientoById = async (req: Request, res: Response) => {
  try {
    const empresaId = (req as any).empresaId;
    const procedimiento = await prisma.procedimiento.findUnique({
      where: { id: Number(req.params.id) },
      include: { creadoPor: true, tareas: true }
    });
    if (!procedimiento || procedimiento.empresaId !== empresaId) return res.status(404).json({ error: "Procedimiento no encontrado" });
    res.json(procedimiento);
  } catch (err) {

    res.status(500).json({ error: "Error al obtener procedimiento" });
  }
};

export const createProcedimiento = async (req: Request, res: Response) => {
  try {
    const { titulo, descripcion, adjuntos } = req.body;
    const userId = (req as any).user?.id;
    const empresaId = (req as any).empresaId;
    if (!userId) {
      return res.status(401).json({ error: "No autenticado" });
    }
    const procedimiento = await prisma.procedimiento.create({
      data: {
        empresaId,
        titulo,
        descripcion,
        adjuntos: adjuntos || [],
        creadoPorId: userId
      }
    });
    res.status(201).json(procedimiento);
  } catch (err) {

    res.status(500).json({ error: "Error al crear procedimiento" });
  }
};

export const updateProcedimiento = async (req: Request, res: Response) => {
  try {
    const empresaId = (req as any).empresaId;
    const { titulo, descripcion, adjuntos } = req.body;

    const existente = await prisma.procedimiento.findUnique({ where: { id: Number(req.params.id) } });
    if (!existente || existente.empresaId !== empresaId) return res.status(404).json({ error: "Procedimiento no encontrado" });

    const procedimiento = await prisma.procedimiento.update({
      where: { id: Number(req.params.id) },
      data: {
        titulo,
        descripcion,
        adjuntos: adjuntos || []
      }
    });
    res.json(procedimiento);
  } catch (err) {

    res.status(500).json({ error: "Error al actualizar procedimiento" });
  }
};

export const deleteProcedimiento = async (req: Request, res: Response) => {
  try {
    const empresaId = (req as any).empresaId;

    const existente = await prisma.procedimiento.findUnique({ where: { id: Number(req.params.id) } });
    if (!existente || existente.empresaId !== empresaId) return res.status(404).json({ error: "Procedimiento no encontrado" });

    await prisma.procedimiento.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: "Procedimiento eliminado" });
  } catch (err) {

    res.status(500).json({ error: "Error al eliminar procedimiento" });
  }
};
