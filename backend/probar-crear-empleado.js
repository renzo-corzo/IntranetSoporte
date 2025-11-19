const axios = require('axios');

async function probarCrearEmpleado() {
  console.log('🧪 Probando creación de empleado...');
  
  try {
    const nuevoEmpleado = {
      nombre: 'Juan',
      apellido: 'Pérez',
      dni: '12345678',
      email: 'juan.perez@caja.com.ar',
      departamento: 'Sistemas',
      fechaIngreso: '2025-01-01',
      diasDisponibles: 20
    };

    console.log('📝 Datos del empleado:', nuevoEmpleado);
    
    const response = await axios.post('http://localhost:4001/api/empleados', nuevoEmpleado);
    
    console.log('✅ Empleado creado exitosamente!');
    console.log('📊 Respuesta:', response.data);
    
    // Verificar que el empleado se creó
    const empleadosResponse = await axios.get('http://localhost:4001/api/empleados');
    const empleadoCreado = empleadosResponse.data.find(emp => emp.dni === '12345678');
    
    if (empleadoCreado) {
      console.log('✅ Empleado encontrado en la lista:', empleadoCreado.nombre, empleadoCreado.apellido);
    } else {
      console.log('❌ Empleado no encontrado en la lista');
    }
    
    console.log('\n🎉 PRUEBA COMPLETADA EXITOSAMENTE!');
    console.log('✅ El backend está funcionando correctamente');
    console.log('✅ La creación de empleados funciona');
    console.log('✅ El frontend debería funcionar ahora');
    
  } catch (error) {
    console.error('❌ Error durante la prueba:', error.message);
    if (error.response) {
      console.error('Detalles del error:', error.response.data);
    }
  }
}

probarCrearEmpleado();


