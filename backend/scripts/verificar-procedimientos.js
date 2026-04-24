const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificarProcedimientos() {
  try {
    console.log('🔍 Verificando procedimientos en la base de datos...\n');
    
    // Contar total de artículos
    const totalArticulos = await prisma.articulo.count();
    console.log(`📊 Total de artículos (procedimientos): ${totalArticulos}`);
    
    // Contar total de categorías
    const totalCategorias = await prisma.categoria.count();
    console.log(`📁 Total de categorías: ${totalCategorias}\n`);
    
    // Listar todas las categorías
    const categorias = await prisma.categoria.findMany({
      include: {
        articulos: {
          select: {
            id: true,
            titulo: true,
            creadoEn: true
          }
        }
      },
      orderBy: { nombre: 'asc' }
    });
    
    console.log('📁 Categorías y sus artículos:');
    console.log('='.repeat(60));
    
    if (categorias.length === 0) {
      console.log('⚠️  No hay categorías en la base de datos');
    } else {
      categorias.forEach((cat, index) => {
        console.log(`\n${index + 1}. ${cat.nombre} (ID: ${cat.id})`);
        if (cat.descripcion) {
          console.log(`   Descripción: ${cat.descripcion}`);
        }
        console.log(`   Artículos: ${cat.articulos.length}`);
        if (cat.articulos.length > 0) {
          cat.articulos.forEach((art, artIndex) => {
            console.log(`     ${artIndex + 1}. ${art.titulo} (ID: ${art.id}, Creado: ${art.creadoEn})`);
          });
        }
      });
    }
    
    // Listar artículos sin categoría
    const articulosSinCategoria = await prisma.articulo.findMany({
      where: {
        categoriaId: null
      },
      select: {
        id: true,
        titulo: true,
        creadoEn: true
      }
    });
    
    if (articulosSinCategoria.length > 0) {
      console.log('\n⚠️  Artículos sin categoría:');
      articulosSinCategoria.forEach((art, index) => {
        console.log(`   ${index + 1}. ${art.titulo} (ID: ${art.id})`);
      });
    }
    
    // Listar todos los artículos con detalles
    console.log('\n\n📄 Todos los artículos:');
    console.log('='.repeat(60));
    const todosLosArticulos = await prisma.articulo.findMany({
      include: {
        categoria: {
          select: {
            id: true,
            nombre: true
          }
        },
        creadoPor: {
          select: {
            id: true,
            nombre: true,
            username: true
          }
        }
      },
      orderBy: { creadoEn: 'desc' }
    });
    
    if (todosLosArticulos.length === 0) {
      console.log('⚠️  No hay artículos en la base de datos');
    } else {
      todosLosArticulos.forEach((art, index) => {
        console.log(`\n${index + 1}. ${art.titulo}`);
        console.log(`   ID: ${art.id}`);
        console.log(`   Categoría: ${art.categoria ? art.categoria.nombre : 'Sin categoría'} (ID: ${art.categoriaId})`);
        console.log(`   Creado por: ${art.creadoPor ? art.creadoPor.nombre : 'Desconocido'} (${art.creadoPor ? art.creadoPor.username : 'N/A'})`);
        console.log(`   Fecha: ${art.creadoEn}`);
        console.log(`   Contenido: ${art.contenido.substring(0, 100)}...`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error al verificar procedimientos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verificarProcedimientos();


