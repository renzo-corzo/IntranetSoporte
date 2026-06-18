import { Request, Response } from 'express';
import prisma from '../lib/prisma';


// ===== CATEGORÍAS =====

export const obtenerCategorias = async (req: Request, res: Response) => {
  try {
    const empresaId = (req as any).empresaId;
    const categorias = await prisma.categoriaStock.findMany({
      where: { empresaId, activo: true },
      include: {
        _count: {
          select: { productos: true }
        }
      },
      orderBy: { nombre: 'asc' }
    });

    res.json(categorias);
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const crearCategoria = async (req: Request, res: Response) => {
  try {
    const empresaId = (req as any).empresaId;
    const { nombre, descripcion, icono, color } = req.body;

    const categoria = await prisma.categoriaStock.create({
      data: {
        empresaId,
        nombre,
        descripcion,
        icono,
        color
      }
    });

    res.status(201).json(categoria);
  } catch (error: any) {
    console.error('Error al crear categoría:', error);
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'Ya existe una categoría con ese nombre' });
    } else {
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
};

export const actualizarCategoria = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const empresaId = (req as any).empresaId;
    const { nombre, descripcion, icono, color, activo } = req.body;

    const existente = await prisma.categoriaStock.findUnique({ where: { id: Number(id) } });
    if (!existente || existente.empresaId !== empresaId) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    const categoria = await prisma.categoriaStock.update({
      where: { id: Number(id) },
      data: {
        nombre,
        descripcion,
        icono,
        color,
        activo
      }
    });

    res.json(categoria);
  } catch (error) {
    console.error('Error al actualizar categoría:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const eliminarCategoria = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const empresaId = (req as any).empresaId;

    const existente = await prisma.categoriaStock.findUnique({ where: { id: Number(id) } });
    if (!existente || existente.empresaId !== empresaId) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    // Verificar que no tenga productos asociados
    const productos = await prisma.productoStock.count({
      where: { categoriaId: Number(id) }
    });

    if (productos > 0) {
      return res.status(400).json({
        error: 'No se puede eliminar una categoría que tiene productos asociados'
      });
    }

    await prisma.categoriaStock.delete({
      where: { id: Number(id) }
    });

    res.json({ message: 'Categoría eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar categoría:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ===== UNIDADES DE MEDIDA =====

export const obtenerUnidadesMedida = async (req: Request, res: Response) => {
  try {
    const empresaId = (req as any).empresaId;
    const unidades = await prisma.unidadMedida.findMany({
      where: { empresaId, activo: true },
      include: {
        _count: {
          select: { productos: true }
        }
      },
      orderBy: { nombre: 'asc' }
    });

    res.json(unidades);
  } catch (error) {
    console.error('Error al obtener unidades de medida:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const crearUnidadMedida = async (req: Request, res: Response) => {
  try {
    const empresaId = (req as any).empresaId;
    const { nombre, abreviacion, tipo } = req.body;

    const unidad = await prisma.unidadMedida.create({
      data: {
        empresaId,
        nombre,
        abreviacion,
        tipo
      }
    });

    res.status(201).json(unidad);
  } catch (error: any) {
    console.error('Error al crear unidad de medida:', error);
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'Ya existe una unidad de medida con ese nombre o abreviación' });
    } else {
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
};

export const actualizarUnidadMedida = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const empresaId = (req as any).empresaId;
    const { nombre, abreviacion, tipo, activo } = req.body;

    const existente = await prisma.unidadMedida.findUnique({ where: { id: Number(id) } });
    if (!existente || existente.empresaId !== empresaId) {
      return res.status(404).json({ error: 'Unidad de medida no encontrada' });
    }

    const unidad = await prisma.unidadMedida.update({
      where: { id: Number(id) },
      data: {
        nombre,
        abreviacion,
        tipo,
        activo
      }
    });

    res.json(unidad);
  } catch (error) {
    console.error('Error al actualizar unidad de medida:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ===== PROVEEDORES =====

export const obtenerProveedores = async (req: Request, res: Response) => {
  try {
    const empresaId = (req as any).empresaId;
    const proveedores = await prisma.proveedorStock.findMany({
      where: { empresaId, activo: true },
      include: {
        _count: {
          select: { productos: true }
        }
      },
      orderBy: { nombre: 'asc' }
    });

    res.json(proveedores);
  } catch (error) {
    console.error('Error al obtener proveedores:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const crearProveedor = async (req: Request, res: Response) => {
  try {
    const empresaId = (req as any).empresaId;
    const { nombre, contacto, telefono, email, direccion, sitioWeb } = req.body;

    const proveedor = await prisma.proveedorStock.create({
      data: {
        empresaId,
        nombre,
        contacto,
        telefono,
        email,
        direccion,
        sitioWeb
      }
    });

    res.status(201).json(proveedor);
  } catch (error: any) {
    console.error('Error al crear proveedor:', error);
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'Ya existe un proveedor con ese nombre' });
    } else {
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
};

export const actualizarProveedor = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const empresaId = (req as any).empresaId;
    const { nombre, contacto, telefono, email, direccion, sitioWeb, activo } = req.body;

    const existente = await prisma.proveedorStock.findUnique({ where: { id: Number(id) } });
    if (!existente || existente.empresaId !== empresaId) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }

    const proveedor = await prisma.proveedorStock.update({
      where: { id: Number(id) },
      data: {
        nombre,
        contacto,
        telefono,
        email,
        direccion,
        sitioWeb,
        activo
      }
    });

    res.json(proveedor);
  } catch (error) {
    console.error('Error al actualizar proveedor:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ===== UBICACIONES =====

export const obtenerUbicaciones = async (req: Request, res: Response) => {
  try {
    const empresaId = (req as any).empresaId;
    const ubicaciones = await prisma.ubicacionStock.findMany({
      where: { empresaId, activo: true },
      include: {
        _count: {
          select: { productos: true }
        }
      },
      orderBy: { nombre: 'asc' }
    });

    res.json(ubicaciones);
  } catch (error) {
    console.error('Error al obtener ubicaciones:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const crearUbicacion = async (req: Request, res: Response) => {
  try {
    const empresaId = (req as any).empresaId;
    const { nombre, descripcion, tipo } = req.body;

    const ubicacion = await prisma.ubicacionStock.create({
      data: {
        empresaId,
        nombre,
        descripcion,
        tipo
      }
    });

    res.status(201).json(ubicacion);
  } catch (error: any) {
    console.error('Error al crear ubicación:', error);
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'Ya existe una ubicación con ese nombre' });
    } else {
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
};

export const actualizarUbicacion = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const empresaId = (req as any).empresaId;
    const { nombre, descripcion, tipo, activo } = req.body;

    const existente = await prisma.ubicacionStock.findUnique({ where: { id: Number(id) } });
    if (!existente || existente.empresaId !== empresaId) {
      return res.status(404).json({ error: 'Ubicación no encontrada' });
    }

    const ubicacion = await prisma.ubicacionStock.update({
      where: { id: Number(id) },
      data: {
        nombre,
        descripcion,
        tipo,
        activo
      }
    });

    res.json(ubicacion);
  } catch (error) {
    console.error('Error al actualizar ubicación:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ===== TIPOS DE MOVIMIENTO =====

export const obtenerTiposMovimiento = async (req: Request, res: Response) => {
  try {
    const empresaId = (req as any).empresaId;
    const tipos = await prisma.tipoMovimiento.findMany({
      where: { empresaId, activo: true },
      include: {
        _count: {
          select: { movimientos: true }
        }
      },
      orderBy: { nombre: 'asc' }
    });

    res.json(tipos);
  } catch (error) {
    console.error('Error al obtener tipos de movimiento:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const crearTipoMovimiento = async (req: Request, res: Response) => {
  try {
    const empresaId = (req as any).empresaId;
    const {
      nombre,
      descripcion,
      afectaStock,
      requiereOrigen,
      requiereDestino,
      color,
      icono
    } = req.body;

    const tipo = await prisma.tipoMovimiento.create({
      data: {
        empresaId,
        nombre,
        descripcion,
        afectaStock,
        requiereOrigen,
        requiereDestino,
        color,
        icono
      }
    });

    res.status(201).json(tipo);
  } catch (error: any) {
    console.error('Error al crear tipo de movimiento:', error);
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'Ya existe un tipo de movimiento con ese nombre' });
    } else {
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
};

export const actualizarTipoMovimiento = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const empresaId = (req as any).empresaId;
    const {
      nombre,
      descripcion,
      afectaStock,
      requiereOrigen,
      requiereDestino,
      color,
      icono,
      activo
    } = req.body;

    const existente = await prisma.tipoMovimiento.findUnique({ where: { id: Number(id) } });
    if (!existente || existente.empresaId !== empresaId) {
      return res.status(404).json({ error: 'Tipo de movimiento no encontrado' });
    }

    const tipo = await prisma.tipoMovimiento.update({
      where: { id: Number(id) },
      data: {
        nombre,
        descripcion,
        afectaStock,
        requiereOrigen,
        requiereDestino,
        color,
        icono,
        activo
      }
    });

    res.json(tipo);
  } catch (error) {
    console.error('Error al actualizar tipo de movimiento:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ===== DASHBOARD Y ESTADÍSTICAS =====

export const obtenerDashboardStock = async (req: Request, res: Response) => {
  try {
    const empresaId = (req as any).empresaId;
    const [
      totalProductos,
      productosActivos,
      stockBajo,
      stockAgotado,
      alertasActivas,
      movimientosHoy,
      valorTotalStock,
      categorias,
      ubicaciones,
      ultimosMovimientos
    ] = await Promise.all([
      // Total de productos
      prisma.productoStock.count({ where: { empresaId } }),

      // Productos activos
      prisma.productoStock.count({
        where: { empresaId, estado: 'Activo' }
      }),

      // Stock bajo: productos con stockActual > 0 y stockActual < stockMinimo
      prisma.productoStock
        .findMany({
          where: { empresaId, stockActual: { gt: 0 } },
          select: { stockActual: true, stockMinimo: true }
        })
        .then((rows) =>
          rows.filter(
            (r) => r.stockMinimo !== null && r.stockActual < (r.stockMinimo as number)
          ).length
        ),

      // Stock agotado
      prisma.productoStock.count({
        where: { empresaId, stockActual: 0 }
      }),

      // Alertas activas
      prisma.alertaStock.count({
        where: { empresaId, activa: true }
      }),

      // Movimientos de hoy
      prisma.movimientoStock.count({
        where: {
          empresaId,
          fechaMovimiento: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),

      // Valor total del stock
      prisma.productoStock.aggregate({
        _sum: {
          precioCompra: true
        },
        where: {
          empresaId,
          precioCompra: { not: null },
          stockActual: { gt: 0 }
        }
      }),

      // Productos por categoría
      prisma.categoriaStock.findMany({
        include: {
          _count: {
            select: { productos: true }
          }
        },
        where: { empresaId, activo: true }
      }),

      // Productos por ubicación
      prisma.ubicacionStock.findMany({
        include: {
          _count: {
            select: { productos: true }
          }
        },
        where: { empresaId, activo: true }
      }),

      // Últimos movimientos
      prisma.movimientoStock.findMany({
        where: { empresaId },
        include: {
          producto: {
            select: { codigo: true, nombre: true }
          },
          tipoMovimiento: true,
          realizadoPor: {
            select: { nombre: true }
          }
        },
        orderBy: { fechaMovimiento: 'desc' },
        take: 10
      })
    ]);

    res.json({
      resumen: {
        totalProductos,
        productosActivos,
        stockBajo,
        stockAgotado,
        alertasActivas,
        movimientosHoy,
        valorTotalStock: valorTotalStock._sum.precioCompra || 0
      },
      distribucion: {
        porCategoria: categorias.map((cat: any) => ({
          nombre: cat.nombre,
          cantidad: cat._count.productos,
          color: cat.color
        })),
        porUbicacion: ubicaciones.map((ub: any) => ({
          nombre: ub.nombre,
          cantidad: ub._count.productos
        }))
      },
      ultimosMovimientos
    });
  } catch (error) {
    console.error('Error al obtener dashboard:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
