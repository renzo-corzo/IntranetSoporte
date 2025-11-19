const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function crearVacacionTest() {
  try {
    console.log('🔍 Buscando empleados...');
    const empleados = await prisma.empleado.findMany({ take: 1 });
    
    if (empleados.length === 0) {
      console.log('❌ No hay empleados en la base de datos');
      return;
    }
    
    const empleado = empleados[0];
    console.log(`✅ Empleado encontrado: ${empleado.nombre} ${empleado.apellido}`);
    
    console.log('📅 Creando solicitud de vacaciones...');
    const vacacion = await prisma.vacacion.create({
      data: {
        empleadoId: empleado.id,
        fechaInicio: new Date('2025-10-30'),
        fechaFin: new Date('2025-11-01'),
        diasSolicitados: 2,
        observaciones: 'Vacaciones de prueba',
        estado: 'PENDIENTE'
      }
    });
    
    console.log('✅ Vacación creada:', vacacion);
    
    console.log('🔍 Verificando vacaciones...');
    const vacaciones = await prisma.vacacion.findMany({
      include: {
        empleado: {
          select: {
            nombre: true,
            apellido: true,
            departamento: true
          }
        }
      }
    });
    
    console.log('📋 Total de vacaciones:', vacaciones.length);
    vacaciones.forEach(v => {
      console.log(`- ${v.empleado.nombre} ${v.empleado.apellido}: ${v.fechaInicio.toISOString().split('T')[0]} a ${v.fechaFin.toISOString().split('T')[0]} (${v.estado})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

crearVacacionTest();


