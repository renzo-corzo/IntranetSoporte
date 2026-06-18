import { Request, Response } from 'express';
import prisma from '../lib/prisma';


// Obtener todos los equipos de red
export const obtenerEquiposRed = async (req: Request, res: Response) => {
  try {
    const { estado, tipo, buscar, page = 1, limit = 50 } = req.query;
    const empresaId = (req as any).empresaId;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: any = { empresaId };

    if (estado) {
      where.estado = estado;
    }

    if (tipo) {
      where.tipo = tipo;
    }

    if (buscar) {
      where.OR = [
        { nombre: { contains: buscar as string, mode: 'insensitive' } },
        { ip: { contains: buscar as string, mode: 'insensitive' } },
        { serie: { contains: buscar as string, mode: 'insensitive' } },
        { fabricante: { contains: buscar as string, mode: 'insensitive' } },
        { modelo: { contains: buscar as string, mode: 'insensitive' } },
        { ubicacion: { contains: buscar as string, mode: 'insensitive' } }
      ];
    }

    const [equipos, total] = await Promise.all([
      prisma.equipoRed.findMany({
        where,
        skip,
        take,
        orderBy: { nombre: 'asc' }
      }),
      prisma.equipoRed.count({ where })
    ]);

    res.json({
      data: equipos,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit))
    });
  } catch (error) {
    console.error('Error al obtener equipos de red:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener equipo de red por ID
export const obtenerEquipoRedPorId = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const empresaId = (req as any).empresaId;

    const equipo = await prisma.equipoRed.findUnique({
      where: { id }
    });

    if (!equipo || equipo.empresaId !== empresaId) {
      return res.status(404).json({ error: 'Equipo de red no encontrado' });
    }

    res.json(equipo);
  } catch (error) {
    console.error('Error al obtener equipo de red:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Crear equipo de red
export const crearEquipoRed = async (req: Request, res: Response) => {
  try {
    const empresaId = (req as any).empresaId;
    const {
      nombre,
      tipo,
      ip,
      ubicacion,
      serie,
      fabricante,
      modelo,
      estado,
      fechaAlta,
      fechaBaja,
      notasTecnicas,
      firmware,
      puertos
    } = req.body;

    // Validar campos obligatorios
    if (!nombre || !tipo) {
      return res.status(400).json({ error: 'El nombre y el tipo son obligatorios' });
    }

    // Normalizar serie vacía a null para no violar el unique constraint
    const serieNorm = serie?.trim() || null;

    // Verificar si la serie ya existe en este cliente (si se proporciona)
    if (serieNorm) {
      const existeSerie = await prisma.equipoRed.findFirst({
        where: { empresaId, serie: serieNorm }
      });

      if (existeSerie) {
        return res.status(409).json({ error: 'Ya existe un equipo con esa serie' });
      }
    }

    const equipo = await prisma.equipoRed.create({
      data: {
        empresaId,
        nombre,
        tipo,
        ip:           ip           || null,
        ubicacion:    ubicacion     || null,
        serie:        serieNorm,
        fabricante:   fabricante    || null,
        modelo:       modelo        || null,
        estado:       estado        || 'PRODUCCION',
        fechaAlta:    fechaAlta     ? new Date(fechaAlta) : new Date(),
        fechaBaja:    fechaBaja     ? new Date(fechaBaja) : null,
        notasTecnicas: notasTecnicas || null,
        firmware:     firmware      || null,
        puertos:      puertos       ? Number(puertos) : null
      }
    });

    res.status(201).json(equipo);
  } catch (error) {
    console.error('Error al crear equipo de red:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Actualizar equipo de red
export const actualizarEquipoRed = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const empresaId = (req as any).empresaId;
    const {
      nombre,
      tipo,
      ip,
      ubicacion,
      serie,
      fabricante,
      modelo,
      estado,
      fechaAlta,
      fechaBaja,
      notasTecnicas,
      firmware,
      puertos
    } = req.body;

    // Verificar que el equipo existe
    const equipoExistente = await prisma.equipoRed.findUnique({
      where: { id }
    });

    if (!equipoExistente || equipoExistente.empresaId !== empresaId) {
      return res.status(404).json({ error: 'Equipo de red no encontrado' });
    }

    // Normalizar serie vacía a null para no violar el unique constraint
    const serieNorm = serie?.trim() || null;

    // Si se cambia la serie, verificar que no exista otra con esa serie en este cliente
    if (serieNorm && serieNorm !== equipoExistente.serie) {
      const existeSerie = await prisma.equipoRed.findFirst({
        where: { empresaId, serie: serieNorm }
      });

      if (existeSerie) {
        return res.status(409).json({ error: 'Ya existe otro equipo con esa serie' });
      }
    }

    const equipo = await prisma.equipoRed.update({
      where: { id },
      data: {
        nombre,
        tipo,
        ip:            ip            || null,
        ubicacion:     ubicacion      || null,
        serie:         serieNorm,
        fabricante:    fabricante     || null,
        modelo:        modelo         || null,
        estado,
        fechaAlta:     fechaAlta      ? new Date(fechaAlta) : undefined,
        fechaBaja:     fechaBaja      ? new Date(fechaBaja) : null,
        notasTecnicas: notasTecnicas  || null,
        firmware:      firmware       || null,
        puertos:       puertos        ? Number(puertos) : null
      }
    });

    res.json(equipo);
  } catch (error) {
    console.error('Error al actualizar equipo de red:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Eliminar equipo de red
export const eliminarEquipoRed = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const empresaId = (req as any).empresaId;

    // Verificar que el equipo existe
    const equipo = await prisma.equipoRed.findUnique({
      where: { id }
    });

    if (!equipo || equipo.empresaId !== empresaId) {
      return res.status(404).json({ error: 'Equipo de red no encontrado' });
    }

    await prisma.equipoRed.delete({
      where: { id }
    });

    res.json({ message: 'Equipo de red eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar equipo de red:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
