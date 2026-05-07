import { Request, Response } from "express";
import prisma from '../lib/prisma';

// Categorías
export const getCategorias = async (req: Request, res: Response) => {
  try {
    const categorias = await prisma.categoria.findMany({
      include: { subcategorias: true },
      where: { padreId: null },
      orderBy: { nombre: 'asc' }
    });
    res.json(categorias);
  } catch (err: any) {
    res.status(500).json({ error: "Error al obtener categorías", details: err.message });
  }
};

export const getCategoriaById = async (req: Request, res: Response) => {
  try {
    const categoria = await prisma.categoria.findUnique({
      where: { id: Number(req.params.id) },
      include: { subcategorias: true, articulos: true }
    });
    if (!categoria) return res.status(404).json({ error: "Categoría no encontrada" });
    res.json(categoria);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener categoría" });
  }
};

export const createCategoria = async (req: Request, res: Response) => {
  try {
    const { nombre, descripcion, icono, categoriaPadreId } = req.body;
    if (!nombre) return res.status(400).json({ error: "El nombre es obligatorio" });
    const categoria = await prisma.categoria.create({
      data: { nombre, descripcion, icono, padreId: categoriaPadreId || null }
    });
    res.status(201).json(categoria);
  } catch (err) {
    res.status(500).json({ error: "Error al crear categoría" });
  }
};

export const updateCategoria = async (req: Request, res: Response) => {
  try {
    const { nombre, descripcion, icono, categoriaPadreId } = req.body;
    const categoria = await prisma.categoria.update({
      where: { id: Number(req.params.id) },
      data: { nombre, descripcion, icono, padreId: categoriaPadreId || null }
    });
    res.json(categoria);
  } catch (err) {
    res.status(500).json({ error: "Error al actualizar categoría" });
  }
};

export const deleteCategoria = async (req: Request, res: Response) => {
  try {
    const categoriaId = Number(req.params.id);
    const articulosCount = await prisma.articulo.count({ where: { categoriaId } });
    if (articulosCount > 0) {
      return res.status(400).json({
        error: `No se puede eliminar la categoría porque tiene ${articulosCount} artículo(s) asociado(s).`,
        count: articulosCount
      });
    }
    const subcategorias = await prisma.categoria.findMany({
      where: { padreId: categoriaId },
      select: { id: true, nombre: true }
    });
    if (subcategorias.length > 0) {
      return res.status(400).json({
        error: `No se puede eliminar la categoría porque tiene ${subcategorias.length} subcategoría(s).`,
        subcategorias
      });
    }
    await prisma.categoria.delete({ where: { id: categoriaId } });
    res.json({ message: "Categoría eliminada exitosamente" });
  } catch (err: any) {
    res.status(500).json({ error: `Error al eliminar categoría: ${err.message}` });
  }
};

// Artículos (Procedimientos)
export const getArticulos = async (req: Request, res: Response) => {
  try {
    const { categoriaId } = req.query;
    const whereClause = categoriaId ? { categoriaId: Number(categoriaId) } : {};
    const articulos = await prisma.articulo.findMany({
      where: whereClause,
      include: { categoria: true, creadoPor: true },
      orderBy: [{ codigo: 'asc' }, { creadoEn: 'desc' }]
    });
    res.json(articulos);
  } catch (err: any) {
    res.status(500).json({ error: "Error al obtener artículos", details: err.message });
  }
};

export const getArticuloById = async (req: Request, res: Response) => {
  try {
    const articulo = await prisma.articulo.findUnique({
      where: { id: Number(req.params.id) },
      include: { categoria: true, creadoPor: true }
    });
    if (!articulo) return res.status(404).json({ error: "Artículo no encontrado" });
    res.json(articulo);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener artículo" });
  }
};

export const getNextCodigo = async (req: Request, res: Response) => {
  try {
    const area = (req.query.area as string) || 'GEN';
    const prefix = `PRO-${area.toUpperCase().substring(0, 3)}-`;
    const articulos = await prisma.articulo.findMany({
      where: { codigo: { startsWith: prefix } },
      select: { codigo: true }
    });
    let maxNum = 0;
    for (const a of articulos) {
      const match = (a.codigo ?? '').match(/-(\d+)$/);
      if (match?.[1]) maxNum = Math.max(maxNum, parseInt(match[1]));
    }
    const next = `${prefix}${String(maxNum + 1).padStart(3, '0')}`;
    res.json({ codigo: next });
  } catch (err: any) {
    res.status(500).json({ error: "Error al generar código" });
  }
};

