import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Función helper para convertir fecha YYYY-MM-DD a Date sin problemas de zona horaria
const parseDateString = (dateString: string): Date => {
  // Si la fecha viene como YYYY-MM-DD, la parseamos manualmente
  // para evitar problemas de zona horaria
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day); // month es 0-indexed en JavaScript
};

// Función helper para convertir Date a formato YYYY-MM-DD sin problemas de zona horaria
const formatDateToString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Obtener todas las licencias
export const getLicencias = async (req: Request, res: Response) => {
  try {
    const { empleadoId, tipo, fechaInicio, fechaFin } = req.query;
    
    const where: any = {};
    
    if (empleadoId) {
      where.empleadoId = empleadoId;
    }
    
    if (tipo && tipo !== 'todos') {
      where.tipo = tipo;
    }
    
    if (fechaInicio && fechaFin) {
      where.OR = [
        {
          AND: [
            { fechaInicio: { gte: parseDateString(fechaInicio as string) } },
            { fechaInicio: { lte: parseDateString(fechaFin as string) } }
          ]
        },
        {
          AND: [
            { fechaFin: { gte: parseDateString(fechaInicio as string) } },
            { fechaFin: { lte: parseDateString(fechaFin as string) } }
          ]
        }
      ];
    }

    const licencias = await prisma.licencia.findMany({
      where,
      include: {
        empleado: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Formatear fechas a YYYY-MM-DD para evitar problemas de zona horaria
    const licenciasFormateadas = licencias.map(licencia => ({
      ...licencia,
      fechaInicio: formatDateToString(licencia.fechaInicio),
      fechaFin: formatDateToString(licencia.fechaFin),
      createdAt: licencia.createdAt.toISOString(),
      updatedAt: licencia.updatedAt.toISOString()
    }));

    res.json({
      success: true,
      data: licenciasFormateadas
    });
  } catch (error) {
    console.error('Error al obtener licencias:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Crear nueva licencia
export const createLicencia = async (req: Request, res: Response) => {
  try {
    const { empleadoId, tipo, fechaInicio, fechaFin, observaciones } = req.body;

    // Validar datos requeridos
    if (!empleadoId || !tipo || !fechaInicio || !fechaFin) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos'
      });
    }

    // Validar fechas usando parseDateString para evitar problemas de zona horaria
    const fechaInicioDate = parseDateString(fechaInicio);
    const fechaFinDate = parseDateString(fechaFin);
    
    if (fechaInicioDate >= fechaFinDate) {
      return res.status(400).json({
        success: false,
        message: 'La fecha de inicio debe ser anterior a la fecha de fin'
      });
    }

    // Validar que el empleado existe
    const empleado = await prisma.empleado.findUnique({
      where: { id: empleadoId }
    });

    if (!empleado) {
      return res.status(404).json({
        success: false,
        message: 'Empleado no encontrado'
      });
    }

    // Verificar solapamientos con vacaciones
    const solapamientoVacaciones = await prisma.vacacion.findFirst({
      where: {
        empleadoId,
        estado: { in: ['PENDIENTE', 'APROBADA'] },
        OR: [
          {
            AND: [
              { fechaInicio: { lte: parseDateString(fechaInicio) } },
              { fechaFin: { gte: parseDateString(fechaInicio) } }
            ]
          },
          {
            AND: [
              { fechaInicio: { lte: parseDateString(fechaFin) } },
              { fechaFin: { gte: parseDateString(fechaFin) } }
            ]
          },
          {
            AND: [
              { fechaInicio: { gte: parseDateString(fechaInicio) } },
              { fechaFin: { lte: parseDateString(fechaFin) } }
            ]
          }
        ]
      }
    });

    if (solapamientoVacaciones) {
      return res.status(400).json({
        success: false,
        message: 'Conflicto con vacaciones existentes en ese período'
      });
    }

    // Verificar solapamientos con otras licencias existentes
    // Si una licencia fue eliminada, no aparecerá en esta consulta
    const solapamientoLicencias = await prisma.licencia.findFirst({
      where: {
        empleadoId,
        OR: [
          {
            AND: [
              { fechaInicio: { lte: parseDateString(fechaInicio) } },
              { fechaFin: { gte: parseDateString(fechaInicio) } }
            ]
          },
          {
            AND: [
              { fechaInicio: { lte: parseDateString(fechaFin) } },
              { fechaFin: { gte: parseDateString(fechaFin) } }
            ]
          },
          {
            AND: [
              { fechaInicio: { gte: parseDateString(fechaInicio) } },
              { fechaFin: { lte: parseDateString(fechaFin) } }
            ]
          }
        ]
      }
    });

    if (solapamientoLicencias) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe una licencia en ese período para este empleado'
      });
    }

    const licencia = await prisma.licencia.create({
      data: {
        empleadoId,
        tipo,
        fechaInicio: parseDateString(fechaInicio),
        fechaFin: parseDateString(fechaFin),
        observaciones
      },
      include: {
        empleado: true
      }
    });

    // Formatear fechas a YYYY-MM-DD antes de enviar
    const licenciaFormateada = {
      ...licencia,
      fechaInicio: formatDateToString(licencia.fechaInicio),
      fechaFin: formatDateToString(licencia.fechaFin),
      createdAt: licencia.createdAt.toISOString(),
      updatedAt: licencia.updatedAt.toISOString()
    };

    res.status(201).json({
      success: true,
      data: licenciaFormateada
    });
  } catch (error: any) {
    console.error('Error al crear licencia:', error);
    
    // Si es un error de Prisma, dar más detalles
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: 'Ya existe una licencia con estos datos'
      });
    }
    
    // Si es un error de validación, mostrar el mensaje
    if (error.message) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Actualizar licencia
export const updateLicencia = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { tipo, fechaInicio, fechaFin, observaciones } = req.body;

    const licencia = await prisma.licencia.update({
      where: { id },
      data: {
        tipo,
        fechaInicio: parseDateString(fechaInicio),
        fechaFin: parseDateString(fechaFin),
        observaciones
      },
      include: {
        empleado: true
      }
    });

    // Formatear fechas a YYYY-MM-DD antes de enviar
    const licenciaFormateada = {
      ...licencia,
      fechaInicio: formatDateToString(licencia.fechaInicio),
      fechaFin: formatDateToString(licencia.fechaFin),
      createdAt: licencia.createdAt.toISOString(),
      updatedAt: licencia.updatedAt.toISOString()
    };

    res.json({
      success: true,
      data: licenciaFormateada
    });
  } catch (error) {
    console.error('Error al actualizar licencia:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Eliminar licencia
export const deleteLicencia = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.licencia.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Licencia eliminada correctamente'
    });
  } catch (error) {
    console.error('Error al eliminar licencia:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener tipos de licencia disponibles
export const getTiposLicencia = async (req: Request, res: Response) => {
  try {
    const tipos = [
      'Enfermedad',
      'Maternidad',
      'Paternidad',
      'Duelo',
      'Estudios',
      'Personal',
      'Otro'
    ];

    res.json({
      success: true,
      data: tipos
    });
  } catch (error) {
    console.error('Error al obtener tipos de licencia:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};