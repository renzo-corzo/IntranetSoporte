import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import prisma from '../lib/prisma';

export const getLinks = async (req: Request, res: Response) => {
  try {
    const links = await prisma.link.findMany({ orderBy: { label: 'asc' } });
    res.json(links);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener links" });
  }
};

export const createLink = async (req: Request, res: Response) => {
  try {
    const { label, url } = req.body;
    if (!label || !url) return res.status(400).json({ error: "Faltan campos obligatorios" });
    const link = await prisma.link.create({ data: { label, url } });
    res.status(201).json(link);
  } catch (err) {
    res.status(500).json({ error: "Error al crear link" });
  }
};

export const updateLink = async (req: Request, res: Response) => {
  try {
    const { label, url } = req.body;
    const link = await prisma.link.update({ where: { id: Number(req.params.id) }, data: { label, url } });
    res.json(link);
  } catch (err) {
    res.status(500).json({ error: "Error al actualizar link" });
  }
};

export const deleteLink = async (req: Request, res: Response) => {
  try {
    await prisma.link.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: "Link eliminado" });
  } catch (err) {
    res.status(500).json({ error: "Error al eliminar link" });
  }
}; 