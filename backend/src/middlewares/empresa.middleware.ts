import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';

export const MODULOS_VALIDOS = ['cmdb', 'stock', 'tareas', 'relevamientos', 'procedimientos', 'kb'] as const;
export type ModuloKey = typeof MODULOS_VALIDOS[number];

// Resuelve el cliente (Empresa) activo a partir del header X-Empresa-Id
// y lo cuelga en req.empresaId / req.empresaModulos. Los módulos de
// infraestructura (CMDB, Stock, Tareas, Relevamientos, Procedimientos, KB)
// lo usan para filtrar todo por cliente y para saber qué módulos tiene habilitados.
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
    (req as any).empresaModulos = empresa.modulosHabilitados;
    next();
  } catch (error) {
    console.error('Error al resolver empresa activa:', error);
    res.status(500).json({ message: 'Error al resolver cliente activo' });
  }
};

// Bloquea el acceso a un módulo si el cliente activo no lo tiene habilitado.
// Se monta después de requireEmpresa en las rutas de cada módulo multi-cliente.
export const requireModulo = (modulo: ModuloKey) => (req: Request, res: Response, next: NextFunction) => {
  const modulos: string[] = (req as any).empresaModulos || [];
  if (!modulos.includes(modulo)) {
    return res.status(403).json({ message: `El módulo "${modulo}" no está habilitado para este cliente` });
  }
  next();
};
