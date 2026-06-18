import { Request, Response } from "express";
import { PrismaClient, Prisma } from "@prisma/client";
import { isSameDay, isSameMonth, isSameWeek, isSameYear, startOfDay } from "date-fns";
import prisma from '../lib/prisma';


const includeTarea = {
  responsable: true,
  creadaPor: true,
  comentarios: { include: { autor: true }, orderBy: { creadoEn: "desc" as const } }
};

const ESTADOS_VALIDOS = ["pendiente", "en_curso", "bloqueada", "en_espera", "resuelta", "cancelada"] as const;
const PRIORIDADES_VALIDAS = ["baja", "media", "alta", "critica"] as const;
const ORIGENES_VALIDOS = ["interno", "usuario", "proveedor", "monitoreo", "auditoria", "proyecto"] as const;
const IMPACTOS_VALIDOS = ["individual", "area", "institucional", "critico"] as const;

const normalizeEstadoRead = (estado?: string | null) => {
  if (estado === "hecha") return "resuelta";
  if (estado === "en_progreso") return "en_curso";
  return estado;
};
const normalizeEstadoWrite = (estado?: string | null) => {
  if (!estado) return "pendiente";
  if (estado === "hecha") return "resuelta";
  if (estado === "en_progreso") return "en_curso";
  return estado;
};

const isEstadoTerminal = (estado?: string | null) => ["resuelta", "cancelada", "hecha"].includes((estado || "").toLowerCase());

const parseBoolean = (value: unknown) =>
  value === true || value === "true" || value === "1";

const asArray = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === "string" && value.trim()) return value.split(",").map(v => v.trim()).filter(Boolean);
  return [];
};

const serializeTarea = <T extends { estado?: string | null; fechaCierre?: Date | null; finalizadaEn?: Date | null }>(tarea: T) => ({
  ...tarea,
  estado: normalizeEstadoRead(tarea.estado),
  fechaCierre: tarea.fechaCierre || tarea.finalizadaEn || null
});

const calcularProximaFecha = (periodo: string, diaDelMes?: string, fechaActual?: Date) => {
  const hoy = fechaActual || new Date();
  const proximaFecha = new Date(hoy);
  switch (periodo) {
    case "Diario":
      proximaFecha.setDate(hoy.getDate() + 1);
      break;
    case "Semanal":
      proximaFecha.setDate(hoy.getDate() + 7);
      break;
    case "Mensual":
      if (diaDelMes && diaDelMes !== "ultimo") {
        const dia = parseInt(diaDelMes, 10);
        proximaFecha.setMonth(hoy.getMonth() + 1);
        proximaFecha.setDate(dia);
        if (proximaFecha <= hoy) proximaFecha.setMonth(proximaFecha.getMonth() + 1);
      } else if (diaDelMes === "ultimo") {
        proximaFecha.setMonth(hoy.getMonth() + 2, 0);
      } else {
        proximaFecha.setMonth(hoy.getMonth() + 1);
      }
      break;
    case "Anual":
      proximaFecha.setFullYear(hoy.getFullYear() + 1);
      break;
    default:
      return null;
  }
  return proximaFecha;
};

