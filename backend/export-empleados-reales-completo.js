const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function exportarEmpleadosRealesCompletos() {
  try {
    console.log('🔍 Conectando directamente a la base de datos...');
    
    // Conectar a la base de datos
    await prisma.$connect();
    console.log('✅ Conectado a la base de datos PostgreSQL');

    // Obtener TODOS los empleados reales de la base de datos
    console.log('📊 Obteniendo TODOS los empleados de la base de datos...');
    const empleados = await prisma.empleado.findMany({
      orderBy: [
        { departamento: 'asc' },
        { apellido: 'asc' },
        { nombre: 'asc' }
      ]
    });

    console.log(`📋 Encontrados ${empleados.length} empleados REALES en la base de datos`);

    // Obtener estadísticas detalladas
    const estadisticasActivos = await prisma.empleado.count({
      where: { estado: 'ACTIVO' }
    });
    
    const estadisticasInactivos = await prisma.empleado.count({
      where: { estado: 'INACTIVO' }
    });

    // Estadísticas por departamento
    const estadisticasPorDepartamento = await prisma.empleado.groupBy({
      by: ['departamento'],
      _count: {
        id: true,
      },
      orderBy: {
        departamento: 'asc'
      }
    });

    // Crear objeto de exportación completo
    const datosExportacion = {
      fechaExportacion: new Date().toISOString(),
      fuente: 'Base de Datos PostgreSQL - Sistema Infraestructura Caja de Abogados',
      totalEmpleados: empleados.length,
      empleadosActivos: estadisticasActivos,
      empleadosInactivos: estadisticasInactivos,
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

    // Crear directorio de exportación
    const exportDir = path.join(__dirname, 'exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    // Generar nombre de archivo con timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const filename = `empleados_reales_bd_${timestamp}.json`;
    const filepath = path.join(exportDir, filename);

    // Exportar a JSON
    fs.writeFileSync(filepath, JSON.stringify(datosExportacion, null, 2), 'utf8');
    console.log(`✅ Empleados REALES exportados a: ${filepath}`);

    // Crear archivo CSV detallado
    const csvFilename = `empleados_reales_bd_${timestamp}.csv`;
    const csvFilepath = path.join(exportDir, csvFilename);
    
    const csvHeader = 'ID,Nombre,Apellido,Nombre Completo,DNI,Email,Departamento,Estado,Fecha Ingreso,Días Disponibles,Fecha Creación,Fecha Actualización\n';
    const csvRows = empleados.map(emp => 
      `${emp.id},"${emp.nombre}","${emp.apellido}","${emp.nombre} ${emp.apellido}","${emp.dni}","${emp.email}","${emp.departamento}","${emp.estado}","${emp.fechaIngreso.toISOString().split('T')[0]}",${emp.diasDisponibles},"${emp.createdAt.toISOString()}","${emp.updatedAt.toISOString()}"`
    ).join('\n');
    
    fs.writeFileSync(csvFilepath, csvHeader + csvRows, 'utf8');
    console.log(`✅ Empleados REALES exportados a CSV: ${csvFilepath}`);

    // Crear archivo de texto legible
    const txtFilename = `empleados_reales_bd_${timestamp}.txt`;
    const txtFilepath = path.join(exportDir, txtFilename);
    
    let txtContent = `LISTADO COMPLETO DE EMPLEADOS - INFRAESTRUCTURA CAJA DE ABOGADOS\n`;
    txtContent += `================================================================\n\n`;
    txtContent += `Fecha de exportación: ${new Date().toLocaleString('es-AR')}\n`;
    txtContent += `Total de empleados: ${empleados.length}\n`;
    txtContent += `Empleados activos: ${estadisticasActivos}\n`;
    txtContent += `Empleados inactivos: ${estadisticasInactivos}\n\n`;
    
    txtContent += `ESTADÍSTICAS POR DEPARTAMENTO:\n`;
    txtContent += `----------------------------\n`;
    estadisticasPorDepartamento.forEach(stat => {
      txtContent += `${stat.departamento}: ${stat._count.id} empleados\n`;
    });
    
    txtContent += `\nLISTADO DETALLADO DE EMPLEADOS:\n`;
    txtContent += `==============================\n\n`;
    
    empleados.forEach((emp, index) => {
      txtContent += `${index + 1}. ${emp.nombre} ${emp.apellido}\n`;
      txtContent += `   DNI: ${emp.dni}\n`;
      txtContent += `   Email: ${emp.email}\n`;
      txtContent += `   Departamento: ${emp.departamento}\n`;
      txtContent += `   Estado: ${emp.estado}\n`;
      txtContent += `   Fecha de ingreso: ${emp.fechaIngreso.toLocaleDateString('es-AR')}\n`;
      txtContent += `   Días disponibles: ${emp.diasDisponibles}\n`;
      txtContent += `   Fecha de creación: ${emp.createdAt.toLocaleString('es-AR')}\n`;
      txtContent += `   Última actualización: ${emp.updatedAt.toLocaleString('es-AR')}\n\n`;
    });
    
    fs.writeFileSync(txtFilepath, txtContent, 'utf8');
    console.log(`✅ Empleados REALES exportados a texto: ${txtFilepath}`);

    // Mostrar resumen detallado en consola
    console.log('\n📊 RESUMEN COMPLETO DE EXPORTACIÓN:');
    console.log('=====================================');
    console.log(`📋 Total de empleados REALES: ${datosExportacion.totalEmpleados}`);
    console.log(`✅ Empleados activos: ${datosExportacion.empleadosActivos}`);
    console.log(`❌ Empleados inactivos: ${datosExportacion.empleadosInactivos}`);
    console.log('\n📈 Por departamento:');
    Object.entries(datosExportacion.estadisticasPorDepartamento).forEach(([dept, count]) => {
      console.log(`   ${dept}: ${count} empleados`);
    });

    console.log('\n👥 LISTADO DE EMPLEADOS:');
    console.log('========================');
    empleados.forEach((emp, index) => {
      console.log(`${index + 1}. ${emp.nombre} ${emp.apellido} (${emp.departamento}) - ${emp.estado}`);
    });

    console.log('\n📁 Archivos generados:');
    console.log(`   JSON: ${filepath}`);
    console.log(`   CSV: ${csvFilepath}`);
    console.log(`   TXT: ${txtFilepath}`);

    return datosExportacion;

  } catch (error) {
    console.error('❌ Error al exportar empleados REALES:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Desconectado de la base de datos');
  }
}

// Ejecutar exportación
if (require.main === module) {
  exportarEmpleadosRealesCompletos()
    .then(() => {
      console.log('\n🎉 Exportación de empleados REALES completada exitosamente!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Error en la exportación:', error);
      process.exit(1);
    });
}

module.exports = { exportarEmpleadosRealesCompletos };


