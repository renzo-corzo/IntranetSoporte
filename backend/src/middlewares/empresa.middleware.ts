import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';

// Resuelve el cliente (Empresa) activo a partir del header X-Empresa-Id
// y lo cuelga en req.empresaId. Los módulos de infraestructura (CMDB, Stock,
// Tareas, Relevamientos, Procedimientos, KB) lo usan para filtrar todo por cliente.
export const requireEmpresa = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const empresaId = req.headers['x-empresa-id'];

    if (!empresaId || typeof empresaId !== 'string') {
      return res.status(400).json({ message: 'Falta seleccionar un cliente (header X-Empresa-Id)' });
    }

    const empresa = await prisma.empresa.findUnique({ where: { id: empresaId } });

    if (!empresa || !empresa.activo) {
      return res.status(400).json({ message: 'Cliente inválido o inactivo' });
    }

    (req as any).empresaId = empresa.id;
    next();
  } catch (error) {
    console.error('Error al resolver empresa activa:', error);
    res.status(500).json({ message: 'Error al resolver cliente activo' });
  }
};
