const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function exportarEmpleadosReales() {
  try {
    console.log('🔍 Conectando a la base de datos...');
    
    // Conectar a la base de datos
    await prisma.$connect();
    console.log('✅ Conectado a la base de datos');

    // Obtener todos los empleados reales
    console.log('📊 Obteniendo empleados de la base de datos...');
    const empleados = await prisma.empleado.findMany({
      orderBy: [
        { departamento: 'asc' },
        { apellido: 'asc' },
        { nombre: 'asc' }
      ]
    });

    console.log(`📋 Encontrados ${empleados.length} empleados`);

    // Obtener estadísticas por departamento
    const estadisticasPorDepartamento = await prisma.empleado.groupBy({
      by: ['departamento'],
      _count: {
        id: true,
      },
      where: {
        estado: 'ACTIVO'
      },
      orderBy: {
        departamento: 'asc'
      }
    });

    // Crear objeto de exportación
    const datosExportacion = {
      fechaExportacion: new Date().toISOString(),
      totalEmpleados: empleados.length,
      empleadosActivos: empleados.filter(e => e.estado === 'ACTIVO').length,
      empleadosInactivos: empleados.filter(e => e.estado === 'INACTIVO').length,
      estadisticasPorDepartamento: estadisticasPorDepartamento.reduce((acc, stat) => {
        acc[stat.departamento] = stat._count.id;
        return acc;
      }, {}),
      empleados: empleados.map(empleado => ({
        id: empleado.id,
        nombre: empleado.nombre,
        apellido: empleado.apellido,
        nombreCompleto: `${empleado.nombre} ${empleado.apellido}`,
        dni: empleado.dni,
        email: empleado.email,
        departamento: empleado.departamento,
        estado: empleado.estado,
        fechaIngreso: empleado.fechaIngreso,
        diasDisponibles: empleado.diasDisponibles,
        fechaCreacion: empleado.createdAt,
        fechaActualizacion: empleado.updatedAt
      }))
    };

    // Crear directorio de exportación si no existe
    const exportDir = path.join(__dirname, 'exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    // Generar nombre de archivo con timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const filename = `empleados_reales_${timestamp}.json`;
    const filepath = path.join(exportDir, filename);

    // Exportar a JSON
    fs.writeFileSync(filepath, JSON.stringify(datosExportacion, null, 2), 'utf8');
    console.log(`✅ Empleados exportados a: ${filepath}`);

    // Crear archivo CSV también
    const csvFilename = `empleados_reales_${timestamp}.csv`;
    const csvFilepath = path.join(exportDir, csvFilename);
    
    const csvHeader = 'ID,Nombre,Apellido,Nombre Completo,DNI,Email,Departamento,Estado,Fecha Ingreso,Días Disponibles,Fecha Creación,Fecha Actualización\n';
    const csvRows = empleados.map(emp => 
      `${emp.id},"${emp.nombre}","${emp.apellido}","${emp.nombre} ${emp.apellido}","${emp.dni}","${emp.email}","${emp.departamento}","${emp.estado}","${emp.fechaIngreso.toISOString().split('T')[0]}",${emp.diasDisponibles},"${emp.createdAt.toISOString()}","${emp.updatedAt.toISOString()}"`
    ).join('\n');
    
    fs.writeFileSync(csvFilepath, csvHeader + csvRows, 'utf8');
    console.log(`✅ Empleados exportados a CSV: ${csvFilepath}`);

    // Mostrar resumen en consola
    console.log('\n📊 RESUMEN DE EXPORTACIÓN:');
    console.log('========================');
    console.log(`📋 Total de empleados: ${datosExportacion.totalEmpleados}`);
    console.log(`✅ Empleados activos: ${datosExportacion.empleadosActivos}`);
    console.log(`❌ Empleados inactivos: ${datosExportacion.empleadosInactivos}`);
    console.log('\n📈 Por departamento:');
    Object.entries(datosExportacion.estadisticasPorDepartamento).forEach(([dept, count]) => {
      console.log(`   ${dept}: ${count} empleados`);
    });

    console.log('\n📁 Archivos generados:');
    console.log(`   JSON: ${filepath}`);
    console.log(`   CSV: ${csvFilepath}`);

    return datosExportacion;

  } catch (error) {
    console.error('❌ Error al exportar empleados:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Desconectado de la base de datos');
  }
}

// Ejecutar exportación
if (require.main === module) {
  exportarEmpleadosReales()
    .then(() => {
      console.log('\n🎉 Exportación completada exitosamente!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Error en la exportación:', error);
      process.exit(1);
    });
}

module.exports = { exportarEmpleadosReales };


