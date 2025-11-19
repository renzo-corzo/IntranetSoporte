import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ===== CATEGORÍAS =====

export const obtenerCategorias = async (req: Request, res: Response) => {
  try {
    const categorias = await prisma.categoriaStock.findMany({
      where: { activo: true },
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
    const { nombre, descripcion, icono, color } = req.body;

    const categoria = await prisma.categoriaStock.create({
      data: {
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
    const { nombre, descripcion, icono, color, activo } = req.body;

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
    const unidades = await prisma.unidadMedida.findMany({
      where: { activo: true },
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
    const { nombre, abreviacion, tipo } = req.body;

    const unidad = await prisma.unidadMedida.create({
      data: {
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
    const { nombre, abreviacion, tipo, activo } = req.body;

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
    const proveedores = await prisma.proveedorStock.findMany({
      where: { activo: true },
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
    const { nombre, contacto, telefono, email, direccion, sitioWeb } = req.body;

    const proveedor = await prisma.proveedorStock.create({
      data: {
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
    const { nombre, contacto, telefono, email, direccion, sitioWeb, activo } = req.body;

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
    const ubicaciones = await prisma.ubicacionStock.findMany({
      where: { activo: true },
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
    const { nombre, descripcion, tipo } = req.body;

    const ubicacion = await prisma.ubicacionStock.create({
      data: {
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
    const { nombre, descripcion, tipo, activo } = req.body;

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
    const tipos = await prisma.tipoMovimiento.findMany({
      where: { activo: true },
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
      prisma.productoStock.count(),
      
      // Productos activos
      prisma.productoStock.count({
        where: { estado: 'Activo' }
      }),
      
      // Stock bajo: productos con stockActual > 0 y stockActual < stockMinimo
      prisma.productoStock
        .findMany({
          where: { stockActual: { gt: 0 } },
          select: { stockActual: true, stockMinimo: true }
        })
        .then((rows) =>
          rows.filter(
            (r) => r.stockMinimo !== null && r.stockActual < (r.stockMinimo as number)
          ).length
        ),
      
      // Stock agotado
      prisma.productoStock.count({
        where: { stockActual: 0 }
      }),
      
      // Alertas activas
      prisma.alertaStock.count({
        where: { activa: true }
      }),
      
      // Movimientos de hoy
      prisma.movimientoStock.count({
        where: {
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
        where: { activo: true }
      }),
      
      // Productos por ubicación
      prisma.ubicacionStock.findMany({
        include: {
          _count: {
            select: { productos: true }
          }
        },
        where: { activo: true }
      }),
      
      // Últimos movimientos
      prisma.movimientoStock.findMany({
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