export const createArticulo = async (req: Request, res: Response) => {
  try {
    const { titulo, contenido, categoriaId, adjuntos, codigo, version, area, responsable, estado, fechaRevision } = req.body;
    const creadoPorId = (req as any).user.id;
    if (!titulo || !categoriaId) {
      return res.status(400).json({ error: "Faltan campos obligatorios: titulo y categoriaId" });
    }
    const articulo = await prisma.articulo.create({
      data: {
        titulo,
        contenido,
        categoriaId: Number(categoriaId),
        adjuntos: adjuntos || [],
        creadoPorId,
        codigo: codigo || null,
        version: version || '1.0',
        area: area || null,
        responsable: responsable || null,
        estado: estado || 'Borrador',
        fechaRevision: fechaRevision ? new Date(fechaRevision) : null
      }
    });
    res.status(201).json(articulo);
  } catch (err: any) {
    console.error("Error al crear artículo:", err);
    res.status(500).json({ error: `Error al crear artículo: ${err.message}` });
  }
};

export const updateArticulo = async (req: Request, res: Response) => {
  try {
    const { titulo, contenido, categoriaId, adjuntos, codigo, version, area, responsable, estado, fechaRevision } = req.body;
    const articulo = await prisma.articulo.update({
      where: { id: Number(req.params.id) },
      data: {
        titulo,
        contenido,
        categoriaId,
        adjuntos,
        codigo: codigo !== undefined ? codigo : undefined,
        version: version !== undefined ? version : undefined,
        area: area !== undefined ? area : undefined,
        responsable: responsable !== undefined ? responsable : undefined,
        estado: estado !== undefined ? estado : undefined,
        fechaRevision: fechaRevision !== undefined ? (fechaRevision ? new Date(fechaRevision) : null) : undefined
      }
    });
    res.json(articulo);
  } catch (err: any) {
    res.status(500).json({ error: "Error al actualizar artículo" });
  }
};

export const deleteArticulo = async (req: Request, res: Response) => {
  try {
    await prisma.articulo.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: "Artículo eliminado" });
  } catch (err) {
    res.status(500).json({ error: "Error al eliminar artículo" });
  }
};

export const cleanAndDeleteCategoria = async (req: Request, res: Response) => {
  try {
    const categoriaId = Number(req.params.id);
    const categoria = await prisma.categoria.findUnique({
      where: { id: categoriaId },
      include: { subcategorias: true, articulos: true }
    });
    if (!categoria) return res.status(404).json({ error: "Categoría no encontrada" });
    for (const sub of categoria.subcategorias) {
      await prisma.articulo.deleteMany({ where: { categoriaId: sub.id } });
      await prisma.categoria.delete({ where: { id: sub.id } });
    }
    await prisma.articulo.deleteMany({ where: { categoriaId } });
    await prisma.categoria.delete({ where: { id: categoriaId } });
    res.json({
      message: "Categoría eliminada exitosamente",
      deletedSubcategories: categoria.subcategorias.length,
      deletedArticles: categoria.articulos.length
    });
  } catch (err: any) {
    res.status(500).json({ error: `Error al eliminar categoría: ${err.message}` });
  }
};

export const deleteCategoriaWithArticles = async (req: Request, res: Response) => {
  try {
    const categoriaId = Number(req.params.id);
    const deletedArticles = await prisma.articulo.deleteMany({ where: { categoriaId } });
    const subcategorias = await prisma.categoria.findMany({ where: { padreId: categoriaId } });
    for (const sub of subcategorias) {
      await prisma.articulo.deleteMany({ where: { categoriaId: sub.id } });
      await prisma.categoria.delete({ where: { id: sub.id } });
    }
    await prisma.categoria.delete({ where: { id: categoriaId } });
    res.json({
      message: "Categoría eliminada exitosamente",
      deletedArticles: deletedArticles.count,
      deletedSubcategories: subcategorias.length
    });
  } catch (err: any) {
    res.status(500).json({ error: `Error al eliminar categoría: ${err.message}` });
  }
};
