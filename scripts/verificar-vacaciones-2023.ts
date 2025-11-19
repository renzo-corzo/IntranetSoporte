import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Obtener todas las vacaciones
    const vacaciones = await prisma.vacacion.findMany({
      include: {
        empleado: {
          select: {
            nombre: true,
            apellido: true
          }
        }
      },
      orderBy: {
        fechaInicio: 'asc'
      }
    });

    console.log('Total vacaciones:', vacaciones.length);
    console.log('\nVacaciones:');
    
    vacaciones.forEach(v => {
      const fechaInicio = v.fechaInicio.toISOString().split('T')[0];
      const fechaFin = v.fechaFin.toISOString().split('T')[0];
      const año = v.fechaInicio.getFullYear();
      console.log(`- ${v.empleado.nombre} ${v.empleado.apellido}: ${fechaInicio} a ${fechaFin} - Estado: ${v.estado} - Año: ${año}`);
    });

    // Verificar vacaciones de 2023
    const vacaciones2023 = vacaciones.filter(v => {
      const año = v.fechaInicio.getFullYear();
      return año === 2023;
    });

    console.log(`\nVacaciones de 2023: ${vacaciones2023.length}`);
    vacaciones2023.forEach(v => {
      const fechaInicio = v.fechaInicio.toISOString().split('T')[0];
      const fechaFin = v.fechaFin.toISOString().split('T')[0];
      console.log(`- ${v.empleado.nombre} ${v.empleado.apellido}: ${fechaInicio} a ${fechaFin} - Estado: ${v.estado}`);
    });

    // Probar el filtro que usa el backend
    const fechaInicioFiltro = new Date('2023-01-01');
    fechaInicioFiltro.setHours(0, 0, 0, 0);
    const fechaFinFiltro = new Date('2023-12-31');
    fechaFinFiltro.setHours(23, 59, 59, 999);

    console.log('\nProbando filtro del backend:');
    console.log('Fecha inicio filtro:', fechaInicioFiltro.toISOString());
    console.log('Fecha fin filtro:', fechaFinFiltro.toISOString());

    const vacacionesFiltradas = await prisma.vacacion.findMany({
      where: {
        AND: [
          { fechaInicio: { lte: fechaFinFiltro } },
          { fechaFin: { gte: fechaInicioFiltro } }
        ]
      },
      include: {
        empleado: {
          select: {
            nombre: true,
            apellido: true
          }
        }
      }
    });

    console.log(`\nVacaciones encontradas con filtro: ${vacacionesFiltradas.length}`);
    vacacionesFiltradas.forEach(v => {
      const fechaInicio = v.fechaInicio.toISOString().split('T')[0];
      const fechaFin = v.fechaFin.toISOString().split('T')[0];
      console.log(`- ${v.empleado.nombre} ${v.empleado.apellido}: ${fechaInicio} a ${fechaFin} - Estado: ${v.estado}`);
    });

  } catch (error: any) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();

