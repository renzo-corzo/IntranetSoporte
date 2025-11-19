const axios = require('axios');

async function exportarEmpleadosDesdeAPI() {
  try {
    console.log('🔍 Conectando a la API del sistema...');
    
    // URL de la API
    const apiUrl = 'http://localhost:4001/api';
    
    // Verificar que la API esté funcionando
    console.log('📡 Verificando conexión con la API...');
    const healthResponse = await axios.get(`${apiUrl.replace('/api', '')}/health`);
    console.log('✅ API funcionando:', healthResponse.data.status);

    // Obtener empleados
    console.log('📊 Obteniendo empleados...');
    const empleadosResponse = await axios.get(`${apiUrl}/empleados`);
    const empleados = empleadosResponse.data;
    
    console.log(`📋 Encontrados ${empleados.length} empleados`);

    // Obtener departamentos
    console.log('🏢 Obteniendo departamentos...');
    const departamentosResponse = await axios.get(`${apiUrl}/empleados/departamentos`);
    const departamentos = departamentosResponse.data;
    
    console.log(`🏢 Encontrados ${departamentos.length} departamentos`);

    // Obtener estadísticas
    console.log('📈 Obteniendo estadísticas...');
    const estadisticasResponse = await axios.get(`${apiUrl}/empleados/estadisticas`);
    const estadisticas = estadisticasResponse.data;

    // Crear objeto de exportación
    const datosExportacion = {
      fechaExportacion: new Date().toISOString(),
      fuente: 'API del Sistema Infraestructura Caja de Abogados',
      totalEmpleados: empleados.length,
      estadisticas: estadisticas,
      departamentos: departamentos,
      empleados: empleados.map(empleado => ({
        id: empleado.id,
        nombre: empleado.nombre,
        apellido: empleado.apellido || '',
        nombreCompleto: `${empleado.nombre} ${empleado.apellido || ''}`.trim(),
        dni: empleado.dni || '',
        email: empleado.email,
        departamento: empleado.departamento,
        estado: empleado.estado,
        fechaIngreso: empleado.fechaIngreso,
        diasDisponibles: empleado.diasDisponibles || 0,
        vacaciones: empleado.vacaciones || [],
        licencias: empleado.licencias || [],
        documentos: empleado.documentos || []
      }))
    };

    // Crear directorio de exportación
    const fs = require('fs');
    const path = require('path');
    
    const exportDir = path.join(__dirname, 'exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    // Generar nombre de archivo con timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const filename = `empleados_reales_api_${timestamp}.json`;
    const filepath = path.join(exportDir, filename);

    // Exportar a JSON
    fs.writeFileSync(filepath, JSON.stringify(datosExportacion, null, 2), 'utf8');
    console.log(`✅ Empleados exportados a: ${filepath}`);

    // Crear archivo CSV también
    const csvFilename = `empleados_reales_api_${timestamp}.csv`;
    const csvFilepath = path.join(exportDir, csvFilename);
    
    const csvHeader = 'ID,Nombre,Apellido,Nombre Completo,DNI,Email,Departamento,Estado,Fecha Ingreso,Días Disponibles,Vacaciones,Licencias,Documentos\n';
    const csvRows = empleados.map(emp => 
      `${emp.id},"${emp.nombre}","${emp.apellido || ''}","${emp.nombre} ${emp.apellido || ''}".trim(),"${emp.dni || ''}","${emp.email}","${emp.departamento}","${emp.estado}","${emp.fechaIngreso || ''}",${emp.diasDisponibles || 0},"${(emp.vacaciones || []).length}","${(emp.licencias || []).length}","${(emp.documentos || []).length}"`
    ).join('\n');
    
    fs.writeFileSync(csvFilepath, csvHeader + csvRows, 'utf8');
    console.log(`✅ Empleados exportados a CSV: ${csvFilepath}`);

    // Mostrar resumen en consola
    console.log('\n📊 RESUMEN DE EXPORTACIÓN:');
    console.log('========================');
    console.log(`📋 Total de empleados: ${datosExportacion.totalEmpleados}`);
    console.log(`📈 Estadísticas:`, estadisticas);
    console.log(`🏢 Departamentos:`, departamentos.map(d => d.nombre).join(', '));

    console.log('\n📁 Archivos generados:');
    console.log(`   JSON: ${filepath}`);
    console.log(`   CSV: ${csvFilepath}`);

    return datosExportacion;

  } catch (error) {
    console.error('❌ Error al exportar empleados:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
    throw error;
  }
}

// Ejecutar exportación
if (require.main === module) {
  exportarEmpleadosDesdeAPI()
    .then(() => {
      console.log('\n🎉 Exportación completada exitosamente!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Error en la exportación:', error.message);
      process.exit(1);
    });
}

module.exports = { exportarEmpleadosDesdeAPI };


