import { Request, Response } from 'express';
import prisma from '../lib/prisma';


// Obtener estadísticas del CMDB
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const empresaId = (req as any).empresaId;

    // Contar por tipo
    const [
      totalServidores,
      totalVMs,
      totalEquiposRed,
      totalEquiposUsuario,
      totalServicios,
      servidoresProduccion,
      servidoresFueraServicio,
      vmsProduccion,
      equiposRedProduccion,
      equiposUsuarioProduccion,
      serviciosProduccion
    ] = await Promise.all([
      prisma.servidorFisico.count({ where: { empresaId } }),
      prisma.maquinaVirtual.count({ where: { empresaId } }),
      prisma.equipoRed.count({ where: { empresaId } }),
      prisma.equipoUsuario.count({ where: { empresaId } }),
      prisma.servicio.count({ where: { empresaId } }),
      prisma.servidorFisico.count({ where: { empresaId, estado: 'PRODUCCION' } }),
      prisma.servidorFisico.count({ where: { empresaId, estado: 'FUERA_DE_SERVICIO' } }),
      prisma.maquinaVirtual.count({ where: { empresaId, estado: 'PRODUCCION' } }),
      prisma.equipoRed.count({ where: { empresaId, estado: 'PRODUCCION' } }),
      prisma.equipoUsuario.count({ where: { empresaId, estado: 'PRODUCCION' } }),
      prisma.servicio.count({ where: { empresaId, estado: 'PRODUCCION' } })
    ]);

    // Obtener equipos con garantía próxima a vencer (próximos 90 días)
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() + 90);

    const garantiasProximas = await prisma.servidorFisico.findMany({
      where: {
        empresaId,
        garantia: {
          not: null,
          lte: fechaLimite,
          gte: new Date() // Solo futuras
        }
      },
      select: {
        id: true,
        nombre: true,
        garantia: true,
        serie: true
      },
      orderBy: {
        garantia: 'asc'
      }
    });

    // Obtener equipos fuera de servicio
    const equiposFueraServicio = await prisma.servidorFisico.findMany({
      where: { empresaId, estado: 'FUERA_DE_SERVICIO' },
      select: {
        id: true,
        nombre: true,
        estado: true,
        ip: true
      },
      take: 10
    });

    // Distribución por estado
    const distribucionEstado = {
      PRODUCCION: servidoresProduccion + vmsProduccion + equiposRedProduccion + equiposUsuarioProduccion,
      TEST: await prisma.servidorFisico.count({ where: { empresaId, estado: 'TEST' } }) +
            await prisma.maquinaVirtual.count({ where: { empresaId, estado: 'TEST' } }) +
            await prisma.equipoRed.count({ where: { empresaId, estado: 'TEST' } }) +
            await prisma.equipoUsuario.count({ where: { empresaId, estado: 'TEST' } }),
      FUERA_DE_SERVICIO: servidoresFueraServicio +
                         await prisma.maquinaVirtual.count({ where: { empresaId, estado: 'FUERA_DE_SERVICIO' } }) +
                         await prisma.equipoRed.count({ where: { empresaId, estado: 'FUERA_DE_SERVICIO' } }) +
                         await prisma.equipoUsuario.count({ where: { empresaId, estado: 'FUERA_DE_SERVICIO' } }),
      MANTENIMIENTO: await prisma.servidorFisico.count({ where: { empresaId, estado: 'MANTENIMIENTO' } }) +
                     await prisma.maquinaVirtual.count({ where: { empresaId, estado: 'MANTENIMIENTO' } }) +
                     await prisma.equipoRed.count({ where: { empresaId, estado: 'MANTENIMIENTO' } }) +
                     await prisma.equipoUsuario.count({ where: { empresaId, estado: 'MANTENIMIENTO' } })
    };

    // Distribución por tipo de equipo
    const distribucionTipo = {
      servidores: totalServidores,
      vms: totalVMs,
      equiposRed: totalEquiposRed,
      equiposUsuario: totalEquiposUsuario,
      servicios: totalServicios
    };

    // Obtener ubicaciones únicas
    const ubicaciones = await prisma.servidorFisico.findMany({
      where: { empresaId },
      select: { ubicacion: true },
      distinct: ['ubicacion']
    });

    const distribucionUbicacion: Record<string, number> = {};
    for (const ubic of ubicaciones) {
      if (ubic.ubicacion) {
        const count = await prisma.servidorFisico.count({
          where: { empresaId, ubicacion: ubic.ubicacion }
        });
        distribucionUbicacion[ubic.ubicacion] = count;
      }
    }

    res.json({
      totales: {
        servidores: totalServidores,
        vms: totalVMs,
        equiposRed: totalEquiposRed,
        equiposUsuario: totalEquiposUsuario,
        servicios: totalServicios,
        total: totalServidores + totalVMs + totalEquiposRed + totalEquiposUsuario
      },
      enProduccion: {
        servidores: servidoresProduccion,
        vms: vmsProduccion,
        equiposRed: equiposRedProduccion,
        equiposUsuario: equiposUsuarioProduccion,
        servicios: serviciosProduccion
      },
      alertas: {
        garantiasProximas: garantiasProximas.map(g => ({
          ...g,
          diasRestantes: g.garantia ? Math.ceil((new Date(g.garantia).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null
        })),
        equiposFueraServicio: equiposFueraServicio.length
      },
      distribucion: {
        porEstado: distribucionEstado,
        porTipo: distribucionTipo,
        porUbicacion: distribucionUbicacion
      }
    });
  } catch (error) {
    console.error('Error al obtener estadísticas del CMDB:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Búsqueda global en todos los activos
export const busquedaGlobal = async (req: Request, res: Response) => {
  try {
    const { q, tipo, limit = 20 } = req.query;
    const empresaId = (req as any).empresaId;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Parámetro de búsqueda requerido' });
    }

    const busqueda = q.toLowerCase();
    const resultados: any[] = [];

    // Buscar en servidores físicos
    if (!tipo || tipo === 'servidores') {
      const servidores = await prisma.servidorFisico.findMany({
        where: {
          empresaId,
          OR: [
            { nombre: { contains: busqueda, mode: 'insensitive' } },
            { ip: { contains: busqueda, mode: 'insensitive' } },
            { serie: { contains: busqueda, mode: 'insensitive' } },
            { rol: { contains: busqueda, mode: 'insensitive' } },
            { ubicacion: { contains: busqueda, mode: 'insensitive' } }
          ]
        },
        take: Number(limit),
        select: {
          id: true,
          nombre: true,
          ip: true,
          estado: true
        }
      });
      resultados.push(...servidores.map(s => ({ ...s, tipo: 'servidor', tipoLabel: 'Servidor Físico' })));
    }

    // Buscar en VMs
    if (!tipo || tipo === 'vms') {
      const vms = await prisma.maquinaVirtual.findMany({
        where: {
          empresaId,
          OR: [
            { nombre: { contains: busqueda, mode: 'insensitive' } },
            { ip: { contains: busqueda, mode: 'insensitive' } },
            { rol: { contains: busqueda, mode: 'insensitive' } }
          ]
        },
        take: Number(limit),
        select: {
          id: true,
          nombre: true,
          ip: true,
          estado: true
        }
      });
      resultados.push(...vms.map(vm => ({ ...vm, tipo: 'vm', tipoLabel: 'Máquina Virtual' })));
    }

    // Buscar en equipos de red
    if (!tipo || tipo === 'red') {
      const equiposRed = await prisma.equipoRed.findMany({
        where: {
          empresaId,
          OR: [
            { nombre: { contains: busqueda, mode: 'insensitive' } },
            { ip: { contains: busqueda, mode: 'insensitive' } },
            { serie: { contains: busqueda, mode: 'insensitive' } },
            { fabricante: { contains: busqueda, mode: 'insensitive' } },
            { modelo: { contains: busqueda, mode: 'insensitive' } }
          ]
        },
        take: Number(limit),
        select: {
          id: true,
          nombre: true,
          ip: true,
          estado: true,
          tipo: true
        }
      });
      resultados.push(...equiposRed.map(e => ({ ...e, tipo: 'red', tipoLabel: `Equipo de Red (${e.tipo})` })));
    }

    // Buscar en equipos de usuario
    if (!tipo || tipo === 'usuario') {
      const equiposUsuario = await prisma.equipoUsuario.findMany({
        where: {
          empresaId,
          OR: [
            { nombre: { contains: busqueda, mode: 'insensitive' } },
            { ip: { contains: busqueda, mode: 'insensitive' } },
            { serie: { contains: busqueda, mode: 'insensitive' } },
            { area: { contains: busqueda, mode: 'insensitive' } }
          ]
        },
        take: Number(limit),
        include: {
          usuario: {
            select: {
              nombre: true,
              apellido: true
            }
          }
        }
      });
      resultados.push(...equiposUsuario.map(e => ({
        id: e.id,
        nombre: e.nombre,
        ip: e.ip,
        estado: e.estado,
        tipo: 'usuario',
        tipoLabel: `Equipo de Usuario (${e.tipo})`,
        usuarioNombre: e.usuario ? `${e.usuario.nombre} ${e.usuario.apellido}` : null
      })));
    }

    // Buscar en servicios
    if (!tipo || tipo === 'servicios') {
      const servicios = await prisma.servicio.findMany({
        where: {
          empresaId,
          OR: [
            { nombre: { contains: busqueda, mode: 'insensitive' } }
          ]
        },
        take: Number(limit),
        select: {
          id: true,
          nombre: true,
          tipo: true,
          estado: true
        }
      });
      // Filtrar por tipo si coincide con la búsqueda
      const serviciosFiltrados = servicios.filter(s =>
        s.nombre.toLowerCase().includes(busqueda) ||
        s.tipo.toLowerCase().includes(busqueda)
      );
      resultados.push(...serviciosFiltrados.map(s => ({
        id: s.id,
        nombre: s.nombre,
        estado: s.estado,
        tipo: 'servicio',
        tipoLabel: `Servicio (${s.tipo})`,
        tipoServicio: s.tipo
      })));
    }

    res.json({
      query: q,
      total: resultados.length,
      resultados: resultados.slice(0, Number(limit))
    });
  } catch (error) {
    console.error('Error en búsqueda global:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
