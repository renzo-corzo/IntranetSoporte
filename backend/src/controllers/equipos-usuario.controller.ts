import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Obtener todos los equipos de usuario
export const obtenerEquiposUsuario = async (req: Request, res: Response) => {
  try {
    const { estado, tipo, usuarioId, area, buscar, page = 1, limit = 50 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: any = {};

    if (estado) {
      where.estado = estado;
    }

    if (tipo) {
      where.tipo = tipo;
    }

    if (usuarioId) {
      where.usuarioId = usuarioId as string;
    }

    if (area) {
      where.area = area as string;
    }

    if (buscar) {
      where.OR = [
        { nombre: { contains: buscar as string, mode: 'insensitive' } },
        { ip: { contains: buscar as string, mode: 'insensitive' } },
        { serie: { contains: buscar as string, mode: 'insensitive' } },
        { fabricante: { contains: buscar as string, mode: 'insensitive' } },
        { modelo: { contains: buscar as string, mode: 'insensitive' } },
        { ubicacion: { contains: buscar as string, mode: 'insensitive' } },
        { area: { contains: buscar as string, mode: 'insensitive' } }
      ];
    }

    const [equipos, total] = await Promise.all([
      prisma.equipoUsuario.findMany({
        where,
        skip,
        take,
        include: {
          usuario: true
        },
        orderBy: { nombre: 'asc' }
      }),
      prisma.equipoUsuario.count({ where })
    ]);

    res.json({
      data: equipos,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit))
    });
  } catch (error) {
    console.error('Error al obtener equipos de usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener equipo de usuario por ID
export const obtenerEquipoUsuarioPorId = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const equipo = await prisma.equipoUsuario.findUnique({
      where: { id },
      include: {
        usuario: true
      }
    });

    if (!equipo) {
      return res.status(404).json({ error: 'Equipo de usuario no encontrado' });
    }

    res.json(equipo);
  } catch (error) {
    console.error('Error al obtener equipo de usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Crear equipo de usuario
export const crearEquipoUsuario = async (req: Request, res: Response) => {
  try {
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
      sistemaOperativo,
      usuarioId,
      area
    } = req.body;

    // Validar campos obligatorios
    if (!nombre || !tipo) {
      return res.status(400).json({ error: 'El nombre y el tipo son obligatorios' });
    }

    // Verificar si la serie ya existe (si se proporciona)
    if (serie) {
      const existeSerie = await prisma.equipoUsuario.findUnique({
        where: { serie }
      });

      if (existeSerie) {
        return res.status(409).json({ error: 'Ya existe un equipo con esa serie' });
      }
    }

    // Si se proporciona usuarioId, verificar que el empleado existe
    if (usuarioId) {
      const empleado = await prisma.empleado.findUnique({
        where: { id: usuarioId }
      });

      if (!empleado) {
        return res.status(404).json({ error: 'Empleado no encontrado' });
      }
    }

    const equipo = await prisma.equipoUsuario.create({
      data: {
        nombre,
        tipo,
        ip,
        ubicacion,
        serie,
        fabricante,
        modelo,
        estado: estado || 'PRODUCCION',
        fechaAlta: fechaAlta ? new Date(fechaAlta) : new Date(),
        fechaBaja: fechaBaja ? new Date(fechaBaja) : null,
        notasTecnicas,
        sistemaOperativo,
        usuarioId,
        area
      },
      include: {
        usuario: true
      }
    });

    res.status(201).json(equipo);
  } catch (error) {
    console.error('Error al crear equipo de usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Actualizar equipo de usuario
export const actualizarEquipoUsuario = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
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
      sistemaOperativo,
      usuarioId,
      area
    } = req.body;

    // Verificar que el equipo existe
    const equipoExistente = await prisma.equipoUsuario.findUnique({
      where: { id }
    });

    if (!equipoExistente) {
      return res.status(404).json({ error: 'Equipo de usuario no encontrado' });
    }

    // Si se cambia la serie, verificar que no exista otra con esa serie
    if (serie && serie !== equipoExistente.serie) {
      const existeSerie = await prisma.equipoUsuario.findUnique({
        where: { serie }
      });

      if (existeSerie) {
        return res.status(409).json({ error: 'Ya existe otro equipo con esa serie' });
      }
    }

    // Si se cambia el usuarioId, verificar que el empleado existe
    if (usuarioId && usuarioId !== equipoExistente.usuarioId) {
      const empleado = await prisma.empleado.findUnique({
        where: { id: usuarioId }
      });

      if (!empleado) {
        return res.status(404).json({ error: 'Empleado no encontrado' });
      }
    }

    const equipo = await prisma.equipoUsuario.update({
      where: { id },
      data: {
        nombre,
        tipo,
        ip,
        ubicacion,
        serie,
        fabricante,
        modelo,
        estado,
        fechaAlta: fechaAlta ? new Date(fechaAlta) : undefined,
        fechaBaja: fechaBaja ? new Date(fechaBaja) : null,
        notasTecnicas,
        sistemaOperativo,
        usuarioId,
        area
      },
      include: {
        usuario: true
      }
    });

    res.json(equipo);
  } catch (error) {
    console.error('Error al actualizar equipo de usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Eliminar equipo de usuario
export const eliminarEquipoUsuario = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Verificar que el equipo existe
    const equipo = await prisma.equipoUsuario.findUnique({
      where: { id }
    });

    if (!equipo) {
      return res.status(404).json({ error: 'Equipo de usuario no encontrado' });
    }

    await prisma.equipoUsuario.delete({
      where: { id }
    });

    res.json({ message: 'Equipo de usuario eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar equipo de usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