const crearInstanciasRecurrentesSiCorresponde = async (empresaId: string) => {
  const tareas = await prisma.tarea.findMany({ where: { empresaId } });
  const now = new Date();
  for (const tarea of tareas) {
    if (!tarea.repeticion || tarea.repeticion === "No se repite" || !tarea.periodo || tarea.estado === "eliminada") continue;
    let debeCrear = false;
    if (tarea.periodo === "Diario") debeCrear = !isSameDay(new Date(tarea.creadaEn), now);
    else if (tarea.periodo === "Semanal") debeCrear = !isSameWeek(new Date(tarea.creadaEn), now, { weekStartsOn: 1 });
    else if (tarea.periodo === "Mensual") debeCrear = !isSameMonth(new Date(tarea.creadaEn), now);
    else if (tarea.periodo === "Anual") debeCrear = !isSameYear(new Date(tarea.creadaEn), now);
    if (!debeCrear) continue;
    await prisma.tarea.create({
      data: {
        empresaId,
        titulo: tarea.titulo,
        descripcion: tarea.descripcion,
        responsableId: tarea.responsableId,
        estado: "pendiente",
        prioridad: tarea.prioridad,
        categoria: tarea.categoria,
        origen: tarea.origen,
        impacto: tarea.impacto,
        tipo: tarea.tipo,
        periodo: tarea.periodo,
        repeticion: tarea.repeticion,
        intervalo: tarea.intervalo,
        diaDelMes: tarea.diaDelMes,
        solicitante: tarea.solicitante,
        activoRelacionado: tarea.activoRelacionado,
        observaciones: tarea.observaciones,
        fechaVencimiento: tarea.fechaVencimiento,
        creadaPorId: tarea.creadaPorId,
        procedimientoId: tarea.procedimientoId,
        categoriaId: tarea.categoriaId
      }
    });
  }
};

const buildWhereFromQuery = (query: Request["query"]): Prisma.TareaWhereInput => {
  const where: Prisma.TareaWhereInput = {};
  const andClauses: Prisma.TareaWhereInput[] = [];
  const q = typeof query.q === "string" ? query.q.trim() : "";
  if (q) {
    where.OR = [
      { titulo: { contains: q, mode: "insensitive" } },
      { descripcion: { contains: q, mode: "insensitive" } },
      { observaciones: { contains: q, mode: "insensitive" } },
      { solicitante: { contains: q, mode: "insensitive" } },
      { activoRelacionado: { contains: q, mode: "insensitive" } }
    ];
  }

  const estados = asArray(query.estado).map(normalizeEstadoWrite);
  if (estados.length > 0) {
    const includeHechaAsResuelta = estados.includes("resuelta");
    where.estado = {
      in: includeHechaAsResuelta
        ? Array.from(new Set([...estados, "hecha"]))
        : estados
    };
  }

  const prioridades = asArray(query.prioridad);
  if (prioridades.length > 0) where.prioridad = { in: prioridades };
  const categorias = asArray(query.categoria);
  if (categorias.length > 0) where.categoria = { in: categorias };
  const origenes = asArray(query.origen);
  if (origenes.length > 0) where.origen = { in: origenes };
  const impactos = asArray(query.impacto);
  if (impactos.length > 0) where.impacto = { in: impactos };
  const periodos = asArray(query.periodo);
  if (periodos.length > 0) where.periodo = { in: periodos };

  if (query.responsableId) {
    where.responsableId = Number(query.responsableId);
  }
  if (parseBoolean(query.sinAsignar)) where.responsableId = null;
  if (parseBoolean(query.soloMias) && query.userId) where.responsableId = Number(query.userId);

  if (query.desde || query.hasta) {
    where.fechaVencimiento = {};
    if (query.desde) (where.fechaVencimiento as Prisma.DateTimeFilter).gte = new Date(String(query.desde));
    if (query.hasta) (where.fechaVencimiento as Prisma.DateTimeFilter).lte = new Date(String(query.hasta));
  }

  const abiertas = parseBoolean(query.abiertas);
  const vencidas = parseBoolean(query.vencidas);
  if (abiertas || vencidas) {
    const openStates = ["pendiente", "en_curso", "en_progreso", "bloqueada", "en_espera"];
    andClauses.push({ estado: { in: openStates } });
  }
  if (vencidas) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    andClauses.push({ fechaVencimiento: { lt: today } });
  }

  if (andClauses.length > 0) {
    where.AND = andClauses;
  }

  return where;
};

