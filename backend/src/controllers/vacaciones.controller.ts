import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { recalcularDiasDisponibles } from './empleados.controller';

const prisma = new PrismaClient();

// Función helper para calcular días hábiles (sin fines de semana)
const calcularDiasHabiles = (fechaInicio: Date, fechaFin: Date): number => {
  let dias = 0;
  const fecha = new Date(fechaInicio);
  
  while (fecha <= fechaFin) {
    const diaSemana = fecha.getDay();
    // 0 = domingo, 6 = sábado
    if (diaSemana !== 0 && diaSemana !== 6) {
      dias++;
    }
    fecha.setDate(fecha.getDate() + 1);
  }
  
  return dias;
};

// Obtener todas las vacaciones
export const getVacaciones = async (req: Request, res: Response) => {
  try {
    const { empleadoId, estado, departamento, fechaInicio, fechaFin } = req.query;
    
    const where: any = {};
    
    if (empleadoId) {
      where.empleadoId = empleadoId;
    }
    
    if (estado && estado !== 'todos') {
      where.estado = estado;
    }
    
    if (fechaInicio && fechaFin) {
      // Parsear fechas correctamente para evitar problemas de zona horaria
      const fechaInicioDate = new Date(fechaInicio as string);
      fechaInicioDate.setHours(0, 0, 0, 0);
      const fechaFinDate = new Date(fechaFin as string);
      fechaFinDate.setHours(23, 59, 59, 999);
      
      // Una vacación se solapa con el rango si:
      // fechaInicio <= finRango AND fechaFin >= inicioRango
      where.AND = [
        { fechaInicio: { lte: fechaFinDate } },
        { fechaFin: { gte: fechaInicioDate } }
      ];
    }

    let vacaciones = await prisma.vacacion.findMany({
      where,
      include: {
        empleado: true,
        decididoPor: {
          select: { nombre: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Filtrar por departamento si se especifica
    if (departamento && departamento !== 'todos') {
      vacaciones = vacaciones.filter(v => v.empleado.departamento === departamento);
    }

    res.json({
      success: true,
      data: vacaciones
    });
  } catch (error) {
    console.error('Error al obtener vacaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Crear nueva solicitud de vacaciones
export const createVacacion = async (req: Request, res: Response) => {
  try {
    const { empleadoId, fechaInicio, fechaFin, observaciones } = req.body;

    console.log('📝 Crear vacación - Datos recibidos:', { empleadoId, fechaInicio, fechaFin, observaciones });

    // Validar campos requeridos
    if (!empleadoId || !fechaInicio || !fechaFin) {
      console.log('❌ Faltan campos requeridos');
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos: empleadoId, fechaInicio, fechaFin'
      });
    }

    // Validar que el empleado existe
    const empleado = await prisma.empleado.findUnique({
      where: { id: empleadoId }
    });

    if (!empleado) {
      console.log('❌ Empleado no encontrado:', empleadoId);
      return res.status(404).json({
        success: false,
        message: 'Empleado no encontrado'
      });
    }

    console.log('✅ Empleado encontrado:', empleado.nombre, 'Días disponibles:', empleado.diasDisponibles);

    // Validar formato de fechas
    const fechaInicioDate = new Date(fechaInicio);
    const fechaFinDate = new Date(fechaFin);

    if (isNaN(fechaInicioDate.getTime()) || isNaN(fechaFinDate.getTime())) {
      console.log('❌ Fechas inválidas');
      return res.status(400).json({
        success: false,
        message: 'Formato de fechas inválido'
      });
    }

    if (fechaInicioDate >= fechaFinDate) {
      console.log('❌ Fecha inicio >= fecha fin');
      return res.status(400).json({
        success: false,
        message: 'La fecha de inicio debe ser anterior a la fecha de fin'
      });
    }

    // Calcular días solicitados (solo días hábiles)
    const diasSolicitados = calcularDiasHabiles(fechaInicioDate, fechaFinDate);
    console.log('📅 Días solicitados:', diasSolicitados);

    // Verificar que el empleado tenga días disponibles
    if (diasSolicitados > empleado.diasDisponibles) {
      console.log('❌ No tiene suficientes días. Solicitados:', diasSolicitados, 'Disponibles:', empleado.diasDisponibles);
      return res.status(400).json({
        success: false,
        message: `No tiene suficientes días disponibles. Solicitados: ${diasSolicitados}, Disponibles: ${empleado.diasDisponibles}`
      });
    }

    // Verificar solapamientos (solo con vacaciones activas, no eliminadas)
    const solapamiento = await prisma.vacacion.findFirst({
      where: {
        empleadoId,
        estado: { in: ['PENDIENTE', 'APROBADA'] },
        OR: [
          {
            AND: [
              { fechaInicio: { lte: fechaInicioDate } },
              { fechaFin: { gte: fechaInicioDate } }
            ]
          },
          {
            AND: [
              { fechaInicio: { lte: fechaFinDate } },
              { fechaFin: { gte: fechaFinDate } }
            ]
          },
          {
            AND: [
              { fechaInicio: { gte: fechaInicioDate } },
              { fechaFin: { lte: fechaFinDate } }
            ]
          }
        ]
      }
    });

    if (solapamiento) {
      console.log('❌ Solapamiento encontrado:', solapamiento.id);
      return res.status(400).json({
        success: false,
        message: 'Ya tiene una solicitud de vacaciones en ese período'
      });
    }

    console.log('✅ Validaciones pasadas, creando vacación...');

    const vacacion = await prisma.vacacion.create({
      data: {
        empleadoId,
        fechaInicio: fechaInicioDate,
        fechaFin: fechaFinDate,
        diasSolicitados,
        observaciones
      },
      include: {
        empleado: true
      }
    });

    console.log('✅ Vacación creada exitosamente:', vacacion.id);

    res.status(201).json({
      success: true,
      data: vacacion
    });
  } catch (error: any) {
    console.error('❌ Error al crear vacación:', error);
    console.error('❌ Detalles del error:', error.message);
    console.error('❌ Stack:', error.stack);
    
    // Si es un error de Prisma, dar más detalles
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: 'Ya existe una vacación con estos datos'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Aprobar vacación
export const aprobarVacacion = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { comentarioDecision } = req.body;
    const decididoPorId = (req as any).user.id;

    const vacacion = await prisma.vacacion.update({
      where: { id },
      data: {
        estado: 'APROBADA',
        decididoPorId,
        comentarioDecision,
        decididoEn: new Date()
      },
      include: {
        empleado: true,
        decididoPor: {
          select: { nombre: true }
        }
      }
    });

    // Recalcular días disponibles basándose en diasBase2023 + días acumulados - días usados
    const empleadoAntes = await prisma.empleado.findUnique({
      where: { id: vacacion.empleadoId },
      select: { diasDisponibles: true, nombre: true, apellido: true }
    });

    const nuevosDiasDisponibles = await recalcularDiasDisponibles(vacacion.empleadoId);

    const empleadoActualizado = await prisma.empleado.update({
      where: { id: vacacion.empleadoId },
      data: {
        diasDisponibles: nuevosDiasDisponibles
      }
    });

    console.log(`✅ Vacación aprobada - Días recalculados:`, {
      empleado: `${empleadoAntes?.nombre} ${empleadoAntes?.apellido}`,
      diasAntes: empleadoAntes?.diasDisponibles,
      diasDescontados: vacacion.diasSolicitados,
      diasDespues: empleadoActualizado.diasDisponibles
    });

    res.json({
      success: true,
      data: vacacion
    });
  } catch (error) {
    console.error('Error al aprobar vacación:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Rechazar vacación
export const rechazarVacacion = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { comentarioDecision } = req.body;
    const decididoPorId = (req as any).user.id;

    const vacacion = await prisma.vacacion.update({
      where: { id },
      data: {
        estado: 'RECHAZADA',
        decididoPorId,
        comentarioDecision,
        decididoEn: new Date()
      },
      include: {
        empleado: true,
        decididoPor: {
          select: { nombre: true }
        }
      }
    });

    res.json({
      success: true,
      data: vacacion
    });
  } catch (error) {
    console.error('Error al rechazar vacación:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Cancelar vacación
export const cancelarVacacion = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const vacacion = await prisma.vacacion.findUnique({
      where: { id }
    });

    if (!vacacion) {
      return res.status(404).json({
        success: false,
        message: 'Vacación no encontrada'
      });
    }

    // Si estaba aprobada, recalcular días disponibles
    if (vacacion.estado === 'APROBADA') {
      const empleadoAntes = await prisma.empleado.findUnique({
        where: { id: vacacion.empleadoId },
        select: { diasDisponibles: true, nombre: true, apellido: true }
      });

      const nuevosDiasDisponibles = await recalcularDiasDisponibles(vacacion.empleadoId);

      const empleadoActualizado = await prisma.empleado.update({
        where: { id: vacacion.empleadoId },
        data: {
          diasDisponibles: nuevosDiasDisponibles
        }
      });

      console.log(`✅ Vacación cancelada - Días recalculados:`, {
        empleado: `${empleadoAntes?.nombre} ${empleadoAntes?.apellido}`,
        diasAntes: empleadoAntes?.diasDisponibles,
        diasDevueltos: vacacion.diasSolicitados,
        diasDespues: empleadoActualizado.diasDisponibles
      });
    }

    const vacacionCancelada = await prisma.vacacion.update({
      where: { id },
      data: {
        estado: 'CANCELADA'
      }
    });

    res.json({
      success: true,
      data: vacacionCancelada
    });
  } catch (error) {
    console.error('Error al cancelar vacación:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Eliminar vacación (solo para corrección de errores)
export const eliminarVacacion = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const vacacion = await prisma.vacacion.findUnique({
      where: { id }
    });

    if (!vacacion) {
      return res.status(404).json({
        success: false,
        message: 'Vacación no encontrada'
      });
    }

    // Si estaba aprobada, recalcular días disponibles antes de eliminar
    if (vacacion.estado === 'APROBADA') {
      const empleadoAntes = await prisma.empleado.findUnique({
        where: { id: vacacion.empleadoId },
        select: { diasDisponibles: true, nombre: true, apellido: true }
      });

      // Eliminar primero la vacación para que no se cuente en el recálculo
      await prisma.vacacion.delete({
        where: { id }
      });

      const nuevosDiasDisponibles = await recalcularDiasDisponibles(vacacion.empleadoId);

      const empleadoActualizado = await prisma.empleado.update({
        where: { id: vacacion.empleadoId },
        data: {
          diasDisponibles: nuevosDiasDisponibles
        }
      });

      console.log(`✅ Vacación eliminada - Días recalculados:`, {
        empleado: `${empleadoAntes?.nombre} ${empleadoAntes?.apellido}`,
        diasAntes: empleadoAntes?.diasDisponibles,
        diasDevueltos: vacacion.diasSolicitados,
        diasDespues: empleadoActualizado.diasDisponibles
      });

      res.json({
        success: true,
        message: 'Vacación eliminada correctamente'
      });
      return;
    }

    // Si no estaba aprobada, solo eliminar

    // Eliminar la vacación (si no estaba aprobada, ya se eliminó arriba)
    await prisma.vacacion.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Vacación eliminada correctamente'
    });
  } catch (error) {
    console.error('Error al eliminar vacación:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};
