import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { addDays, addWeeks, addMonths, addYears, isSameDay, isSameWeek, isSameMonth, isSameYear, startOfDay } from "date-fns";
const prisma = new PrismaClient();

export const getTareas = async (req: Request, res: Response) => {
  try {
    // 1. Obtener todas las tareas recurrentes (con repetición activa)
    const tareas = await prisma.tarea.findMany({
      include: { responsable: true, creadaPor: true, comentarios: { include: { autor: true } } }
    });
    const now = new Date();
    const nuevasTareas: any[] = [];
    for (const tarea of tareas) {
      // Solo tareas con repetición activa y estado pendiente o hecha
      if (
        tarea.repeticion && tarea.repeticion !== "No se repite" && tarea.periodo && tarea.estado !== "eliminada"
      ) {
        let debeCrear = false;
        let nuevaFecha: Date | null = null;
        if (tarea.periodo === "Diario") {
          // Si no hay tarea para hoy, crearla
          if (!isSameDay(new Date(tarea.creadaEn), now)) {
            debeCrear = true;
            nuevaFecha = startOfDay(now);
          }
        } else if (tarea.periodo === "Semanal") {
          if (!isSameWeek(new Date(tarea.creadaEn), now, { weekStartsOn: 1 })) {
            debeCrear = true;
            nuevaFecha = startOfDay(now);
          }
        } else if (tarea.periodo === "Mensual") {
          if (!isSameMonth(new Date(tarea.creadaEn), now)) {
            debeCrear = true;
            nuevaFecha = startOfDay(now);
          }
        } else if (tarea.periodo === "Anual") {
          if (!isSameYear(new Date(tarea.creadaEn), now)) {
            debeCrear = true;
            nuevaFecha = startOfDay(now);
          }
        }
        // Si corresponde, crear nueva instancia
        if (debeCrear && nuevaFecha) {
          const nueva = await prisma.tarea.create({
            data: {
              titulo: tarea.titulo,
              descripcion: tarea.descripcion,
              responsableId: tarea.responsableId,
              estado: "pendiente",
              prioridad: tarea.prioridad,
              tipo: tarea.tipo,
              periodo: tarea.periodo,
              repeticion: tarea.repeticion,
              intervalo: tarea.intervalo,
              fechaVencimiento: tarea.fechaVencimiento,
              creadaPorId: tarea.creadaPorId,
              procedimientoId: tarea.procedimientoId
            }
          });
          nuevasTareas.push(nueva);
        }
      }
    }
    // Volver a consultar todas las tareas (incluyendo las nuevas)
    const tareasFinal = await prisma.tarea.findMany({
      include: { responsable: true, creadaPor: true, comentarios: { include: { autor: true } } }
    });
    res.json(tareasFinal);
  } catch (err) {

    res.status(500).json({ error: "Error al obtener tareas" });
  }
};

export const getTareaById = async (req: Request, res: Response) => {
  try {
    const tarea = await prisma.tarea.findUnique({
      where: { id: Number(req.params.id) },
      include: { responsable: true, creadaPor: true, comentarios: { include: { autor: true } } }
    });
    if (!tarea) return res.status(404).json({ error: "Tarea no encontrada" });
    res.json(tarea);
  } catch (err) {

    res.status(500).json({ error: "Error al obtener tarea" });
  }
};

export const createTarea = async (req: Request, res: Response) => {
  try {
    const { titulo, descripcion, responsableId, estado, prioridad, tipo, periodo, repeticion, intervalo, diaDelMes, fechaVencimiento, creadaPorId } = req.body;
    
    let nuevaFechaVencimiento = fechaVencimiento ? new Date(fechaVencimiento) : null;
    
    // Si es una tarea repetitiva y no tiene fecha específica, calcular la próxima fecha
    if (!fechaVencimiento && periodo && periodo !== '' && diaDelMes) {
      nuevaFechaVencimiento = calcularProximaFecha(periodo, diaDelMes);
      console.log('Calculando fecha inicial para tarea repetitiva:', nuevaFechaVencimiento);
    }
    
    const tarea = await prisma.tarea.create({
      data: {
        titulo,
        descripcion,
        responsableId,
        estado,
        prioridad,
        tipo,
        periodo,
        repeticion: repeticion || "No se repite",
        intervalo,
        diaDelMes,
        fechaVencimiento: nuevaFechaVencimiento,
        creadaPorId
      },
      include: { responsable: true, creadaPor: true, comentarios: { include: { autor: true } } }
    });
    
    console.log('Tarea creada con fecha:', tarea.fechaVencimiento);
    res.status(201).json(tarea);
  } catch (err) {
    console.error('Error al crear tarea:', err);
    res.status(500).json({ error: "Error al crear tarea" });
  }
};

// Función para calcular la próxima fecha basada en la periodicidad
const calcularProximaFecha = (periodo: string, diaDelMes?: string, fechaActual?: Date) => {
  const hoy = fechaActual || new Date();
  let proximaFecha = new Date(hoy);

  switch (periodo) {
    case 'Diario':
      proximaFecha.setDate(hoy.getDate() + 1);
      break;
    
    case 'Semanal':
      proximaFecha.setDate(hoy.getDate() + 7);
      break;
    
    case 'Mensual':
      if (diaDelMes && diaDelMes !== 'ultimo') {
        const dia = parseInt(diaDelMes);
        proximaFecha.setMonth(hoy.getMonth() + 1);
        proximaFecha.setDate(dia);
        
        // Si la fecha ya pasó este mes, ir al siguiente mes
        if (proximaFecha <= hoy) {
          proximaFecha.setMonth(proximaFecha.getMonth() + 1);
        }
      } else if (diaDelMes === 'ultimo') {
        // Último día del próximo mes
        proximaFecha.setMonth(hoy.getMonth() + 2, 0); // Día 0 = último día del mes anterior
      } else {
        // Si no hay día específico, usar el mismo día del próximo mes
        proximaFecha.setMonth(hoy.getMonth() + 1);
      }
      break;
    
    case 'Anual':
      proximaFecha.setFullYear(hoy.getFullYear() + 1);
      break;
    
    default:
      return null; // No es repetitiva
  }

  return proximaFecha;
};