const mapEstadoData = (estadoInput: string | undefined, current?: { fechaCierre: Date | null; finalizadaEn: Date | null }) => {
  if (!estadoInput) return {};
  const estado = normalizeEstadoWrite(estadoInput);
  if (!ESTADOS_VALIDOS.includes(estado as typeof ESTADOS_VALIDOS[number])) return {};
  const isTerminal = isEstadoTerminal(estado);
  return {
    estado,
    fechaCierre: isTerminal ? new Date() : null,
    finalizadaEn: isTerminal ? new Date() : null
  };
};

export const getTareas = async (req: Request, res: Response) => {
  try {
    const empresaId = (req as any).empresaId;
    await crearInstanciasRecurrentesSiCorresponde(empresaId);
    const where = buildWhereFromQuery({
      ...req.query,
      userId: (req as any).user?.id
    });
    where.empresaId = empresaId;
    const tareas = await prisma.tarea.findMany({
      where,
      include: includeTarea,
      orderBy: { creadaEn: "desc" }
    });
    res.json(tareas.map(serializeTarea));
  } catch (err) {
    console.error("Error al obtener tareas:", err);
    res.status(500).json({ error: "Error al obtener tareas" });
  }
};

export const getTareaById = async (req: Request, res: Response) => {
  try {
    const empresaId = (req as any).empresaId;
    const tarea = await prisma.tarea.findUnique({
      where: { id: Number(req.params.id) },
      include: includeTarea
    });
    if (!tarea || tarea.empresaId !== empresaId) return res.status(404).json({ error: "Tarea no encontrada" });
    res.json(serializeTarea(tarea));
  } catch (err) {
    console.error("Error al obtener tarea:", err);
    res.status(500).json({ error: "Error al obtener tarea" });
  }
};

export const createTarea = async (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    const userId = (req as any).user?.id;
    const empresaId = (req as any).empresaId;
    const estadoNormalizado = normalizeEstadoWrite(body.estado || "pendiente");
    const prioridad = body.prioridad || "media";
    const origen = body.origen || "interno";
    const impacto = body.impacto || "individual";

    if (!ESTADOS_VALIDOS.includes(estadoNormalizado as typeof ESTADOS_VALIDOS[number])) {
      return res.status(400).json({ error: "Estado inválido" });
    }
    if (!PRIORIDADES_VALIDAS.includes(prioridad)) return res.status(400).json({ error: "Prioridad inválida" });
    if (!ORIGENES_VALIDOS.includes(origen)) return res.status(400).json({ error: "Origen inválido" });
    if (!IMPACTOS_VALIDOS.includes(impacto)) return res.status(400).json({ error: "Impacto inválido" });

    let fechaVencimiento = body.fechaVencimiento ? new Date(body.fechaVencimiento) : null;
    if (!fechaVencimiento && body.periodo && body.periodo !== "" && body.diaDelMes) {
      fechaVencimiento = calcularProximaFecha(body.periodo, body.diaDelMes);
    }
    const isTerminal = isEstadoTerminal(estadoNormalizado);
    const tarea = await prisma.tarea.create({
      data: {
        empresaId,
        titulo: body.titulo,
        descripcion: body.descripcion,
        responsableId: body.responsableId ? Number(body.responsableId) : null,
        estado: estadoNormalizado,
        prioridad,
        categoria: body.categoria || "infraestructura",
        origen,
        impacto,
        tipo: body.tipo || "rutinaria",
        periodo: body.periodo || "",
        repeticion: body.repeticion || "No se repite",
        intervalo: body.intervalo ? Number(body.intervalo) : null,
        diaDelMes: body.diaDelMes || null,
        fechaVencimiento,
        fechaCierre: isTerminal ? new Date() : null,
        finalizadaEn: isTerminal ? new Date() : null,
        solicitante: body.solicitante || null,
        activoRelacionado: body.activoRelacionado || null,
        observaciones: body.observaciones || null,
        creadaPorId: userId || body.creadaPorId,
        procedimientoId: body.procedimientoId || null,
        categoriaId: body.categoriaId || null
      },
      include: includeTarea
    });
    res.status(201).json(serializeTarea(tarea));
  } catch (err) {
    console.error("Error al crear tarea:", err);
    res.status(500).json({ error: "Error al crear tarea" });
  }
};

