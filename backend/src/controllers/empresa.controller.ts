import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { MODULOS_VALIDOS } from '../middlewares/empresa.middleware';
import { encrypt } from '../utils/crypto';
import { zabbixLogin } from '../services/zabbixService';

const sanitizeModulos = (modulos: unknown): string[] | undefined => {
  if (modulos === undefined) return undefined;
  if (!Array.isArray(modulos)) return [];
  return modulos.filter((m): m is string => MODULOS_VALIDOS.includes(m));
};

// Nunca exponer los campos cifrados de Zabbix; reemplazarlos por un booleano.
const serializarEmpresa = (empresa: any) => {
  const { zabbixPasswordCifrada, zabbixIv, zabbixAuthTag, ...resto } = empresa;
  return {
    ...resto,
    zabbixConfigurado: Boolean(zabbixPasswordCifrada && zabbixIv && zabbixAuthTag)
  };
};

// Construye el `data` de Zabbix para create/update a partir del body.
// Si no viene zabbixPassword, no se toca el password ya guardado (mismo
// patrón que actualizarCredencial: vacío = no cambiar).
const construirDataZabbix = (body: any) => {
  const { zabbixUrl, zabbixUsuario, zabbixPassword } = body;
  const data: any = {};

  if (zabbixUrl !== undefined) data.zabbixUrl = zabbixUrl || null;
  if (zabbixUsuario !== undefined) data.zabbixUsuario = zabbixUsuario || null;

  if (zabbixPassword) {
    const { ciphertext, iv, authTag } = encrypt(zabbixPassword);
    data.zabbixPasswordCifrada = ciphertext;
    data.zabbixIv = iv;
    data.zabbixAuthTag = authTag;
  }

  return data;
};

export const obtenerEmpresas = async (req: Request, res: Response) => {
  try {
    const { incluirInactivas } = req.query;
    const where = incluirInactivas === 'true' ? {} : { activo: true };

    const empresas = await prisma.empresa.findMany({
      where,
      orderBy: { nombre: 'asc' }
    });

    res.json(empresas.map(serializarEmpresa));
  } catch (error) {
    console.error('Error al obtener empresas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const crearEmpresa = async (req: Request, res: Response) => {
  try {
    const { nombre, descripcion, modulosHabilitados } = req.body;

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ error: 'El nombre es obligatorio' });
    }

    const empresa = await prisma.empresa.create({
      data: {
        nombre: nombre.trim(),
        descripcion,
        ...(sanitizeModulos(modulosHabilitados) !== undefined && { modulosHabilitados: sanitizeModulos(modulosHabilitados) }),
        ...construirDataZabbix(req.body)
      }
    });

    res.status(201).json(serializarEmpresa(empresa));
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return res.status(409).json({ error: 'Ya existe un cliente con ese nombre' });
    }
    console.error('Error al crear empresa:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const actualizarEmpresa = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, activo, modulosHabilitados } = req.body;

    const empresa = await prisma.empresa.update({
      where: { id },
      data: {
        nombre: nombre?.trim(),
        descripcion,
        activo,
        ...(sanitizeModulos(modulosHabilitados) !== undefined && { modulosHabilitados: sanitizeModulos(modulosHabilitados) }),
        ...construirDataZabbix(req.body)
      }
    });

    res.json(serializarEmpresa(empresa));
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    if (error?.code === 'P2002') {
      return res.status(409).json({ error: 'Ya existe un cliente con ese nombre' });
    }
    console.error('Error al actualizar empresa:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Prueba una config de Zabbix (no necesariamente guardada todavía) antes de
// que el admin la confirme en el form de Empresas.
export const probarConexionZabbix = async (req: Request, res: Response) => {
  try {
    const { url, usuario, password } = req.body;

    if (!url || !usuario || !password) {
      return res.status(400).json({ error: 'url, usuario y password son obligatorios' });
    }

    await zabbixLogin({ url, usuario, password });
    res.json({ success: true });
  } catch (error: any) {
    const detalle = error?.response?.data?.error?.data || error?.message || 'Error desconocido';
    res.status(400).json({ error: `No se pudo conectar a Zabbix: ${detalle}` });
  }
};
