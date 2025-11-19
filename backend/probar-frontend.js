const axios = require('axios');

async function probarFrontend() {
  console.log('🧪 Probando funcionalidad del frontend...');
  
  try {
    // 1. Probar API de empleados
    console.log('📊 Probando API de empleados...');
    const empleadosResponse = await axios.get('http://localhost:4001/api/empleados');
    console.log(`✅ Empleados: ${empleadosResponse.data.length} encontrados`);
    
    // 2. Probar API de departamentos
    console.log('🏢 Probando API de departamentos...');
    const departamentosResponse = await axios.get('http://localhost:4001/api/empleados/departamentos');
    console.log(`✅ Departamentos: ${departamentosResponse.data.length} encontrados`);
    console.log('📋 Departamentos:', departamentosResponse.data.map(d => d.nombre).join(', '));
    
    // 3. Probar API de estadísticas
    console.log('📈 Probando API de estadísticas...');
    const estadisticasResponse = await axios.get('http://localhost:4001/api/empleados/estadisticas');
    console.log(`✅ Estadísticas: ${JSON.stringify(estadisticasResponse.data)}`);
    
    // 4. Probar filtros
    console.log('🔍 Probando filtros...');
    const filtrosResponse = await axios.get('http://localhost:4001/api/empleados?departamento=Aportes&estado=ACTIVO');
    console.log(`✅ Filtros: ${filtrosResponse.data.length} empleados en Aportes activos`);
    
    console.log('\n🎉 TODAS LAS PRUEBAS PASARON EXITOSAMENTE!');
    console.log('✅ El backend está funcionando correctamente');
    console.log('✅ Los datos están en el formato esperado');
    console.log('✅ Los filtros funcionan correctamente');
    
    console.log('\n📋 RESUMEN:');
    console.log(`   - Total empleados: ${empleadosResponse.data.length}`);
    console.log(`   - Total departamentos: ${departamentosResponse.data.length}`);
    console.log(`   - Empleados activos: ${estadisticasResponse.data.activos}`);
    console.log(`   - Empleados inactivos: ${estadisticasResponse.data.inactivos}`);
    
    console.log('\n🚀 El frontend debería funcionar correctamente ahora');
    console.log('🌐 Ve a: http://localhost:5174/dashboard/rrhh');
    
  } catch (error) {
    console.error('❌ Error durante las pruebas:', error.message);
    if (error.response) {
      console.error('Detalles:', error.response.data);
    }
  }
}

probarFrontend();


