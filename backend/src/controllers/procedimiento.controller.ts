import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const getProcedimientos = async (req: Request, res: Response) => {
  try {
    const procedimientos = await prisma.procedimiento.findMany({
      include: { creadoPor: true, tareas: true }
    });
    res.json(procedimientos);
  } catch (err) {

    res.status(500).json({ error: "Error al obtener procedimientos" });
  }
};

export const getProcedimientoById = async (req: Request, res: Response) => {
  try {
    const procedimiento = await prisma.procedimiento.findUnique({
      where: { id: Number(req.params.id) },
      include: { creadoPor: true, tareas: true }
    });
    if (!procedimiento) return res.status(404).json({ error: "Procedimiento no encontrado" });
    res.json(procedimiento);
  } catch (err) {

    res.status(500).json({ error: "Error al obtener procedimiento" });
  }
};

export const createProcedimiento = async (req: Request, res: Response) => {
  try {
    const { titulo, descripcion, adjuntos } = req.body;
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "No autenticado" });
    }
    const procedimiento = await prisma.procedimiento.create({
      data: {
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
    const { titulo, descripcion, adjuntos } = req.body;
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
    await prisma.procedimiento.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: "Procedimiento eliminado" });
  } catch (err) {

    res.status(500).json({ error: "Error al eliminar procedimiento" });
  }
}; 