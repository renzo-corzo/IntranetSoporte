import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const empleados = [
  { nombre: 'GISELLA BORNANCINI', departamento: 'Contaduría' },
  { nombre: 'PEDRO CAMPOS', departamento: 'Secretaría' },
  { nombre: 'STEFANO CASTRO GASCH', departamento: 'Sistemas' },
  { nombre: 'MARCOS CEBALLOS', departamento: 'Aportes' },
  { nombre: 'RENZO CORZO', departamento: 'Sistemas' },
  { nombre: 'MAGDALENA CORNET', departamento: 'Asesoría de Letrado' },
  { nombre: 'WALTER COUGUET', departamento: 'Servicio Médico' },
  { nombre: 'ALEJANDRO JUAREZ', departamento: 'Secretaría' },
  { nombre: 'FEDERICO LASCANO', departamento: 'Aportes' },
  { nombre: 'SOLEDAD LOPEZ', departamento: 'Secretaría' },
  { nombre: 'MARIA DOLORES MAGARZO', departamento: 'Aportes' },
  { nombre: 'DIEGO MARCHESE', departamento: 'Servicio Médico' },
  { nombre: 'JORGELINA MARINZALDA', departamento: 'Aportes' },
  { nombre: 'INES MARTINEZ', departamento: 'Aportes' },
  { nombre: 'KARINA MILLAN', departamento: 'Servicio Médico' },
  { nombre: 'DANIEL MUZO', departamento: 'Contaduría' },
  { nombre: 'JORGE ONOFRI', departamento: 'Servicio Médico' },
  { nombre: 'STELLA MARIS PANUNTIN', departamento: 'Contaduría' },
  { nombre: 'IGNACIO PRADA', departamento: 'Contaduría' },
  { nombre: 'MARTIN PUMO', departamento: 'Secretaría' },
  { nombre: 'DANIEL PRIETO LAMAS', departamento: 'Sistemas' },
  { nombre: 'NICOLAS RAPETTI', departamento: 'Secretaría' },
  { nombre: 'CORINA REVUELTA', departamento: 'Servicio Médico' },
  { nombre: 'GLADYS RIOS', departamento: 'Ordenanza' },
  { nombre: 'PABLO SAAD', departamento: 'Servicio Médico' },
  { nombre: 'MARIANA SENN', departamento: 'Secretaría' },
  { nombre: 'JAVIER SILVA', departamento: 'Contaduría' },
  { nombre: 'SILVANA SUAREZ', departamento: 'Contaduría' },
  { nombre: 'DANIEL VOCOS', departamento: 'Contaduría' },
  { nombre: 'CARINA YACANTO', departamento: 'Aportes' }
];

async function seedEmpleados() {
  try {
    console.log('🌱 Iniciando seed de empleados...');

    for (const empleado of empleados) {
      try {
        await prisma.empleado.create({
          data: {
            nombre: empleado.nombre,
            departamento: empleado.departamento,
            activo: true
          }
        });
        console.log(`✅ Empleado creado: ${empleado.nombre} (${empleado.departamento})`);
      } catch (error: any) {
        if (error.code === 'P2002') {
          console.log(`⚠️  Empleado ya existe: ${empleado.nombre} (${empleado.departamento})`);
        } else {
          console.error(`❌ Error creando empleado ${empleado.nombre}:`, error.message);
        }
      }
    }

    console.log(`🎉 Seed completado! ${empleados.length} empleados procesados.`);
    
    // Mostrar resumen por departamento
    const resumen = await prisma.empleado.groupBy({
      by: ['departamento'],
      _count: { id: true },
      where: { activo: true }
    });

    console.log('\n📊 Resumen por departamento:');
    resumen.forEach(depto => {
      console.log(`  ${depto.departamento}: ${depto._count.id} empleados`);
    });

  } catch (error) {
    console.error('❌ Error en seed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedEmpleados();
