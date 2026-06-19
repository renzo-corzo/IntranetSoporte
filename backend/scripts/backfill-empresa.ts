import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const NOMBRE_EMPRESA_DEFAULT = process.argv[2] || 'Cliente Default';

async function main() {
  const empresa = await prisma.empresa.upsert({
    where: { nombre: NOMBRE_EMPRESA_DEFAULT },
    update: {},
    create: { nombre: NOMBRE_EMPRESA_DEFAULT },
  });

  console.log(`Empresa base: ${empresa.nombre} (${empresa.id})`);

  const empresaId = empresa.id;
  const where = { empresaId: null };
  const data = { empresaId };

  const resultados = await Promise.all([
    prisma.relevamiento.updateMany({ where, data }),
    prisma.procedimiento.updateMany({ where, data }),
    prisma.categoriaTarea.updateMany({ where, data }),
    prisma.tarea.updateMany({ where, data }),
    prisma.categoria.updateMany({ where, data }),
    prisma.articulo.updateMany({ where, data }),
    prisma.categoriaStock.updateMany({ where, data }),
    prisma.unidadMedida.updateMany({ where, data }),
    prisma.proveedorStock.updateMany({ where, data }),
    prisma.ubicacionStock.updateMany({ where, data }),
    prisma.productoStock.updateMany({ where, data }),
    prisma.tipoMovimiento.updateMany({ where, data }),
    prisma.movimientoStock.updateMany({ where, data }),
    prisma.alertaStock.updateMany({ where, data }),
    prisma.reporteStock.updateMany({ where, data }),
    prisma.servidorFisico.updateMany({ where, data }),
    prisma.maquinaVirtual.updateMany({ where, data }),
    prisma.equipoRed.updateMany({ where, data }),
    prisma.equipoUsuario.updateMany({ where, data }),
    prisma.servicio.updateMany({ where, data }),
    prisma.credencial.updateMany({ where, data }),
  ]);

  const modelos = [
    'Relevamiento', 'Procedimiento', 'CategoriaTarea', 'Tarea', 'Categoria', 'Articulo',
    'CategoriaStock', 'UnidadMedida', 'ProveedorStock', 'UbicacionStock', 'ProductoStock',
    'TipoMovimiento', 'MovimientoStock', 'AlertaStock', 'ReporteStock', 'ServidorFisico',
    'MaquinaVirtual', 'EquipoRed', 'EquipoUsuario', 'Servicio', 'Credencial',
  ];

  modelos.forEach((modelo, i) => {
    console.log(`${modelo}: ${resultados[i].count} filas actualizadas`);
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
