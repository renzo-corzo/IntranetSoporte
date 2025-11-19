import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Función para calcular años de antigüedad
const calcularAniosAntiguedad = (fechaIngreso: Date): number => {
  const hoy = new Date();
  const anios = hoy.getFullYear() - fechaIngreso.getFullYear();
  const meses = hoy.getMonth() - fechaIngreso.getMonth();
  if (meses < 0 || (meses === 0 && hoy.getDate() < fechaIngreso.getDate())) {
    return anios - 1;
  }
  return anios;
};

// Función para calcular días acumulados desde 2023
const calcularDiasAcumuladosDesde2023 = (fechaIngreso: Date, diasBase2023: number): number => {
  const anioInicio = 2023;
  const anioActual = new Date().getFullYear();
  let diasAcumulados = diasBase2023;
  
  for (let anio = anioInicio; anio <= anioActual; anio++) {
    const fechaReferencia = new Date(anio, 0, 1);
    
    if (fechaIngreso <= fechaReferencia) {
      const aniosAntiguedad = anio - fechaIngreso.getFullYear();
      const fechaIngresoAnio = fechaIngreso.getFullYear();
      const fechaIngresoMes = fechaIngreso.getMonth();
      const fechaIngresoDia = fechaIngreso.getDate();
      
      let aniosReales = aniosAntiguedad;
      if (anio > fechaIngresoAnio && (fechaIngresoMes > 0 || fechaIngresoDia > 1)) {
        aniosReales = aniosAntiguedad - 1;
      }
      
      let diasAnuales: number;
      if (aniosReales < 5) {
        diasAnuales = 15;
      } else if (aniosReales < 10) {
        diasAnuales = 21;
      } else {
        diasAnuales = 27;
      }
      diasAcumulados += diasAnuales;
    }
  }
  
  return diasAcumulados;
};

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
            diasSolicitados: true
          }
        }
      }
    });

    if (!empleado) {
      console.log('Empleado no encontrado');
      return;
    }

    if (empleado.diasBase2023 === null || empleado.diasBase2023 === undefined) {
      console.log('⚠️ El empleado no tiene diasBase2023 configurado');
      return;
    }

    // Calcular días acumulados
    const diasAcumulados = calcularDiasAcumuladosDesde2023(empleado.fechaIngreso, empleado.diasBase2023);
    
    // Obtener días usados
    const diasUsados = empleado.vacaciones.reduce((sum, v) => sum + v.diasSolicitados, 0);
    
    // Calcular días disponibles correctos
    const diasDisponiblesCorrectos = diasAcumulados - diasUsados;

    console.log('Empleado:', empleado.nombre, empleado.apellido);
    console.log('Días base 2023:', empleado.diasBase2023);
    console.log('Días acumulados desde 2023:', diasAcumulados);
    console.log('Días usados (vacaciones aprobadas):', diasUsados);
    console.log('Días disponibles actuales:', empleado.diasDisponibles);
    console.log('Días disponibles correctos:', diasDisponiblesCorrectos);
    console.log('Diferencia:', diasDisponiblesCorrectos - empleado.diasDisponibles);

    // Actualizar días disponibles
    await prisma.empleado.update({
      where: { id: empleado.id },
      data: {
        diasDisponibles: diasDisponiblesCorrectos
      }
    });

    console.log('\n✅ Días disponibles actualizados correctamente');
  } catch (error: any) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();