export const updateTarea = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const empresaId = (req as any).empresaId;
    const body = req.body || {};
    const actual = await prisma.tarea.findUnique({ where: { id } });
    if (!actual || actual.empresaId !== empresaId) return res.status(404).json({ error: "Tarea no encontrada" });

    const estadoInput = body.estado ? normalizeEstadoWrite(body.estado) : undefined;
    if (estadoInput && !ESTADOS_VALIDOS.includes(estadoInput as typeof ESTADOS_VALIDOS[number])) {
      return res.status(400).json({ error: "Estado inválido" });
    }
    if (body.prioridad && !PRIORIDADES_VALIDAS.includes(body.prioridad)) {
      return res.status(400).json({ error: "Prioridad inválida" });
    }
    if (body.origen && !ORIGENES_VALIDOS.includes(body.origen)) return res.status(400).json({ error: "Origen inválido" });
    if (body.impacto && !IMPACTOS_VALIDOS.includes(body.impacto)) return res.status(400).json({ error: "Impacto inválido" });

    const estadoData = mapEstadoData(estadoInput, actual);
    const tarea = await prisma.tarea.update({
      where: { id },
      data: {
        titulo: body.titulo ?? undefined,
        descripcion: body.descripcion ?? undefined,
        responsableId: body.responsableId === undefined ? undefined : (body.responsableId ? Number(body.responsableId) : null),
        prioridad: body.prioridad ?? undefined,
        categoria: body.categoria ?? undefined,
        origen: body.origen ?? undefined,
        impacto: body.impacto ?? undefined,
        tipo: body.tipo ?? undefined,
        periodo: body.periodo ?? undefined,
        repeticion: body.repeticion ?? undefined,
        intervalo: body.intervalo === undefined ? undefined : (body.intervalo === null || body.intervalo === "" ? null : Number(body.intervalo)),
        diaDelMes: body.diaDelMes ?? undefined,
        fechaVencimiento: body.fechaVencimiento === undefined ? undefined : (body.fechaVencimiento ? new Date(body.fechaVencimiento) : null),
        solicitante: body.solicitante ?? undefined,
        activoRelacionado: body.activoRelacionado ?? undefined,
        observaciones: body.observaciones ?? undefined,
        procedimientoId: body.procedimientoId ?? undefined,
        categoriaId: body.categoriaId ?? undefined,
        ...estadoData
      },
      include: includeTarea
    });
    res.json(serializeTarea(tarea));
  } catch (err) {
    console.error("Error al actualizar tarea:", err);
    res.status(500).json({ error: "Error al actualizar tarea" });
  }
};

export const changeEstadoTarea = async (req: Request, res: Response) => {
  req.body = { ...req.body, estado: req.body?.estado };
  return updateTarea(req, res);
};

export const asignarResponsableTarea = async (req: Request, res: Response) => {
  req.body = { ...req.body, responsableId: req.body?.responsableId ?? null };
  return updateTarea(req, res);
};

export const cerrarTarea = async (req: Request, res: Response) => {
  req.body = { ...req.body, estado: "resuelta" };
  return updateTarea(req, res);
};

export const reabrirTarea = async (req: Request, res: Response) => {
  const estadoDestino = req.body?.estadoDestino === "en_curso" ? "en_curso" : "pendiente";
  req.body = { ...req.body, estado: estadoDestino };
  return updateTarea(req, res);
};

