import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const obtenerConfiguracion = async (req: Request, res: Response) => {
  try {
    const config = await prisma.configuracionSistema.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1 }
    });
    res.json(config);
  } catch (error) {
    console.error('Error al obtener configuración del sistema:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const actualizarConfiguracion = async (req: Request, res: Response) => {
  try {
    const { rrhhHabilitado } = req.body;

    const config = await prisma.configuracionSistema.upsert({
      where: { id: 1 },
      update: { rrhhHabilitado },
      create: { id: 1, rrhhHabilitado: rrhhHabilitado ?? true }
    });

    res.json(config);
  } catch (error) {
    console.error('Error al actualizar configuración del sistema:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
