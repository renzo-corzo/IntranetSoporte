import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { encrypt, decrypt } from "../utils/crypto";
import { TipoEquipoCredencial } from "@prisma/client";

// Mapea el discriminador de tipo al nombre del campo FK correspondiente
const FK_FIELD: Record<TipoEquipoCredencial, string> = {
  SERVIDOR_FISICO: "servidorFisicoId",
  MAQUINA_VIRTUAL: "maquinaVirtualId",
  EQUIPO_RED: "equipoRedId",
  EQUIPO_USUARIO: "equipoUsuarioId",
  SERVICIO: "servicioId",
};

const SELECT_SEGURO = {
  id: true,
  nombre: true,
  usuario: true,
  notas: true,
  tipoEquipo: true,
  creadoEn: true,
  actualizadoEn: true,
  creadoPor: { select: { id: true, nombre: true } },
};

// Listar credenciales (metadata segura, nunca passwordCifrada/iv/authTag)
export const obtenerCredenciales = async (req: Request, res: Response) => {
  try {
    const { tipoEquipo, equipoId } = req.query;
    const empresaId = (req as any).empresaId;

    if (!tipoEquipo || !equipoId) {
      return res.status(400).json({ error: "tipoEquipo y equipoId son obligatorios" });
    }

    const fkField = FK_FIELD[tipoEquipo as TipoEquipoCredencial];
    if (!fkField) {
      return res.status(400).json({ error: "tipoEquipo inválido" });
    }

    const credenciales = await prisma.credencial.findMany({
      where: { empresaId, tipoEquipo: tipoEquipo as TipoEquipoCredencial, [fkField]: equipoId as string },
      select: SELECT_SEGURO,
      orderBy: { creadoEn: "desc" },
    });

    res.json(credenciales);
  } catch (error) {
    console.error("Error al obtener credenciales:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Crear credencial (cifra el password antes de guardar)
export const crearCredencial = async (req: Request, res: Response) => {
  try {
    const { nombre, usuario, password, notas, tipoEquipo, equipoId } = req.body;
    const creadoPorId = (req as any).user.id;
    const empresaId = (req as any).empresaId;

    if (!nombre || !password || !tipoEquipo || !equipoId) {
      return res.status(400).json({ error: "nombre, password, tipoEquipo y equipoId son obligatorios" });
    }

    const fkField = FK_FIELD[tipoEquipo as TipoEquipoCredencial];
    if (!fkField) {
      return res.status(400).json({ error: "tipoEquipo inválido" });
    }

    const { ciphertext, iv, authTag } = encrypt(password);

    const credencial = await prisma.credencial.create({
      data: {
        empresaId,
        nombre,
        usuario: usuario || null,
        passwordCifrada: ciphertext,
        iv,
        authTag,
        notas: notas || null,
        tipoEquipo,
        creadoPorId,
        [fkField]: equipoId,
      },
      select: SELECT_SEGURO,
    });

    res.status(201).json(credencial);
  } catch (error) {
    console.error("Error al crear credencial:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Actualizar credencial (re-cifra solo si viene un password nuevo)
export const actualizarCredencial = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nombre, usuario, password, notas } = req.body;
    const empresaId = (req as any).empresaId;

    const existente = await prisma.credencial.findUnique({ where: { id } });
    if (!existente || existente.empresaId !== empresaId) {
      return res.status(404).json({ error: "Credencial no encontrada" });
    }

    const data: any = {
      nombre,
      usuario: usuario || null,
      notas: notas || null,
    };

    if (password) {
      const { ciphertext, iv, authTag } = encrypt(password);
      data.passwordCifrada = ciphertext;
      data.iv = iv;
      data.authTag = authTag;
    }

    const credencial = await prisma.credencial.update({
      where: { id },
      data,
      select: SELECT_SEGURO,
    });

    res.json(credencial);
  } catch (error) {
    console.error("Error al actualizar credencial:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Eliminar credencial
export const eliminarCredencial = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const empresaId = (req as any).empresaId;

    const existente = await prisma.credencial.findUnique({ where: { id } });
    if (!existente || existente.empresaId !== empresaId) {
      return res.status(404).json({ error: "Credencial no encontrada" });
    }

    await prisma.credencial.delete({ where: { id } });

    res.json({ message: "Credencial eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar credencial:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Revelar password en texto plano (única función que descifra) + registra el acceso
export const revelarCredencial = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const usuarioId = (req as any).user.id;
    const empresaId = (req as any).empresaId;

    const credencial = await prisma.credencial.findUnique({ where: { id } });
    if (!credencial || credencial.empresaId !== empresaId) {
      return res.status(404).json({ error: "Credencial no encontrada" });
    }

    const password = decrypt(credencial.passwordCifrada, credencial.iv, credencial.authTag);

    await prisma.credencialAcceso.create({
      data: { credencialId: credencial.id, usuarioId },
    });

    res.json({ password });
  } catch (error) {
    console.error("Error al revelar credencial:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};
