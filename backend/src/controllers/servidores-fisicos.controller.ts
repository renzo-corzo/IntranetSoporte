import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Obtener todos los servidores físicos
export const obtenerServidoresFisicos = async (req: Request, res: Response) => {
  try {
    const { estado, buscar, page = 1, limit = 50 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: any = {};

    if (estado) {
      where.estado = estado;
    }

    if (buscar) {
      where.OR = [
        { nombre: { contains: buscar as string, mode: 'insensitive' } },
        { ip: { contains: buscar as string, mode: 'insensitive' } },
        { serie: { contains: buscar as string, mode: 'insensitive' } },
        { rol: { contains: buscar as string, mode: 'insensitive' } },
        { ubicacion: { contains: buscar as string, mode: 'insensitive' } }
      ];
    }

    const [servidores, total] = await Promise.all([
      prisma.servidorFisico.findMany({
        where,
        skip,
        take,
        include: {
          maquinasVirtuales: true,
          servicios: true,
          _count: {
            select: {
              maquinasVirtuales: true,
              servicios: true
            }
          }
        },
        orderBy: { nombre: 'asc' }
      }),
      prisma.servidorFisico.count({ where })
    ]);

    res.json({
      data: servidores,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit))
    });
  } catch (error) {
    console.error('Error al obtener servidores físicos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener servidor físico por ID
export const obtenerServidorFisicoPorId = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const servidor = await prisma.servidorFisico.findUnique({
      where: { id },
      include: {
        maquinasVirtuales: true,
        servicios: true
      }
    });

    if (!servidor) {
      return res.status(404).json({ error: 'Servidor físico no encontrado' });
    }

    res.json(servidor);
  } catch (error) {
    console.error('Error al obtener servidor físico:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Crear servidor físico
export const crearServidorFisico = async (req: Request, res: Response) => {
  try {
    const {
      nombre,
      ip,
      rol,
      ubicacion,
      serie,
      garantia,
      estado,
      fechaAlta,
      fechaBaja,
      notasTecnicas,
      procesador,
      ram,
      almacenamiento,
      sistemaOperativo,
      fabricante,
      modelo
    } = req.body;

    // Validar campos obligatorios
    if (!nombre) {
      return res.status(400).json({ error: 'El nombre es obligatorio' });
    }

    // Verificar si la serie ya existe (si se proporciona)
    if (serie) {
      const existeSerie = await prisma.servidorFisico.findUnique({
        where: { serie }
      });

      if (existeSerie) {
        return res.status(409).json({ error: 'Ya existe un servidor con esa serie' });
      }
    }

    const servidor = await prisma.servidorFisico.create({
      data: {
        nombre,
        ip,
        rol,
        ubicacion,
        serie,
        garantia: garantia ? new Date(garantia) : null,
        estado: estado || 'PRODUCCION',
        fechaAlta: fechaAlta ? new Date(fechaAlta) : new Date(),
        fechaBaja: fechaBaja ? new Date(fechaBaja) : null,
        notasTecnicas,
        procesador,
        ram,
        almacenamiento,
        sistemaOperativo,
        fabricante,
        modelo
      },
      include: {
        maquinasVirtuales: true,
        servicios: true
      }
    });

    res.status(201).json(servidor);
  } catch (error) {
    console.error('Error al crear servidor físico:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Actualizar servidor físico
export const actualizarServidorFisico = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      nombre,
      ip,
      rol,
      ubicacion,
      serie,
      garantia,
      estado,
      fechaAlta,
      fechaBaja,
      notasTecnicas,
      procesador,
      ram,
      almacenamiento,
      sistemaOperativo,
      fabricante,
      modelo
    } = req.body;

    // Verificar que el servidor existe
    const servidorExistente = await prisma.servidorFisico.findUnique({
      where: { id }
    });

    if (!servidorExistente) {
      return res.status(404).json({ error: 'Servidor físico no encontrado' });
    }

    // Si se cambia la serie, verificar que no exista otra con esa serie
    if (serie && serie !== servidorExistente.serie) {
      const existeSerie = await prisma.servidorFisico.findUnique({
        where: { serie }
      });

      if (existeSerie) {
        return res.status(409).json({ error: 'Ya existe otro servidor con esa serie' });
      }
    }

    const servidor = await prisma.servidorFisico.update({
      where: { id },
      data: {
        nombre,
        ip,
        rol,
        ubicacion,
        serie,
        garantia: garantia ? new Date(garantia) : null,
        estado,
        fechaAlta: fechaAlta ? new Date(fechaAlta) : undefined,
        fechaBaja: fechaBaja ? new Date(fechaBaja) : null,
        notasTecnicas,
        procesador,
        ram,
        almacenamiento,
        sistemaOperativo,
        fabricante,
        modelo
      },
      include: {
        maquinasVirtuales: true,
        servicios: true
      }
    });

    res.json(servidor);
  } catch (error) {
    console.error('Error al actualizar servidor físico:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Eliminar servidor físico
export const eliminarServidorFisico = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Verificar que el servidor existe
    const servidor = await prisma.servidorFisico.findUnique({
      where: { id },
      include: {
        maquinasVirtuales: true,
        servicios: true
      }
    });

    if (!servidor) {
      return res.status(404).json({ error: 'Servidor físico no encontrado' });
    }

    // Verificar si tiene VMs asociadas
    if (servidor.maquinasVirtuales.length > 0) {
      return res.status(400).json({ 
        error: 'No se puede eliminar el servidor porque tiene máquinas virtuales asociadas' 
      });
    }

    // Eliminar servicios asociados primero (se eliminan en cascada)
    await prisma.servicio.deleteMany({
      where: { servidorFisicoId: id }
    });

    await prisma.servidorFisico.delete({
      where: { id }
    });

    res.json({ message: 'Servidor físico eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar servidor físico:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

