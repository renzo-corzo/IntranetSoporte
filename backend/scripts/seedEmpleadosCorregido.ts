import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const empleados = [
  { nombreCompleto: 'GISELLA BORNANCINI', departamento: 'Contaduría' },
  { nombreCompleto: 'PEDRO CAMPOS', departamento: 'Secretaría' },
  { nombreCompleto: 'STEFANO CASTRO GASCH', departamento: 'Sistemas' },
  { nombreCompleto: 'MARCOS CEBALLOS', departamento: 'Aportes' },
  { nombreCompleto: 'RENZO CORZO', departamento: 'Sistemas' },
  { nombreCompleto: 'MAGDALENA CORNET', departamento: 'Asesoría de Letrado' },
  { nombreCompleto: 'WALTER COUGUET', departamento: 'Servicio Médico' },
  { nombreCompleto: 'ALEJANDRO JUAREZ', departamento: 'Secretaría' },
  { nombreCompleto: 'FEDERICO LASCANO', departamento: 'Aportes' },
  { nombreCompleto: 'SOLEDAD LOPEZ', departamento: 'Secretaría' },
  { nombreCompleto: 'MARIA DOLORES MAGARZO', departamento: 'Aportes' },
  { nombreCompleto: 'DIEGO MARCHESE', departamento: 'Servicio Médico' },
  { nombreCompleto: 'JORGELINA MARINZALDA', departamento: 'Aportes' },
  { nombreCompleto: 'INES MARTINEZ', departamento: 'Aportes' },
  { nombreCompleto: 'KARINA MILLAN', departamento: 'Servicio Médico' },
  { nombreCompleto: 'DANIEL MUZO', departamento: 'Contaduría' },
  { nombreCompleto: 'JORGE ONOFRI', departamento: 'Servicio Médico' },
  { nombreCompleto: 'STELLA MARIS PANUNTIN', departamento: 'Contaduría' },
  { nombreCompleto: 'IGNACIO PRADA', departamento: 'Contaduría' },
  { nombreCompleto: 'MARTIN PUMO', departamento: 'Secretaría' },
  { nombreCompleto: 'DANIEL PRIETO LAMAS', departamento: 'Sistemas' },
  { nombreCompleto: 'NICOLAS RAPETTI', departamento: 'Secretaría' },
  { nombreCompleto: 'CORINA REVUELTA', departamento: 'Servicio Médico' },
  { nombreCompleto: 'GLADYS RIOS', departamento: 'Ordenanza' },
  { nombreCompleto: 'PABLO SAAD', departamento: 'Servicio Médico' },
  { nombreCompleto: 'MARIANA SENN', departamento: 'Secretaría' },
  { nombreCompleto: 'JAVIER SILVA', departamento: 'Contaduría' },
  { nombreCompleto: 'SILVANA SUAREZ', departamento: 'Contaduría' },
  { nombreCompleto: 'DANIEL VOCOS', departamento: 'Contaduría' },
  { nombreCompleto: 'CARINA YACANTO', departamento: 'Aportes' }
];

function separarNombreApellido(nombreCompleto: string) {
  const partes = nombreCompleto.trim().split(' ');
  if (partes.length === 1) {
    return { nombre: partes[0], apellido: '' };
  }
  const apellido = partes[partes.length - 1];
  const nombre = partes.slice(0, -1).join(' ');
  return { nombre, apellido };
}

async function seedEmpleados() {
  try {
    console.log('🌱 Iniciando seed de empleados...');

    for (const empleado of empleados) {
      try {
        const { nombre, apellido } = separarNombreApellido(empleado.nombreCompleto);
        
        await prisma.empleado.create({
          data: {
            nombre,
            apellido,
            dni: `DNI${Math.random().toString().substr(2, 8)}`, // DNI temporal
            email: `${nombre.toLowerCase().replace(/\s+/g, '.')}@caja.com.ar`,
            departamento: empleado.departamento,
            estado: 'ACTIVO',
            fechaIngreso: new Date(),
            diasDisponibles: 20
          }
        });
        console.log(`✅ Empleado creado: ${empleado.nombreCompleto}`);
      } catch (error) {
        console.log(`❌ Error creando empleado ${empleado.nombreCompleto}:`, error.message);
      }
    }

    // Estadísticas
    const estadisticas = await prisma.empleado.groupBy({
      by: ['departamento'],
      where: {
        estado: 'ACTIVO'
      },
      _count: {
        id: true
      }
    });

    console.log('\n📊 Estadísticas por departamento:');
    estadisticas.forEach(stat => {
      console.log(`   ${stat.departamento}: ${stat._count.id} empleados`);
    });

    console.log('🎉 Seed completado!');
  } catch (error) {
    console.log('❌ Error en seed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedEmpleados();


