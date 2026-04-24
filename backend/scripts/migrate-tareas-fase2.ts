import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const hasArg = (arg: string) => process.argv.some((a) => a.toLowerCase() === arg.toLowerCase());
const APPLY = hasArg("--apply");

async function readDiagnostics() {
  const [byEstado, cerradasSinFechaCierre, legacyPendientes] = await Promise.all([
    prisma.$queryRaw<Array<{ estado: string; total: bigint }>>`
      SELECT "estado", COUNT(*)::bigint AS total
      FROM "Tarea"
      GROUP BY "estado"
      ORDER BY "estado"
    `,
    prisma.$queryRaw<Array<{ total: bigint }>>`
      SELECT COUNT(*)::bigint AS total
      FROM "Tarea"
      WHERE "estado" IN ('resuelta','cancelada','hecha')
        AND "fechaCierre" IS NULL
    `,
    prisma.$queryRaw<Array<{ total: bigint }>>`
      SELECT COUNT(*)::bigint AS total
      FROM "Tarea"
      WHERE "estado" IN ('hecha','en_progreso')
    `
  ]);

  return {
    byEstado,
    cerradasSinFechaCierre: Number(cerradasSinFechaCierre[0]?.total || 0n),
    legacyPendientes: Number(legacyPendientes[0]?.total || 0n)
  };
}

async function run() {
  console.log("=== Migracion datos Tareas Fase 2 ===");
  console.log(`Modo: ${APPLY ? "APPLY (escribe cambios)" : "DRY-RUN (solo diagnostico)"}`);

  const before = await readDiagnostics();
  console.log("\n-- Estado actual --");
  before.byEstado.forEach((r) => console.log(`estado=${r.estado} total=${r.total}`));
  console.log(`cerradas sin fechaCierre=${before.cerradasSinFechaCierre}`);
  console.log(`legacy pendientes (hecha/en_progreso)=${before.legacyPendientes}`);

  if (!APPLY) {
    console.log("\nNo se aplicaron cambios. Ejecuta con --apply para migrar.");
    return;
  }

  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const backupTable = `Tarea_backup_fase2_${stamp}`;

  console.log(`\nCreando backup de seguridad: "${backupTable}"`);
  await prisma.$executeRawUnsafe(`CREATE TABLE "${backupTable}" AS TABLE "Tarea";`);

  console.log("Aplicando normalizacion de estados legacy...");
  await prisma.$executeRawUnsafe(`
    UPDATE "Tarea"
    SET "estado"='en_curso'
    WHERE "estado"='en_progreso';
  `);

  await prisma.$executeRawUnsafe(`
    UPDATE "Tarea"
    SET
      "estado"='resuelta',
      "fechaCierre"=COALESCE("fechaCierre","finalizadaEn",NOW()),
      "finalizadaEn"=COALESCE("finalizadaEn","fechaCierre",NOW())
    WHERE "estado"='hecha';
  `);

  await prisma.$executeRawUnsafe(`
    UPDATE "Tarea"
    SET "fechaCierre"=COALESCE("fechaCierre","finalizadaEn",NOW())
    WHERE "estado" IN ('resuelta','cancelada')
      AND "fechaCierre" IS NULL;
  `);

  await prisma.$executeRawUnsafe(`
    UPDATE "Tarea"
    SET "finalizadaEn"=COALESCE("finalizadaEn","fechaCierre")
    WHERE "estado" IN ('resuelta','cancelada')
      AND "finalizadaEn" IS NULL
      AND "fechaCierre" IS NOT NULL;
  `);

  const after = await readDiagnostics();
  console.log("\n-- Estado posterior --");
  after.byEstado.forEach((r) => console.log(`estado=${r.estado} total=${r.total}`));
  console.log(`cerradas sin fechaCierre=${after.cerradasSinFechaCierre}`);
  console.log(`legacy pendientes (hecha/en_progreso)=${after.legacyPendientes}`);

  console.log("\nMigracion completada.");
  console.log(`Backup disponible para rollback: "${backupTable}"`);
  console.log(`Ejemplo rollback rapido: UPDATE "Tarea" t SET ... FROM "${backupTable}" b WHERE t."id"=b."id";`);
}

run()
  .catch((err) => {
    console.error("Error en migracion:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

