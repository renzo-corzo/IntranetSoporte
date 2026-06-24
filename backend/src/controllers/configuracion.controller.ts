import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { encrypt } from '../utils/crypto';
import { zabbixLogin } from '../services/zabbixService';

// Nunca exponer los campos cifrados de Zabbix; reemplazarlos por un booleano.
const serializarConfiguracion = (config: any) => {
  const { zabbixPasswordCifrada, zabbixIv, zabbixAuthTag, ...resto } = config;
  return {
    ...resto,
    zabbixConfigurado: Boolean(zabbixPasswordCifrada && zabbixIv && zabbixAuthTag)
  };
};

// Construye el `data` de Zabbix a partir del body. Si no viene zabbixPassword,
// no se toca el password ya guardado (mismo patrón que actualizarCredencial:
// vacío = no cambiar).
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

export const obtenerConfiguracion = async (req: Request, res: Response) => {
  try {
    const config = await prisma.configuracionSistema.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1 }
    });
    res.json(serializarConfiguracion(config));
  } catch (error) {
    console.error('Error al obtener configuración del sistema:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const actualizarConfiguracion = async (req: Request, res: Response) => {
  try {
    const { rrhhHabilitado } = req.body;

    const config = await prisma.configuracionSistema.upsert({
      where: { id: 1 },
      update: { rrhhHabilitado, ...construirDataZabbix(req.body) },
      create: { id: 1, rrhhHabilitado: rrhhHabilitado ?? true, ...construirDataZabbix(req.body) }
    });

    res.json(serializarConfiguracion(config));
  } catch (error) {
    console.error('Error al actualizar configuración del sistema:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Prueba una config de Zabbix (no necesariamente guardada todavía) antes de
// que el admin la confirme en Configuración.
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
