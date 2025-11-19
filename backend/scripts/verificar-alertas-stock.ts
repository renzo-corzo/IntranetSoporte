import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verificarAlertasStock(productoId: number) {
  const producto = await prisma.productoStock.findUnique({
    where: { id: productoId }
  });

  if (!producto) return;

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
          productoId,
          tipo: 'vencido',
          mensaje: `El producto ${producto.nombre} está vencido`,
          nivel: 'critical'
        }
      });
    } else if (diasHastaVencimiento <= 30) {
      await prisma.alertaStock.create({
        data: {
          productoId,
          tipo: 'vencimiento_proximo',
          mensaje: `El producto ${producto.nombre} vence en ${diasHastaVencimiento} días`,
          nivel: 'warning'
        }
      });
    }
  }
}

async function verificarTodasLasAlertas() {
  console.log('🔍 Iniciando verificación de alertas de stock...\n');

  try {
    // Obtener todos los productos activos
    const productos = await prisma.productoStock.findMany({
      where: {
        estado: 'Activo'
      },
      select: {
        id: true,
        nombre: true,
        codigo: true,
        stockActual: true,
        stockMinimo: true
      }
    });

    console.log(`📦 Encontrados ${productos.length} productos activos\n`);

    let alertasCreadas = 0;
    let productosConAlerta = 0;

    for (const producto of productos) {
      const alertasAntes = await prisma.alertaStock.count({
        where: { productoId: producto.id, activa: true }
      });

      await verificarAlertasStock(producto.id);

      const alertasDespues = await prisma.alertaStock.count({
        where: { productoId: producto.id, activa: true }
      });

      if (alertasDespues > alertasAntes) {
        productosConAlerta++;
        alertasCreadas += (alertasDespues - alertasAntes);
        console.log(`⚠️  ${producto.codigo} - ${producto.nombre}: Stock ${producto.stockActual}/${producto.stockMinimo}`);
      }
    }

    console.log('\n✅ Verificación completada:');
    console.log(`   - Productos verificados: ${productos.length}`);
    console.log(`   - Productos con alertas: ${productosConAlerta}`);
    console.log(`   - Alertas creadas/actualizadas: ${alertasCreadas}`);

    // Mostrar resumen de alertas activas
    const alertasActivas = await prisma.alertaStock.findMany({
      where: { activa: true },
      include: {
        producto: {
          select: { codigo: true, nombre: true }
        }
      },
      orderBy: [
        { nivel: 'asc' }, // critical primero
        { creadoEn: 'desc' }
      ]
    });

    if (alertasActivas.length > 0) {
      console.log('\n📋 ALERTAS ACTIVAS:');
      console.log('==================');
      
      const porNivel = alertasActivas.reduce((acc, alerta) => {
        acc[alerta.nivel] = (acc[alerta.nivel] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      console.log(`   Críticas: ${porNivel['critical'] || 0}`);
      console.log(`   Advertencias: ${porNivel['warning'] || 0}`);
      
      console.log('\n   Detalles:');
      alertasActivas.slice(0, 10).forEach(alerta => {
        const icono = alerta.nivel === 'critical' ? '🔴' : '🟡';
        console.log(`   ${icono} ${alerta.producto.codigo} - ${alerta.mensaje}`);
      });
      
      if (alertasActivas.length > 10) {
        console.log(`   ... y ${alertasActivas.length - 10} alertas más`);
      }
    } else {
      console.log('\n✅ No hay alertas activas');
    }

  } catch (error) {
    console.error('❌ Error al verificar alertas:', error);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  verificarTodasLasAlertas()
    .then(() => {
      console.log('\n✅ Script ejecutado correctamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Error en el script:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

export default verificarTodasLasAlertas;

