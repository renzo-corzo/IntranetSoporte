import { Request, Response } from 'express';
import prisma from '../lib/prisma';


// ===== PRODUCTOS =====

export const obtenerProductos = async (req: Request, res: Response) => {
  try {
    const empresaId = (req as any).empresaId;
    const {
      categoria,
      ubicacion,
      proveedor,
      estado,
      stockBajo,
      stockAgotado,
      buscar,
      page = 1,
      limit = 50
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    // Construir filtros
    const where: any = { empresaId };

    // Filtro por categoría (puede ser ID o nombre)
    if (categoria) {
      if (isNaN(Number(categoria))) {
        // Es un nombre de categoría
        where.categoria = {
          nombre: categoria as string
        };
      } else {
        // Es un ID de categoría
        where.categoriaId = Number(categoria);
      }
    }

    // Filtro por ubicación (puede ser ID o nombre)
    if (ubicacion) {
      if (isNaN(Number(ubicacion))) {
        // Es un nombre de ubicación
        where.ubicacion = {
          nombre: ubicacion as string
        };
      } else {
        // Es un ID de ubicación
        where.ubicacionId = Number(ubicacion);
      }
    }

    if (proveedor) where.proveedorId = Number(proveedor);
    if (estado) where.estado = estado;
    // Para stock bajo, lo manejaremos después de obtener los productos
    if (buscar) {
      where.OR = [
        { nombre: { contains: buscar, mode: 'insensitive' } },
        { codigo: { contains: buscar, mode: 'insensitive' } },
        { descripcion: { contains: buscar, mode: 'insensitive' } },
        { marca: { contains: buscar, mode: 'insensitive' } },
        { modelo: { contains: buscar, mode: 'insensitive' } }
      ];
    }

    let [productos, total] = await Promise.all([
      prisma.productoStock.findMany({
        where,
        include: {
          categoria: true,
          unidadMedida: true,
          proveedor: true,
          ubicacion: true,
          creadoPor: {
            select: { id: true, nombre: true }
          },
          _count: {
            select: { movimientos: true }
          }
        },
        orderBy: { creadoEn: 'desc' },
        skip,
        take
      }),
      prisma.productoStock.count({ where })
    ]);

    // Filtrar stock bajo si se solicita
    if (stockBajo === 'true') {
      productos = productos.filter(p => p.stockActual <= p.stockMinimo && p.stockActual > 0);
      total = productos.length;
    }

    // Filtrar stock agotado si se solicita
    if (stockAgotado === 'true') {
      productos = productos.filter(p => p.stockActual === 0);
      total = productos.length;
    }

    res.json({
      productos,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const obtenerProductoPorId = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const empresaId = (req as any).empresaId;

    const producto = await prisma.productoStock.findUnique({
      where: { id: Number(id) },
      include: {
        categoria: true,
        unidadMedida: true,
        proveedor: true,
        ubicacion: true,
        creadoPor: {
          select: { id: true, nombre: true }
        },
        movimientos: {
          include: {
            tipoMovimiento: true,
            realizadoPor: {
              select: { id: true, nombre: true }
            },
            origen: true,
            destino: true
          },
          orderBy: { fechaMovimiento: 'desc' },
          take: 10
        },
        alertas: {
          where: { activa: true },
          orderBy: { creadoEn: 'desc' }
        }
      }
    });

    if (!producto || producto.empresaId !== empresaId) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json(producto);
  } catch (error) {
    console.error('Error al obtener producto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const crearProducto = async (req: Request, res: Response) => {
  try {
    const empresaId = (req as any).empresaId;
    const {
      codigo,
      nombre,
      descripcion,
      marca,
      modelo,
      numeroSerie,
      codigoBarras,
      stockActual,
      stockMinimo,
      stockMaximo,
      precioCompra,
      precioVenta,
      moneda,
      categoriaId,
      unidadMedidaId,
      proveedorId,
      ubicacionId,
      estado,
      condicion,
      fechaCompra,
      fechaVencimiento,
      observaciones,
      tags,
      imagenes,
      documentos
    } = req.body;

    const userId = (req as any).user.id;

    // Validar campos obligatorios
    if (!codigo || !nombre) {
      return res.status(400).json({ error: 'Código y nombre son obligatorios' });
    }

    if (!categoriaId || !unidadMedidaId) {
      return res.status(400).json({ error: 'Categoría y unidad de medida son obligatorias' });
    }

    // Verificar que los IDs sean números válidos
    const categoriaIdNum = parseInt(categoriaId);
    const unidadMedidaIdNum = parseInt(unidadMedidaId);

    if (isNaN(categoriaIdNum) || isNaN(unidadMedidaIdNum)) {
      return res.status(400).json({ error: 'IDs de categoría y unidad de medida deben ser números válidos' });
    }


    // Verificar que el código no exista en este cliente
    const existeCodigo = await prisma.productoStock.findFirst({
      where: { empresaId, codigo }
    });

    if (existeCodigo) {
      return res.status(400).json({ error: 'Ya existe un producto con ese código' });
    }

    const producto = await prisma.productoStock.create({
      data: {
        empresaId,
        codigo,
        nombre,
        descripcion,
        marca,
        modelo,
        numeroSerie,
        codigoBarras,
        stockActual: parseInt(stockActual) || 0,
        stockMinimo: parseInt(stockMinimo) || 1,
        stockMaximo: stockMaximo ? parseInt(stockMaximo) : null,
        precioCompra,
        precioVenta,
        moneda: moneda || 'ARS',
        categoriaId: categoriaIdNum,
        unidadMedidaId: unidadMedidaIdNum,
        proveedorId: proveedorId ? parseInt(proveedorId) : null,
        ubicacionId: ubicacionId ? parseInt(ubicacionId) : null,
        estado: estado || 'Activo',
        condicion: condicion || 'Nuevo',
        fechaCompra: fechaCompra ? new Date(fechaCompra) : null,
        fechaVencimiento: fechaVencimiento ? new Date(fechaVencimiento) : null,
        observaciones,
        tags: tags || [],
        imagenes: imagenes || [],
        documentos: documentos || [],
        creadoPorId: userId
      },
      include: {
        categoria: true,
        unidadMedida: true,
        proveedor: true,
        ubicacion: true,
        creadoPor: {
          select: { id: true, nombre: true }
        }
      }
    });

    // Si hay stock inicial, crear movimiento de ingreso
    if (stockActual && stockActual > 0) {
      const tipoIngreso = await prisma.tipoMovimiento.findFirst({
        where: { empresaId, nombre: 'Ingreso' }
      });

      if (tipoIngreso) {
        await prisma.movimientoStock.create({
          data: {
            empresaId,
            numero: `MOV-${Date.now()}`,
            productoId: producto.id,
            cantidad: parseInt(stockActual),
            stockAnterior: 0,
            stockNuevo: parseInt(stockActual),
            tipoMovimientoId: tipoIngreso.id,
            destinoId: ubicacionId ? parseInt(ubicacionId) : null,
            motivo: 'Stock inicial',
            realizadoPorId: userId
          }
        });
      }
    }

    // Verificar alertas de stock después de crear el producto
    await verificarAlertasStock(producto.id);

    res.status(201).json(producto);
  } catch (error: any) {

    if (error.code === 'P2002') {
      res.status(400).json({ error: 'Ya existe un producto con ese código' });
    } else if (error.code === 'P2003') {
      res.status(400).json({ error: 'Error de referencia: verifique que la categoría y unidad de medida existan' });
    } else {
      res.status(500).json({
        error: 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        code: error.code
      });
    }
  }
};

export const actualizarProducto = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const empresaId = (req as any).empresaId;
    const updateData = req.body;

    const existente = await prisma.productoStock.findUnique({ where: { id: Number(id) } });
    if (!existente || existente.empresaId !== empresaId) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Remover campos que no se deben actualizar directamente
    delete updateData.id;
    delete updateData.empresaId;
    delete updateData.creadoPorId;
    delete updateData.creadoEn;
    delete updateData.stockActual; // El stock se actualiza solo con movimientos

    // Convertir fechas si existen
    if (updateData.fechaCompra) {
      updateData.fechaCompra = new Date(updateData.fechaCompra);
    }
    if (updateData.fechaVencimiento) {
      updateData.fechaVencimiento = new Date(updateData.fechaVencimiento);
    }

    const producto = await prisma.productoStock.update({
      where: { id: Number(id) },
      data: updateData,
      include: {
        categoria: true,
        unidadMedida: true,
        proveedor: true,
        ubicacion: true,
        creadoPor: {
          select: { id: true, nombre: true }
        }
      }
    });

    // Verificar alertas de stock después de actualizar el producto
    // Especialmente si se actualizó stockMinimo o stockActual
    await verificarAlertasStock(producto.id);

    res.json(producto);
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const eliminarProducto = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const empresaId = (req as any).empresaId;
    const productoId = Number(id);

    // Verificar que el producto existe
    const producto = await prisma.productoStock.findUnique({
      where: { id: productoId }
    });

    if (!producto || producto.empresaId !== empresaId) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Eliminar movimientos relacionados primero
    const movimientosEliminados = await prisma.movimientoStock.deleteMany({
      where: { productoId: productoId }
    });

    // Eliminar alertas relacionadas
    const alertasEliminadas = await prisma.alertaStock.deleteMany({
      where: { productoId: productoId }
    });

    // Finalmente eliminar el producto
    await prisma.productoStock.delete({
      where: { id: productoId }
    });

    res.json({
      message: 'Producto eliminado correctamente',
      movimientosEliminados: movimientosEliminados.count,
      alertasEliminadas: alertasEliminadas.count
    });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ===== MOVIMIENTOS =====

export const obtenerMovimientos = async (req: Request, res: Response) => {
  try {
    const empresaId = (req as any).empresaId;
    const {
      productoId,
      tipoMovimiento,
      fechaInicio,
      fechaFin,
      buscar,
      realizadoPorId,
      page = 1,
      limit = 50
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: any = { empresaId };

    // Filtro por producto específico
    if (productoId) where.productoId = Number(productoId);

    // Filtro por tipo de movimiento (por nombre)
    if (tipoMovimiento) {
      where.tipoMovimiento = {
        nombre: tipoMovimiento as string
      };
    }

    // Filtro por rango de fechas
    if (fechaInicio || fechaFin) {
      where.fechaMovimiento = {};
      if (fechaInicio) {
        const fechaInicioDate = new Date(fechaInicio as string);
        fechaInicioDate.setHours(0, 0, 0, 0);
        where.fechaMovimiento.gte = fechaInicioDate;
      }
      if (fechaFin) {
        const fechaFinDate = new Date(fechaFin as string);
        fechaFinDate.setHours(23, 59, 59, 999);
        where.fechaMovimiento.lte = fechaFinDate;
      }
    }

    // Filtro por usuario que realizó el movimiento
    if (realizadoPorId) {
      where.realizadoPorId = Number(realizadoPorId);
    }

    // Filtro de búsqueda por producto, número de movimiento, motivo o usuario
    if (buscar) {
      where.OR = [
        {
          numero: {
            contains: buscar as string,
            mode: 'insensitive'
          }
        },
        {
          producto: {
            OR: [
              {
                nombre: {
                  contains: buscar as string,
                  mode: 'insensitive'
                }
              },
              {
                codigo: {
                  contains: buscar as string,
                  mode: 'insensitive'
                }
              }
            ]
          }
        },
        {
          motivo: {
            contains: buscar as string,
            mode: 'insensitive'
          }
        },
        {
          entregadoA: {
            contains: buscar as string,
            mode: 'insensitive'
          }
        },
        {
          realizadoPor: {
            nombre: {
              contains: buscar as string,
              mode: 'insensitive'
            }
          }
        }
      ];
    }

    const [movimientos, total] = await Promise.all([
      prisma.movimientoStock.findMany({
        where,
        include: {
          producto: {
            select: { id: true, codigo: true, nombre: true }
          },
          tipoMovimiento: true,
          origen: true,
          destino: true,
          realizadoPor: {
            select: { id: true, nombre: true, username: true, email: true }
          },
          aprobadoPor: {
            select: { id: true, nombre: true }
          }
        },
        orderBy: { fechaMovimiento: 'desc' },
        skip,
        take
      }),
      prisma.movimientoStock.count({ where })
    ]);

    res.json({
      movimientos,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error al obtener movimientos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const crearMovimiento = async (req: Request, res: Response) => {
  try {
    const empresaId = (req as any).empresaId;
    const {
      productoId,
      tipoMovimientoId,
      cantidad,
      origenId,
      destinoId,
      motivo,
      observaciones,
      numeroFactura,
      numeroRemito,
      costoUnitario,
      costoTotal,
      entregadoA
    } = req.body;

    const userId = (req as any).user.id;

    // Obtener producto actual
    const producto = await prisma.productoStock.findUnique({
      where: { id: productoId }
    });

    if (!producto || producto.empresaId !== empresaId) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Obtener tipo de movimiento
    const tipoMovimiento = await prisma.tipoMovimiento.findUnique({
      where: { id: tipoMovimientoId }
    });

    if (!tipoMovimiento || tipoMovimiento.empresaId !== empresaId) {
      return res.status(404).json({ error: 'Tipo de movimiento no encontrado' });
    }

    // Calcular nuevo stock
    let nuevoStock = producto.stockActual;
    if (tipoMovimiento.afectaStock === 'suma') {
      nuevoStock += cantidad;
    } else if (tipoMovimiento.afectaStock === 'resta') {
      nuevoStock -= cantidad;
      if (nuevoStock < 0) {
        return res.status(400).json({ error: 'Stock insuficiente' });
      }
    } else if (tipoMovimiento.afectaStock === 'ajuste') {
      // Para "Ajuste" la cantidad es el stock real (conteo físico), no un delta
      nuevoStock = cantidad;
      if (nuevoStock < 0) {
        return res.status(400).json({ error: 'El stock no puede ser negativo' });
      }
    }

    // Crear movimiento y actualizar stock en transacción
    const resultado = await prisma.$transaction(async (tx) => {
      // Crear movimiento
      const movimiento = await tx.movimientoStock.create({
        data: {
          empresaId,
          numero: `MOV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          productoId,
          cantidad,
          stockAnterior: producto.stockActual,
          stockNuevo: nuevoStock,
          tipoMovimientoId,
          origenId,
          destinoId,
          motivo,
          observaciones,
          numeroFactura,
          numeroRemito,
          costoUnitario,
          costoTotal,
          entregadoA,
          realizadoPorId: userId
        },
        include: {
          producto: {
            select: { id: true, codigo: true, nombre: true }
          },
          tipoMovimiento: true,
          origen: true,
          destino: true,
          realizadoPor: {
            select: { id: true, nombre: true }
          }
        }
      });

      // Actualizar stock del producto
      await tx.productoStock.update({
        where: { id: productoId },
        data: {
          stockActual: nuevoStock,
          fechaUltimoMovimiento: new Date()
        }
      });

      return movimiento;
    });

    // Verificar alertas de stock
    await verificarAlertasStock(productoId);

    res.status(201).json(resultado);
  } catch (error) {
    console.error('Error al crear movimiento:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ===== ALERTAS =====

export const obtenerAlertas = async (req: Request, res: Response) => {
  try {
    const empresaId = (req as any).empresaId;
    const { activa, tipo, nivel } = req.query;

    const where: any = { empresaId };
    if (activa !== undefined) where.activa = activa === 'true';
    if (tipo) where.tipo = tipo;
    if (nivel) where.nivel = nivel;

    const alertas = await prisma.alertaStock.findMany({
      where,
      include: {
        producto: {
          select: { id: true, codigo: true, nombre: true, stockActual: true, stockMinimo: true }
        },
        leidaPor: {
          select: { id: true, nombre: true }
        }
      },
      orderBy: [
        { activa: 'desc' },
        { creadoEn: 'desc' }
      ]
    });

    res.json(alertas);
  } catch (error) {
    console.error('Error al obtener alertas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const marcarAlertaLeida = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const empresaId = (req as any).empresaId;
    const userId = (req as any).user.id;

    const existente = await prisma.alertaStock.findUnique({ where: { id: Number(id) } });
    if (!existente || existente.empresaId !== empresaId) {
      return res.status(404).json({ error: 'Alerta no encontrada' });
    }

    const alerta = await prisma.alertaStock.update({
      where: { id: Number(id) },
      data: {
        leida: true,
        leidaEn: new Date(),
        leidaPorId: userId
      }
    });

    res.json(alerta);
  } catch (error) {
    console.error('Error al marcar alerta como leída:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ===== FUNCIONES AUXILIARES =====

async function verificarAlertasStock(productoId: number) {
  const producto = await prisma.productoStock.findUnique({
    where: { id: productoId }
  });

  if (!producto) return;

  const empresaId = producto.empresaId;

  // Limpiar alertas anteriores del producto
  await prisma.alertaStock.updateMany({
    where: { productoId, activa: true },
    data: { activa: false }
  });

  // Verificar stock bajo
  if (producto.stockActual <= producto.stockMinimo) {
    const tipo = producto.stockActual === 0 ? 'stock_agotado' : 'stock_bajo';
    const nivel = producto.stockActual === 0 ? 'critical' : 'warning';
    const mensaje = producto.stockActual === 0
      ? `El producto ${producto.nombre} está agotado`
      : `El producto ${producto.nombre} tiene stock bajo (${producto.stockActual}/${producto.stockMinimo})`;

    await prisma.alertaStock.create({
      data: {
        empresaId,
        productoId,
        tipo,
        mensaje,
        nivel
      }
    });
  }

  // Verificar vencimiento próximo (30 días)
  if (producto.fechaVencimiento) {
    const hoy = new Date();
    const diasHastaVencimiento = Math.ceil(
      (producto.fechaVencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diasHastaVencimiento <= 0) {
      await prisma.alertaStock.create({
        data: {
          empresaId,
          productoId,
          tipo: 'vencido',
          mensaje: `El producto ${producto.nombre} está vencido`,
          nivel: 'critical'
        }
      });
    } else if (diasHastaVencimiento <= 30) {
      await prisma.alertaStock.create({
        data: {
          empresaId,
          productoId,
          tipo: 'vencimiento_proximo',
          mensaje: `El producto ${producto.nombre} vence en ${diasHastaVencimiento} días`,
          nivel: 'warning'
        }
      });
    }
  }
}