export const getTareasKpis = async (req: Request, res: Response) => {
  try {
    const where = buildWhereFromQuery({
      ...req.query,
      userId: (req as any).user?.id
    });
    where.empresaId = (req as any).empresaId;
    const tareas = await prisma.tarea.findMany({ where, select: { estado: true, prioridad: true, fechaVencimiento: true, fechaCierre: true, finalizadaEn: true } });
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const abiertas = tareas.filter(t => !isEstadoTerminal(t.estado)).length;
    const enCurso = tareas.filter(t => normalizeEstadoRead(t.estado) === "en_curso").length;
    const bloqueadas = tareas.filter(t => normalizeEstadoRead(t.estado) === "bloqueada").length;
    const criticasAbiertas = tareas.filter(t => !isEstadoTerminal(t.estado) && (t.prioridad || "").toLowerCase() === "critica").length;
    const vencidasAbiertas = tareas.filter(t => !isEstadoTerminal(t.estado) && !!t.fechaVencimiento && t.fechaVencimiento < today).length;
    const resueltas7d = tareas.filter(t => normalizeEstadoRead(t.estado) === "resuelta" && ((t.fechaCierre || t.finalizadaEn) ? (t.fechaCierre || t.finalizadaEn)! >= sevenDaysAgo : false)).length;

    res.json({ abiertas, enCurso, bloqueadas, criticasAbiertas, vencidasAbiertas, resueltas7d });
  } catch (err) {
    console.error("Error al obtener KPIs de tareas:", err);
    res.status(500).json({ error: "Error al obtener KPIs de tareas" });
  }
};

export const getTareasTablero = async (req: Request, res: Response) => {
  try {
    const where = buildWhereFromQuery({
      ...req.query,
      userId: (req as any).user?.id
    });
    where.empresaId = (req as any).empresaId;
    const tareas = await prisma.tarea.findMany({
      where,
      include: includeTarea,
      orderBy: { creadaEn: "desc" }
    });
    const columns = ["pendiente", "en_curso", "bloqueada", "en_espera", "resuelta", "cancelada"] as const;
    const grouped = columns.reduce((acc, estado) => {
      acc[estado] = [];
      return acc;
    }, {} as Record<typeof columns[number], any[]>);

    for (const t of tareas) {
      const estado = normalizeEstadoRead(t.estado);
      if (grouped[estado as typeof columns[number]]) grouped[estado as typeof columns[number]].push(serializeTarea(t));
    }
    res.json(grouped);
  } catch (err) {
    console.error("Error al obtener tablero de tareas:", err);
    res.status(500).json({ error: "Error al obtener tablero de tareas" });
  }
};

export const getTareasAgenda = async (req: Request, res: Response) => {
  try {
    const where = buildWhereFromQuery({
      ...req.query,
      userId: (req as any).user?.id
    });
    where.empresaId = (req as any).empresaId;
    const from = req.query.from ? new Date(String(req.query.from)) : new Date();
    const to = req.query.to ? new Date(String(req.query.to)) : new Date(Date.now() + 1000 * 60 * 60 * 24 * 60);
    const andClauses: Prisma.TareaWhereInput[] = Array.isArray(where.AND) ? where.AND : [];
    andClauses.push({ fechaVencimiento: { gte: from, lte: to } });
    where.AND = andClauses;
    const tareas = await prisma.tarea.findMany({
      where,
      include: includeTarea,
      orderBy: { fechaVencimiento: "asc" }
    });
    res.json(tareas.map(serializeTarea));
  } catch (err) {
    console.error("Error al obtener agenda de tareas:", err);
    res.status(500).json({ error: "Error al obtener agenda de tareas" });
  }
};

export const getComentariosTarea = async (req: Request, res: Response) => {
  try {
    const tareaId = Number(req.params.id);
    const empresaId = (req as any).empresaId;
    const tarea = await prisma.tarea.findUnique({ where: { id: tareaId } });
    if (!tarea || tarea.empresaId !== empresaId) return res.status(404).json({ error: "Tarea no encontrada" });
    const comentarios = await prisma.comentario.findMany({
      where: { tareaId },
      include: { autor: true },
      orderBy: { creadoEn: "desc" }
    });
    res.json(comentarios);
  } catch (err) {
    console.error("Error al obtener comentarios:", err);
    res.status(500).json({ error: "Error al obtener comentarios" });
  }
};

