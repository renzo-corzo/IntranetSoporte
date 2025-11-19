import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const empleado = await prisma.empleado.findFirst({
      where: {
        nombre: { contains: 'GISEL', mode: 'insensitive' }
      },
      include: {
        vacaciones: {
          where: { estado: 'APROBADA' },
          select: {
            diasSolicitados: true,
            fechaInicio: true,
            fechaFin: true,
            estado: true
          }
        }
      }
    });

    if (empleado) {
      console.log('Empleado:', empleado.nombre, empleado.apellido);
      console.log('Días base 2023:', empleado.diasBase2023);
      console.log('Días disponibles actuales:', empleado.diasDisponibles);
      console.log('Fecha ingreso:', empleado.fechaIngreso.toISOString().split('T')[0]);
      console.log('Vacaciones aprobadas:', empleado.vacaciones.length);
      
      const diasUsados = empleado.vacaciones.reduce((sum, v) => sum + v.diasSolicitados, 0);
      console.log('Días usados (aprobadas):', diasUsados);
      
      console.log('\nVacaciones aprobadas:');
      empleado.vacaciones.forEach((v, i) => {
        console.log(`  ${i + 1}. ${v.fechaInicio.toISOString().split('T')[0]} - ${v.fechaFin.toISOString().split('T')[0]}: ${v.diasSolicitados} días`);
      });
      
      console.log('\nCálculo esperado:');
      if (empleado.diasBase2023 !== null && empleado.diasBase2023 !== undefined) {
        console.log('  Días base 2023:', empleado.diasBase2023);
        // Calcular días acumulados (simplificado)
        const anioActual = new Date().getFullYear();
        const aniosDesde2023 = anioActual - 2023 + 1;
        console.log('  Años desde 2023:', aniosDesde2023);
        // Asumiendo >= 10 años (27 días por año)
        const diasAcumulados = empleado.diasBase2023 + (aniosDesde2023 * 27);
        console.log('  Días acumulados estimados:', diasAcumulados);
        console.log('  Días usados:', diasUsados);
        console.log('  Días disponibles esperados:', diasAcumulados - diasUsados);
        console.log('  Días disponibles actuales:', empleado.diasDisponibles);
        console.log('  Diferencia:', (diasAcumulados - diasUsados) - empleado.diasDisponibles);
      } else {
        console.log('  ⚠️ No tiene diasBase2023 configurado');
        console.log('  Los 69 días NO incluyen el cálculo automático');
      }
    } else {
      console.log('Empleado no encontrado');
    }
  } catch (error: any) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();

