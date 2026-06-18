import { Request, Response } from 'express';
import prisma from '../lib/prisma';


// Obtener todos los servicios
export const obtenerServicios = async (req: Request, res: Response) => {
  try {
    const { estado, tipo, tipoEquipo, servidorFisicoId, maquinaVirtualId, buscar, page = 1, limit = 50 } = req.query;
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

    if (tipoEquipo) {
      where.tipoEquipo = tipoEquipo;
    }

    if (servidorFisicoId) {
      where.servidorFisicoId = servidorFisicoId as string;
    }

    if (maquinaVirtualId) {
      where.maquinaVirtualId = maquinaVirtualId as string;
    }

    if (buscar) {
      where.OR = [
        { nombre: { contains: buscar as string, mode: 'insensitive' } },
        { version: { contains: buscar as string, mode: 'insensitive' } }
      ];
    }

    const [servicios, total] = await Promise.all([
      prisma.servicio.findMany({
        where,
        skip,
        take,
        include: {
          servidorFisico: true,
          maquinaVirtual: true
        },
        orderBy: { nombre: 'asc' }
      }),
      prisma.servicio.count({ where })
    ]);

    res.json({
      data: servicios,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit))
    });
  } catch (error) {
    console.error('Error al obtener servicios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener servicio por ID
export const obtenerServicioPorId = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const empresaId = (req as any).empresaId;

    const servicio = await prisma.servicio.findUnique({
      where: { id },
      include: {
        servidorFisico: true,
        maquinaVirtual: true
      }
    });

    if (!servicio || servicio.empresaId !== empresaId) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }

    res.json(servicio);
  } catch (error) {
    console.error('Error al obtener servicio:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Crear servicio
export const crearServicio = async (req: Request, res: Response) => {
  try {
    const empresaId = (req as any).empresaId;
    const {
      nombre,
      tipo,
      version,
      puerto,
      ssid,
      estado,
      fechaAlta,
      fechaBaja,
      notasTecnicas,
      tipoEquipo,
      servidorFisicoId,
      maquinaVirtualId
    } = req.body;

    // Validar campos obligatorios (tipoEquipo es opcional: permite servicios independientes, ej. WiFi)
    if (!nombre || !tipo) {
      return res.status(400).json({ error: 'El nombre y el tipo son obligatorios' });
    }

    // Validar que se proporcione solo uno de los dos: servidorFisicoId o maquinaVirtualId
    if (tipoEquipo === 'SERVIDOR_FISICO' && !servidorFisicoId) {
      return res.status(400).json({ error: 'Se debe proporcionar servidorFisicoId para servicios en servidores físicos' });
    }

    if (tipoEquipo === 'MAQUINA_VIRTUAL' && !maquinaVirtualId) {
      return res.status(400).json({ error: 'Se debe proporcionar maquinaVirtualId para servicios en máquinas virtuales' });
    }

    // Verificar que el servidor físico o VM existe en este cliente
    if (servidorFisicoId) {
      const servidor = await prisma.servidorFisico.findUnique({
        where: { id: servidorFisicoId }
      });

      if (!servidor || servidor.empresaId !== empresaId) {
        return res.status(404).json({ error: 'Servidor físico no encontrado' });
      }
    }

    if (maquinaVirtualId) {
      const maquina = await prisma.maquinaVirtual.findUnique({
        where: { id: maquinaVirtualId }
      });

      if (!maquina || maquina.empresaId !== empresaId) {
        return res.status(404).json({ error: 'Máquina virtual no encontrada' });
      }
    }

    const servicio = await prisma.servicio.create({
      data: {
        empresaId,
        nombre,
        tipo,
        version,
        puerto: puerto ? Number(puerto) : null,
        ssid: ssid || null,
        estado: estado || 'PRODUCCION',
        fechaAlta: fechaAlta ? new Date(fechaAlta) : new Date(),
        fechaBaja: fechaBaja ? new Date(fechaBaja) : null,
        notasTecnicas,
        tipoEquipo: tipoEquipo || null,
        servidorFisicoId: tipoEquipo === 'SERVIDOR_FISICO' ? servidorFisicoId : null,
        maquinaVirtualId: tipoEquipo === 'MAQUINA_VIRTUAL' ? maquinaVirtualId : null
      },
      include: {
        servidorFisico: true,
        maquinaVirtual: true
      }
    });

    res.status(201).json(servicio);
  } catch (error) {
    console.error('Error al crear servicio:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Actualizar servicio
export const actualizarServicio = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const empresaId = (req as any).empresaId;
    const {
      nombre,
      tipo,
      version,
      puerto,
      ssid,
      estado,
      fechaAlta,
      fechaBaja,
      notasTecnicas,
      tipoEquipo,
      servidorFisicoId,
      maquinaVirtualId
    } = req.body;

    // Verificar que el servicio existe
    const servicioExistente = await prisma.servicio.findUnique({
      where: { id }
    });

    if (!servicioExistente || servicioExistente.empresaId !== empresaId) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }

    // Validar que se proporcione solo uno de los dos: servidorFisicoId o maquinaVirtualId
    if (tipoEquipo === 'SERVIDOR_FISICO' && !servidorFisicoId) {
      return res.status(400).json({ error: 'Se debe proporcionar servidorFisicoId para servicios en servidores físicos' });
    }

    if (tipoEquipo === 'MAQUINA_VIRTUAL' && !maquinaVirtualId) {
      return res.status(400).json({ error: 'Se debe proporcionar maquinaVirtualId para servicios en máquinas virtuales' });
    }

    // Verificar que el servidor físico o VM existe en este cliente
    if (servidorFisicoId) {
      const servidor = await prisma.servidorFisico.findUnique({
        where: { id: servidorFisicoId }
      });

      if (!servidor || servidor.empresaId !== empresaId) {
        return res.status(404).json({ error: 'Servidor físico no encontrado' });
      }
    }

    if (maquinaVirtualId) {
      const maquina = await prisma.maquinaVirtual.findUnique({
        where: { id: maquinaVirtualId }
      });

      if (!maquina || maquina.empresaId !== empresaId) {
        return res.status(404).json({ error: 'Máquina virtual no encontrada' });
      }
    }

    const servicio = await prisma.servicio.update({
      where: { id },
      data: {
        nombre,
        tipo,
        version,
        puerto: puerto ? Number(puerto) : null,
        ssid: ssid || null,
        estado,
        fechaAlta: fechaAlta ? new Date(fechaAlta) : undefined,
        fechaBaja: fechaBaja ? new Date(fechaBaja) : null,
        notasTecnicas,
        tipoEquipo: tipoEquipo || null,
        servidorFisicoId: tipoEquipo === 'SERVIDOR_FISICO' ? servidorFisicoId : null,
        maquinaVirtualId: tipoEquipo === 'MAQUINA_VIRTUAL' ? maquinaVirtualId : null
      },
      include: {
        servidorFisico: true,
        maquinaVirtual: true
      }
    });

    res.json(servicio);
  } catch (error) {
    console.error('Error al actualizar servicio:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Eliminar servicio
export const eliminarServicio = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const empresaId = (req as any).empresaId;

    // Verificar que el servicio existe
    const servicio = await prisma.servicio.findUnique({
      where: { id }
    });

    if (!servicio || servicio.empresaId !== empresaId) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }

    await prisma.servicio.delete({
      where: { id }
    });

    res.json({ message: 'Servicio eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar servicio:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
