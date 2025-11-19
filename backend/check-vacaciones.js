const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkVacaciones() {
  try {
    console.log('🔍 Verificando vacaciones en la base de datos...');
    
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
    
    console.log(`📊 Total de vacaciones: ${vacaciones.length}`);
    
    if (vacaciones.length > 0) {
      console.log('📋 Vacaciones encontradas:');
      vacaciones.forEach((v, i) => {
        console.log(`${i + 1}. ${v.empleado.nombre} ${v.empleado.apellido} - ${v.fechaInicio.toISOString().split('T')[0]} a ${v.fechaFin.toISOString().split('T')[0]} (${v.estado})`);
      });
    } else {
      console.log('❌ No hay vacaciones en la base de datos');
      
      // Verificar si hay empleados
      const empleados = await prisma.empleado.findMany({ take: 3 });
      console.log(`👥 Empleados disponibles: ${empleados.length}`);
      if (empleados.length > 0) {
        console.log('Primeros empleados:');
        empleados.forEach((e, i) => {
          console.log(`${i + 1}. ${e.nombre} ${e.apellido} (${e.departamento})`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkVacaciones();


