import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Categorías
export const getCategorias = async (req: Request, res: Response) => {
  try {
    const categorias = await prisma.categoria.findMany({
      include: { subcategorias: true },
      where: { padreId: null },
      orderBy: { nombre: 'asc' }
    });
    res.json(categorias);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener categorías" });
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
      data: { 
        nombre, 
        descripcion, 
        icono, 
        padreId: categoriaPadreId || null 
      } 
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
      data: { 
        nombre, 
        descripcion, 
        icono, 
        padreId: categoriaPadreId || null 
      } 
    });
    res.json(categoria);
  } catch (err) {
    res.status(500).json({ error: "Error al actualizar categoría" });
  }
};

export const deleteCategoria = async (req: Request, res: Response) => {
  try {
    const categoriaId = Number(req.params.id);
    
    // Verificar si la categoría tiene artículos asociados
    const articulosCount = await prisma.articulo.count({
      where: { categoriaId }
    });
    
    if (articulosCount > 0) {
      // Opción: Eliminar también los artículos (descomenta si quieres esta funcionalidad)
      // await prisma.articulo.deleteMany({ where: { categoriaId } });
      
      return res.status(400).json({ 
        error: `No se puede eliminar la categoría porque tiene ${articulosCount} artículo(s) asociado(s). Elimina primero los artículos o todos los artículos de esta categoría se eliminarán también.`,
        count: articulosCount
      });
    }
    
    // Verificar si la categoría tiene subcategorías
    const subcategorias = await prisma.categoria.findMany({
      where: { padreId: categoriaId },
      select: { id: true, nombre: true }
    });
    
    if (subcategorias.length > 0) {
      const nombresSubcategorias = subcategorias.map(sub => sub.nombre).join(', ');
      return res.status(400).json({ 
        error: `No se puede eliminar la categoría porque tiene ${subcategorias.length} subcategoría(s): ${nombresSubcategorias}. Elimina primero las subcategorías.`,
        subcategorias: subcategorias
      });
    }
    
    await prisma.categoria.delete({ where: { id: categoriaId } });
    res.json({ message: "Categoría eliminada exitosamente" });
  } catch (err: any) {
    console.error("Error al eliminar categoría:", err);
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
      orderBy: { creadoEn: 'desc' }
    });
    res.json(articulos);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener artículos" });
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

export const createArticulo = async (req: Request, res: Response) => {
  try {
    const { titulo, contenido, categoriaId, adjuntos } = req.body;
    const creadoPorId = (req as any).user.id;
    
    console.log("Datos recibidos para crear artículo:", { titulo, contenido, categoriaId, adjuntos, creadoPorId });
    
    if (!titulo || !contenido || !categoriaId) {
      return res.status(400).json({ error: "Faltan campos obligatorios: titulo, contenido y categoriaId" });
    }
    
    const articulo = await prisma.articulo.create({ 
      data: { 
        titulo, 
        contenido, 
        categoriaId: Number(categoriaId), 
        adjuntos: adjuntos || [], 
        creadoPorId 
      } 
    });
    
    console.log("Artículo creado exitosamente:", articulo);
    res.status(201).json(articulo);
  } catch (err: any) {
    console.error("Error al crear artículo:", err);
    res.status(500).json({ error: `Error al crear artículo: ${err.message}` });
  }
};

export const updateArticulo = async (req: Request, res: Response) => {
  try {
    const { titulo, contenido, categoriaId, adjuntos } = req.body;
    const articulo = await prisma.articulo.update({ where: { id: Number(req.params.id) }, data: { titulo, contenido, categoriaId, adjuntos } });
    res.json(articulo);
  } catch (err) {
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

// Eliminar categoría con todos sus artículos
// Limpiar subcategorías huérfanas y permitir eliminación
export const cleanAndDeleteCategoria = async (req: Request, res: Response) => {
  try {
    const categoriaId = Number(req.params.id);
    
    // Obtener información de la categoría
    const categoria = await prisma.categoria.findUnique({
      where: { id: categoriaId },
      include: {
        subcategorias: true,
        articulos: true
      }
    });
    
    if (!categoria) {
      return res.status(404).json({ error: "Categoría no encontrada" });
    }
    
    // Eliminar subcategorías huérfanas (que pueden no tener artículos)
    for (const subcategoria of categoria.subcategorias) {
      await prisma.articulo.deleteMany({ where: { categoriaId: subcategoria.id } });
      await prisma.categoria.delete({ where: { id: subcategoria.id } });
    }
    
    // Eliminar artículos de la categoría principal
    await prisma.articulo.deleteMany({ where: { categoriaId } });
    
    // Eliminar la categoría
    await prisma.categoria.delete({ where: { id: categoriaId } });
    
    res.json({ 
      message: "Categoría eliminada exitosamente",
      deletedSubcategories: categoria.subcategorias.length,
      deletedArticles: categoria.articulos.length
    });
  } catch (err: any) {
    console.error("Error al limpiar y eliminar categoría:", err);
    res.status(500).json({ error: `Error al eliminar categoría: ${err.message}` });
  }
};

export const deleteCategoriaWithArticles = async (req: Request, res: Response) => {
  try {
    const categoriaId = Number(req.params.id);
    
    // Primero eliminar todos los artículos de la categoría
    const deletedArticles = await prisma.articulo.deleteMany({
      where: { categoriaId }
    });
    
    // Luego eliminar las subcategorías recursivamente
    const subcategorias = await prisma.categoria.findMany({
      where: { padreId: categoriaId }
    });
    
    for (const subcategoria of subcategorias) {
      await prisma.articulo.deleteMany({ where: { categoriaId: subcategoria.id } });
      await prisma.categoria.delete({ where: { id: subcategoria.id } });
    }
    
    // Finalmente eliminar la categoría
    await prisma.categoria.delete({ where: { id: categoriaId } });
    
    res.json({ 
      message: "Categoría eliminada exitosamente", 
      deletedArticles: deletedArticles.count,
      deletedSubcategories: subcategorias.length 
    });
  } catch (err: any) {
    console.error("Error al eliminar categoría con artículos:", err);
    res.status(500).json({ error: `Error al eliminar categoría: ${err.message}` });
  }
}; 