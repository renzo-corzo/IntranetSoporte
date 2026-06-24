import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { MODULOS_VALIDOS } from '../middlewares/empresa.middleware';

const sanitizeModulos = (modulos: unknown): string[] | undefined => {
  if (modulos === undefined) return undefined;
  if (!Array.isArray(modulos)) return [];
  return modulos.filter((m): m is string => MODULOS_VALIDOS.includes(m));
};

export const obtenerEmpresas = async (req: Request, res: Response) => {
  try {
    const { incluirInactivas } = req.query;
    const where = incluirInactivas === 'true' ? {} : { activo: true };

    const empresas = await prisma.empresa.findMany({
      where,
      orderBy: { nombre: 'asc' }
    });

    res.json(empresas);
  } catch (error) {
    console.error('Error al obtener empresas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const crearEmpresa = async (req: Request, res: Response) => {
  try {
    const { nombre, descripcion, modulosHabilitados, zabbixGrupo } = req.body;

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ error: 'El nombre es obligatorio' });
    }

    const empresa = await prisma.empresa.create({
      data: {
        nombre: nombre.trim(),
        descripcion,
        zabbixGrupo: zabbixGrupo || null,
        ...(sanitizeModulos(modulosHabilitados) !== undefined && { modulosHabilitados: sanitizeModulos(modulosHabilitados) })
      }
    });

    res.status(201).json(empresa);
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
    const { nombre, descripcion, activo, modulosHabilitados, zabbixGrupo } = req.body;

    const empresa = await prisma.empresa.update({
      where: { id },
      data: {
        nombre: nombre?.trim(),
        descripcion,
        activo,
        ...(zabbixGrupo !== undefined && { zabbixGrupo: zabbixGrupo || null }),
        ...(sanitizeModulos(modulosHabilitados) !== undefined && { modulosHabilitados: sanitizeModulos(modulosHabilitados) })
      }
    });

    res.json(empresa);
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