export const deleteTarea = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const empresaId = (req as any).empresaId;
    const tarea = await prisma.tarea.findUnique({ where: { id } });
    if (!tarea || tarea.empresaId !== empresaId) return res.status(404).json({ error: "Tarea no encontrada" });
    await prisma.tarea.delete({ where: { id } });
    res.json({ message: "Tarea eliminada" });
  } catch (err) {
    console.error("Error al eliminar tarea:", err);
    res.status(500).json({ error: "Error al eliminar tarea" });
  }
};

export const addComentario = async (req: Request, res: Response) => {
  try {
    const { contenido } = req.body;
    const tareaId = Number(req.params.id);
    const empresaId = (req as any).empresaId;
    const autorId = Number((req as any).user?.id);
    if (!autorId) return res.status(401).json({ error: "No autenticado" });
    const tarea = await prisma.tarea.findUnique({ where: { id: tareaId } });
    if (!tarea || tarea.empresaId !== empresaId) return res.status(404).json({ error: "Tarea no encontrada" });
    const comentario = await prisma.comentario.create({
      data: { contenido, tareaId, autorId },
      include: { autor: true }
    });
    res.status(201).json(comentario);
  } catch (err) {
    console.error("Error al agregar comentario:", err);
    res.status(500).json({ error: "Error al agregar comentario" });
  }
};

export const completarTarea = async (req: Request, res: Response) => {
  try {
    const tareaId = Number(req.params.id);
    const empresaId = (req as any).empresaId;
    const { observacion } = req.body || {};
    const tareaActual = await prisma.tarea.findUnique({
      where: { id: tareaId },
      include: includeTarea
    });
    if (!tareaActual || tareaActual.empresaId !== empresaId) return res.status(404).json({ error: "Tarea no encontrada" });

    let nuevaFechaVencimiento: Date | null = null;
    if (tareaActual.periodo && tareaActual.periodo !== "") {
      nuevaFechaVencimiento = calcularProximaFecha(tareaActual.periodo, tareaActual.diaDelMes || undefined);
    }

    const tareaActualizada = await prisma.tarea.update({
      where: { id: tareaId },
      data: {
        estado: "resuelta",
        fechaCierre: new Date(),
        finalizadaEn: new Date(),
        observaciones: observacion || tareaActual.observaciones || null
      },
      include: includeTarea
    });

    if (nuevaFechaVencimiento && tareaActual.periodo) {
      await prisma.tarea.create({
        data: {
          empresaId,
          titulo: tareaActual.titulo,
          descripcion: tareaActual.descripcion,
          responsableId: tareaActual.responsableId,
          estado: "pendiente",
          prioridad: tareaActual.prioridad,
          categoria: tareaActual.categoria,
          origen: tareaActual.origen,
          impacto: tareaActual.impacto,
          tipo: tareaActual.tipo,
          periodo: tareaActual.periodo,
          repeticion: tareaActual.repeticion,
          intervalo: tareaActual.intervalo,
          diaDelMes: tareaActual.diaDelMes,
          fechaVencimiento: nuevaFechaVencimiento,
          solicitante: tareaActual.solicitante,
          activoRelacionado: tareaActual.activoRelacionado,
          observaciones: tareaActual.observaciones,
          creadaPorId: tareaActual.creadaPorId,
          procedimientoId: tareaActual.procedimientoId,
          categoriaId: tareaActual.categoriaId
        }
      });
    }
    res.json(serializeTarea(tareaActualizada));
  } catch (err) {
    console.error("Error al completar tarea:", err);
    res.status(500).json({ error: "Error al completar tarea" });
  }
};