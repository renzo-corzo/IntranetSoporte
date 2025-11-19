const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function identificarDuplicados() {
  try {
    console.log('🔍 Identificando empleados duplicados...');
    
    // Conectar a la base de datos
    await prisma.$connect();
    console.log('✅ Conectado a la base de datos');

    // Buscar duplicados por nombre y apellido
    const empleados = await prisma.empleado.findMany({
      orderBy: [
        { nombre: 'asc' },
        { apellido: 'asc' }
      ]
    });

    console.log(`📋 Total de empleados en la base de datos: ${empleados.length}`);

    // Agrupar por nombre completo
    const grupos = {};
    empleados.forEach(empleado => {
      const nombreCompleto = `${empleado.nombre} ${empleado.apellido}`.toUpperCase();
      if (!grupos[nombreCompleto]) {
        grupos[nombreCompleto] = [];
      }
      grupos[nombreCompleto].push(empleado);
    });

    // Identificar duplicados
    const duplicados = {};
    Object.keys(grupos).forEach(nombre => {
      if (grupos[nombre].length > 1) {
        duplicados[nombre] = grupos[nombre];
      }
    });

    console.log('\n🔍 EMPLEADOS DUPLICADOS ENCONTRADOS:');
    console.log('=====================================');

    let totalDuplicados = 0;
    Object.keys(duplicados).forEach(nombre => {
      const empleadosDuplicados = duplicados[nombre];
      totalDuplicados += empleadosDuplicados.length;
      
      console.log(`\n👥 ${nombre} (${empleadosDuplicados.length} registros):`);
      empleadosDuplicados.forEach((emp, index) => {
        console.log(`   ${index + 1}. ID: ${emp.id}`);
        console.log(`      DNI: ${emp.dni}`);
        console.log(`      Email: ${emp.email}`);
        console.log(`      Departamento: ${emp.departamento}`);
        console.log(`      Fecha ingreso: ${emp.fechaIngreso.toLocaleDateString('es-AR')}`);
        console.log(`      Fecha creación: ${emp.createdAt.toLocaleString('es-AR')}`);
        console.log(`      Última actualización: ${emp.updatedAt.toLocaleString('es-AR')}`);
        console.log('');
      });
    });

    console.log(`\n📊 RESUMEN:`);
    console.log(`   Total empleados: ${empleados.length}`);
    console.log(`   Empleados únicos: ${Object.keys(grupos).length}`);
    console.log(`   Registros duplicados: ${totalDuplicados}`);
    console.log(`   Grupos con duplicados: ${Object.keys(duplicados).length}`);

    // Crear archivo de reporte
    const fs = require('fs');
    const path = require('path');
    
    const exportDir = path.join(__dirname, 'exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const filename = `reporte_duplicados_${timestamp}.json`;
    const filepath = path.join(exportDir, filename);

    const reporte = {
      fechaReporte: new Date().toISOString(),
      totalEmpleados: empleados.length,
      empleadosUnicos: Object.keys(grupos).length,
      registrosDuplicados: totalDuplicados,
      gruposConDuplicados: Object.keys(duplicados).length,
      duplicados: duplicados
    };

    fs.writeFileSync(filepath, JSON.stringify(reporte, null, 2), 'utf8');
    console.log(`\n📁 Reporte guardado en: ${filepath}`);

    return duplicados;

  } catch (error) {
    console.error('❌ Error al identificar duplicados:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Desconectado de la base de datos');
  }
}

// Ejecutar identificación
if (require.main === module) {
  identificarDuplicados()
    .then(() => {
      console.log('\n🎉 Identificación de duplicados completada!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Error en la identificación:', error);
      process.exit(1);
    });
}

module.exports = { identificarDuplicados };