export const updateTarea = async (req: Request, res: Response) => {
  try {
    const { titulo, descripcion, responsableId, estado, prioridad, tipo, periodo, repeticion, intervalo, diaDelMes, fechaVencimiento, finalizadaEn } = req.body;
    
    console.log('Actualizando tarea:', req.params.id, { fechaVencimiento, periodo, diaDelMes });
    
    let nuevaFechaVencimiento = fechaVencimiento ? new Date(fechaVencimiento) : null;
    
    // Si la tarea se marca como completada y es repetitiva, calcular próxima fecha
    if (estado === 'hecha' && periodo && periodo !== '' && !fechaVencimiento) {
      nuevaFechaVencimiento = calcularProximaFecha(periodo, diaDelMes);
      console.log('Calculando próxima fecha para tarea repetitiva:', nuevaFechaVencimiento);
    }
    
    const tarea = await prisma.tarea.update({
      where: { id: Number(req.params.id) },
      data: {
        titulo,
        descripcion,
        responsableId,
        estado,
        prioridad,
        tipo,
        periodo,
        repeticion,
        intervalo,
        diaDelMes,
        fechaVencimiento: nuevaFechaVencimiento,
        finalizadaEn: finalizadaEn ? new Date(finalizadaEn) : undefined
      },
      include: { responsable: true, creadaPor: true, comentarios: { include: { autor: true } } }
    });
    
    console.log('Tarea actualizada exitosamente. Nueva fecha:', tarea.fechaVencimiento);
    res.json(tarea);
  } catch (err) {
    console.error('Error al actualizar tarea:', err);
    res.status(500).json({ error: "Error al actualizar tarea", details: err });
  }
};

export const deleteTarea = async (req: Request, res: Response) => {
  try {
    await prisma.tarea.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: "Tarea eliminada" });
  } catch (err) {

    res.status(500).json({ error: "Error al eliminar tarea" });
  }
};

export const addComentario = async (req: Request, res: Response) => {
  try {
    const { contenido, autorId } = req.body;
    const tareaId = Number(req.params.id);
    const comentario = await prisma.comentario.create({
      data: {
        contenido,
        tareaId,
        autorId
      }
    });
    res.status(201).json(comentario);
  } catch (err) {
    console.error('Error al agregar comentario:', err);
    res.status(500).json({ error: "Error al agregar comentario" });
  }
};

// Función para completar tarea y calcular próxima fecha automáticamente
export const completarTarea = async (req: Request, res: Response) => {
  try {
    const tareaId = Number(req.params.id);
    const { observacion } = req.body;
    
    // Obtener la tarea actual
    const tareaActual = await prisma.tarea.findUnique({
      where: { id: tareaId },
      include: { responsable: true, creadaPor: true }
    });
    
    if (!tareaActual) {
      return res.status(404).json({ error: "Tarea no encontrada" });
    }
    
    let nuevaFechaVencimiento = null;
    
    // Si es repetitiva, calcular próxima fecha
    if (tareaActual.periodo && tareaActual.periodo !== '') {
      nuevaFechaVencimiento = calcularProximaFecha(tareaActual.periodo, tareaActual.diaDelMes || undefined);
      console.log('Calculando próxima fecha para tarea completada:', nuevaFechaVencimiento);
    }
    
    // Actualizar la tarea actual como completada
    const tareaActualizada = await prisma.tarea.update({
      where: { id: tareaId },
      data: {
        estado: 'hecha',
        finalizadaEn: new Date(),
        // notas: observacion || tareaActual.notas, // Campo eliminado del modelo
        fechaVencimiento: tareaActual.fechaVencimiento // Mantener la fecha original
      },
      include: { responsable: true, creadaPor: true, comentarios: { include: { autor: true } } }
    });
    
    // Si era repetitiva, crear nueva instancia para el próximo período
    if (nuevaFechaVencimiento && tareaActual.periodo) {
      await prisma.tarea.create({
        data: {
          titulo: tareaActual.titulo,
          descripcion: tareaActual.descripcion,
          responsableId: tareaActual.responsableId,
          estado: 'pendiente',
          prioridad: tareaActual.prioridad,
          tipo: tareaActual.tipo,
          periodo: tareaActual.periodo,
          repeticion: tareaActual.repeticion,
          intervalo: tareaActual.intervalo,
          diaDelMes: tareaActual.diaDelMes,
          fechaVencimiento: nuevaFechaVencimiento,
          creadaPorId: tareaActual.creadaPorId
        }
      });
      
      console.log('Creada nueva instancia de tarea repetitiva para:', nuevaFechaVencimiento);
    }
    
    res.json(tareaActualizada);
  } catch (err) {
    console.error('Error al completar tarea:', err);
    res.status(500).json({ error: "Error al completar tarea", details: err });
  }
}; 