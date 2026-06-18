import { Request, Response } from 'express';
import prisma from '../lib/prisma';


// Obtener todas las máquinas virtuales
export const obtenerMaquinasVirtuales = async (req: Request, res: Response) => {
  try {
    const { estado, hostId, buscar, page = 1, limit = 50 } = req.query;
    const empresaId = (req as any).empresaId;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: any = { empresaId };

    if (estado) {
      where.estado = estado;
    }

    if (hostId) {
      where.hostId = hostId as string;
    }

    if (buscar) {
      where.OR = [
        { nombre: { contains: buscar as string, mode: 'insensitive' } },
        { ip: { contains: buscar as string, mode: 'insensitive' } },
        { rol: { contains: buscar as string, mode: 'insensitive' } },
        { sistemaOperativo: { contains: buscar as string, mode: 'insensitive' } }
      ];
    }

    const [maquinas, total] = await Promise.all([
      prisma.maquinaVirtual.findMany({
        where,
        skip,
        take,
        include: {
          host: true,
          servicios: true,
          _count: {
            select: {
              servicios: true
            }
          }
        },
        orderBy: { nombre: 'asc' }
      }),
      prisma.maquinaVirtual.count({ where })
    ]);

    res.json({
      data: maquinas,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit))
    });
  } catch (error) {
    console.error('Error al obtener máquinas virtuales:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener máquina virtual por ID
export const obtenerMaquinaVirtualPorId = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const empresaId = (req as any).empresaId;

    const maquina = await prisma.maquinaVirtual.findUnique({
      where: { id },
      include: {
        host: true,
        servicios: true
      }
    });

    if (!maquina || maquina.empresaId !== empresaId) {
      return res.status(404).json({ error: 'Máquina virtual no encontrada' });
    }

    res.json(maquina);
  } catch (error) {
    console.error('Error al obtener máquina virtual:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Crear máquina virtual
export const crearMaquinaVirtual = async (req: Request, res: Response) => {
  try {
    const empresaId = (req as any).empresaId;
    const {
      nombre,
      ip,
      sistemaOperativo,
      rol,
      estado,
      fechaAlta,
      fechaBaja,
      notasTecnicas,
      hostId,
      vcpu,
      ram,
      almacenamiento,
      hipervisor
    } = req.body;

    // Validar campos obligatorios
    if (!nombre) {
      return res.status(400).json({ error: 'El nombre es obligatorio' });
    }

    // Si se proporciona hostId, verificar que el servidor físico existe en este cliente
    if (hostId) {
      const host = await prisma.servidorFisico.findUnique({
        where: { id: hostId }
      });

      if (!host || host.empresaId !== empresaId) {
        return res.status(404).json({ error: 'Servidor físico (host) no encontrado' });
      }
    }

    const maquina = await prisma.maquinaVirtual.create({
      data: {
        empresaId,
        nombre,
        ip,
        sistemaOperativo,
        rol,
        estado: estado || 'PRODUCCION',
        fechaAlta: fechaAlta ? new Date(fechaAlta) : new Date(),
        fechaBaja: fechaBaja ? new Date(fechaBaja) : null,
        notasTecnicas,
        hostId,
        vcpu: vcpu ? Number(vcpu) : null,
        ram,
        almacenamiento,
        hipervisor
      },
      include: {
        host: true,
        servicios: true
      }
    });

    res.status(201).json(maquina);
  } catch (error) {
    console.error('Error al crear máquina virtual:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Actualizar máquina virtual
export const actualizarMaquinaVirtual = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const empresaId = (req as any).empresaId;
    const {
      nombre,
      ip,
      sistemaOperativo,
      rol,
      estado,
      fechaAlta,
      fechaBaja,
      notasTecnicas,
      hostId,
      vcpu,
      ram,
      almacenamiento,
      hipervisor
    } = req.body;

    // Verificar que la máquina existe
    const maquinaExistente = await prisma.maquinaVirtual.findUnique({
      where: { id }
    });

    if (!maquinaExistente || maquinaExistente.empresaId !== empresaId) {
      return res.status(404).json({ error: 'Máquina virtual no encontrada' });
    }

    // Si se cambia el hostId, verificar que el servidor físico existe en este cliente
    if (hostId && hostId !== maquinaExistente.hostId) {
      const host = await prisma.servidorFisico.findUnique({
        where: { id: hostId }
      });

      if (!host || host.empresaId !== empresaId) {
        return res.status(404).json({ error: 'Servidor físico (host) no encontrado' });
      }
    }

    const maquina = await prisma.maquinaVirtual.update({
      where: { id },
      data: {
        nombre,
        ip,
        sistemaOperativo,
        rol,
        estado,
        fechaAlta: fechaAlta ? new Date(fechaAlta) : undefined,
        fechaBaja: fechaBaja ? new Date(fechaBaja) : null,
        notasTecnicas,
        hostId,
        vcpu: vcpu ? Number(vcpu) : null,
        ram,
        almacenamiento,
        hipervisor
      },
      include: {
        host: true,
        servicios: true
      }
    });

    res.json(maquina);
  } catch (error) {
    console.error('Error al actualizar máquina virtual:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Eliminar máquina virtual
export const eliminarMaquinaVirtual = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const empresaId = (req as any).empresaId;

    // Verificar que la máquina existe
    const maquina = await prisma.maquinaVirtual.findUnique({
      where: { id },
      include: {
        servicios: true
      }
    });

    if (!maquina || maquina.empresaId !== empresaId) {
      return res.status(404).json({ error: 'Máquina virtual no encontrada' });
    }

    // Eliminar servicios asociados primero (se eliminan en cascada)
    await prisma.servicio.deleteMany({
      where: { maquinaVirtualId: id }
    });

    await prisma.maquinaVirtual.delete({
      where: { id }
    });

    res.json({ message: 'Máquina virtual eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar máquina virtual:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
