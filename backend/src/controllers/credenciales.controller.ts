import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { encrypt, decrypt } from "../utils/crypto";
import { TipoEquipoCredencial } from "@prisma/client";

// Mapea el discriminador de tipo al nombre del campo FK correspondiente.
// EMAIL, ACCESO_REMOTO y OTRO no tienen equipo asociado (quedan standalone).
const FK_FIELD: Partial<Record<TipoEquipoCredencial, string>> = {
  SERVIDOR_FISICO: "servidorFisicoId",
  MAQUINA_VIRTUAL: "maquinaVirtualId",
  EQUIPO_RED: "equipoRedId",
  EQUIPO_USUARIO: "equipoUsuarioId",
  SERVICIO: "servicioId",
};

const TIPOS_STANDALONE: TipoEquipoCredencial[] = ["EMAIL", "ACCESO_REMOTO", "OTRO"];

const SELECT_SEGURO = {
  id: true,
  nombre: true,
  usuario: true,
  url: true,
  notas: true,
  tipoEquipo: true,
  creadoEn: true,
  actualizadoEn: true,
  creadoPor: { select: { id: true, nombre: true } },
};

// Listar credenciales (metadata segura, nunca passwordCifrada/iv/authTag).
// Por equipo puntual del CMDB (tipoEquipo+equipoId), o la bóveda standalone
// de accesos sueltos (sin equipoId) cuando tipoEquipo se omite o es uno de
// los tipos sin equipo asociado.
export const obtenerCredenciales = async (req: Request, res: Response) => {
  try {
    const { tipoEquipo, equipoId, buscar } = req.query;
    const empresaId = (req as any).empresaId;

    const where: any = { empresaId };

    if (tipoEquipo && equipoId) {
      const fkField = FK_FIELD[tipoEquipo as TipoEquipoCredencial];
      if (!fkField) {
        return res.status(400).json({ error: "tipoEquipo inválido" });
      }
      where[fkField] = equipoId as string;
    } else if (tipoEquipo) {
      where.tipoEquipo = tipoEquipo as TipoEquipoCredencial;
    } else {
      where.tipoEquipo = { in: TIPOS_STANDALONE };
    }

    if (buscar) {
      where.OR = [
        { nombre: { contains: buscar as string, mode: "insensitive" } },
        { usuario: { contains: buscar as string, mode: "insensitive" } },
      ];
    }

    const credenciales = await prisma.credencial.findMany({
      where,
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
    const { nombre, usuario, password, url, notas, tipoEquipo, equipoId } = req.body;
    const creadoPorId = (req as any).user.id;
    const empresaId = (req as any).empresaId;

    if (!nombre || !password || !tipoEquipo) {
      return res.status(400).json({ error: "nombre, password y tipoEquipo son obligatorios" });
    }

    const fkField = FK_FIELD[tipoEquipo as TipoEquipoCredencial];
    if (fkField && !equipoId) {
      return res.status(400).json({ error: `Para el tipo ${tipoEquipo} se requiere equipoId` });
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
        url: url || null,
        notas: notas || null,
        tipoEquipo,
        creadoPorId,
        ...(fkField ? { [fkField]: equipoId } : {}),
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
    const { nombre, usuario, password, url, notas } = req.body;
    const empresaId = (req as any).empresaId;

    const existente = await prisma.credencial.findUnique({ where: { id } });
    if (!existente || existente.empresaId !== empresaId) {
      return res.status(404).json({ error: "Credencial no encontrada" });
    }

    const data: any = {
      nombre,
      usuario: usuario || null,
      url: url || null,
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
