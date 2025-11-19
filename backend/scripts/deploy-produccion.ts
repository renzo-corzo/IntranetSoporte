import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

async function deployProduccion() {
  console.log('🚀 Iniciando deploy a producción...');

  try {
    // 1. Verificar conexión a base de datos
    console.log('📡 Verificando conexión a base de datos...');
    await prisma.$connect();
    console.log('✅ Conexión a base de datos exitosa');

    // 2. Aplicar migraciones
    console.log('🔄 Aplicando migraciones de base de datos...');
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    console.log('✅ Migraciones aplicadas');

    // 3. Generar cliente Prisma
    console.log('🔧 Generando cliente Prisma...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    console.log('✅ Cliente Prisma generado');

    // 4. Verificar que las tablas del módulo de stock existan
    console.log('🔍 Verificando tablas del módulo de stock...');
    
    const tablas = [
      'CategoriaStock',
      'UnidadMedida', 
      'ProveedorStock',
      'UbicacionStock',
      'ProductoStock',
      'TipoMovimiento',
      'MovimientoStock',
      'AlertaStock',
      'ReporteStock'
    ];

    for (const tabla of tablas) {
      try {
        await (prisma as any)[tabla.charAt(0).toLowerCase() + tabla.slice(1)].findFirst();
        console.log(`  ✅ Tabla ${tabla} existe y es accesible`);
      } catch (error) {
        console.log(`  ❌ Error con tabla ${tabla}:`, error);
        throw new Error(`Tabla ${tabla} no encontrada o inaccesible`);
      }
    }

    // 5. Ejecutar seed si las tablas están vacías
    console.log('🌱 Verificando datos iniciales...');
    
    const categorias = await prisma.categoriaStock.count();
    const unidades = await prisma.unidadMedida.count();
    const tiposMovimiento = await prisma.tipoMovimiento.count();

    if (categorias === 0 || unidades === 0 || tiposMovimiento === 0) {
      console.log('📦 Ejecutando seed de datos iniciales...');
      execSync('npx ts-node prisma/seed-stock.ts', { stdio: 'inherit' });
      console.log('✅ Datos iniciales cargados');
    } else {
      console.log('✅ Datos iniciales ya existen');
    }

    // 6. Compilar TypeScript
    console.log('🔨 Compilando TypeScript...');
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ Compilación exitosa');

    console.log('\n🎉 ¡Deploy completado exitosamente!');
    console.log('\n📋 Resumen:');
    console.log('  - Base de datos migrada ✅');
    console.log('  - Cliente Prisma generado ✅');
    console.log('  - Tablas verificadas ✅');
    console.log('  - Datos iniciales verificados ✅');
    console.log('  - Código compilado ✅');
    console.log('\n🚀 El módulo de Stock está listo para producción');

  } catch (error) {
    console.error('❌ Error durante el deploy:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

deployProduccion();


