import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧽 Eliminando vacaciones y licencias...');
  const deletedVac = await prisma.vacacion.deleteMany({});
  const deletedLic = await prisma.licencia.deleteMany({});

  console.log(`✅ Vacaciones eliminadas: ${deletedVac.count}`);
  console.log(`✅ Licencias eliminadas: ${deletedLic.count}`);

  const vacCount = await prisma.vacacion.count();
  const licCount = await prisma.licencia.count();
  console.log(`📊 Vacaciones restantes: ${vacCount}`);
  console.log(`📊 Licencias restantes: ${licCount}`);
}

main()
  .catch((err) => {
    console.error('❌ Error limpiando datos RRHH:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

