import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

interface VacacionBackup {
  id: string;
  empleadoId: string;
  fechaInicio: string;
  fechaFin: string;
  diasSolicitados: number;
  observaciones?: string | null;
  estado: string;
  decididoPorId?: number | null;
  comentarioDecision?: string | null;
  decididoEn?: string | null;
}

interface LicenciaBackup {
  id: string;
  empleadoId: string;
  tipo: string;
  fechaInicio: string;
  fechaFin: string;
  observaciones?: string | null;
}

interface DocumentoBackup {
  id: string;
  empleadoId: string;
  nombreArchivo: string;
  tipoArchivo?: string | null;
  urlArchivo: string;
}

interface EmpleadoBackup {
  id: string;
  nombre: string;
  apellido: string;
  dni: string;
  email?: string | null;
  departamento: string;
  estado: string;
  fechaIngreso?: string | null;
  diasDisponibles?: number | null;
  vacaciones?: VacacionBackup[];
  licencias?: LicenciaBackup[];
  documentos?: DocumentoBackup[];
}

interface BackupFile {
  data: {
    empleados?: EmpleadoBackup[];
  };
}

function parseDate(value?: string | null): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

async function main() {
  const fileArg = process.argv[2];
  if (!fileArg) {
    console.error('❌ Debes indicar la ruta del archivo JSON. Ej: npx tsx scripts/restaurar-rrhh.ts backups/backup_rrhh.json');
    process.exit(1);
  }

  const resolvedPath = path.isAbsolute(fileArg) ? fileArg : path.join(process.cwd(), fileArg);
  if (!fs.existsSync(resolvedPath)) {
    console.error(`❌ Archivo no encontrado: ${resolvedPath}`);
    process.exit(1);
  }

  console.log('📥 Leyendo backup RRHH desde:', resolvedPath);
  const raw = fs.readFileSync(resolvedPath, 'utf-8');
  const backup: BackupFile = JSON.parse(raw);
  const empleados = backup.data.empleados ?? [];

  console.log(`🧹 Limpiando tablas RRHH actuales...`);
  await prisma.documentoEmpleado.deleteMany({});
  await prisma.licencia.deleteMany({});
  await prisma.vacacion.deleteMany({});
  await prisma.empleado.deleteMany({});

  console.log(`👥 Importando ${empleados.length} empleados...`);

  for (const empleado of empleados) {
    const fechaIngreso = parseDate(empleado.fechaIngreso) ?? new Date();
    const diasDisponibles = empleado.diasDisponibles ?? 20;

    await prisma.empleado.create({
      data: {
        id: empleado.id,
        nombre: empleado.nombre,
        apellido: empleado.apellido ?? '',
        dni: empleado.dni,
        email: empleado.email ?? null,
        departamento: empleado.departamento ?? 'Sin asignar',
        estado: empleado.estado ?? 'ACTIVO',
        fechaIngreso,
        diasDisponibles,
      },
    });

    if (empleado.vacaciones?.length) {
      await prisma.vacacion.createMany({
        data: empleado.vacaciones.map((vac) => ({
          id: vac.id,
          empleadoId: empleado.id,
          fechaInicio: parseDate(vac.fechaInicio) ?? new Date(),
          fechaFin: parseDate(vac.fechaFin) ?? new Date(),
          diasSolicitados: vac.diasSolicitados ?? 0,
          observaciones: vac.observaciones ?? '',
          estado: vac.estado ?? 'PENDIENTE',
          decididoPorId: vac.decididoPorId ?? null,
          comentarioDecision: vac.comentarioDecision ?? null,
          decididoEn: parseDate(vac.decididoEn) ?? null,
        })),
        skipDuplicates: true,
      });
    }

    if (empleado.licencias?.length) {
      await prisma.licencia.createMany({
        data: empleado.licencias.map((lic) => ({
          id: lic.id,
          empleadoId: empleado.id,
          tipo: lic.tipo ?? 'General',
          fechaInicio: parseDate(lic.fechaInicio) ?? new Date(),
          fechaFin: parseDate(lic.fechaFin) ?? new Date(),
          observaciones: lic.observaciones ?? '',
        })),
        skipDuplicates: true,
      });
    }

    if (empleado.documentos?.length) {
      await prisma.documentoEmpleado.createMany({
        data: empleado.documentos.map((doc) => ({
          id: doc.id,
          empleadoId: empleado.id,
          nombreArchivo: doc.nombreArchivo ?? 'documento',
          tipoArchivo: doc.tipoArchivo ?? null,
          urlArchivo: doc.urlArchivo ?? '',
        })),
        skipDuplicates: true,
      });
    }
  }

  const resumen = await prisma.empleado.groupBy({
    by: ['departamento'],
    _count: { id: true },
  });

  console.log('\n📊 Resumen por departamento:');
  resumen.forEach((row) => {
    console.log(`  ${row.departamento}: ${row._count.id} empleados`);
  });

  console.log('\n✅ Importación de RRHH completada');
}

main()
  .catch((error) => {
    console.error('❌ Error restaurando RRHH:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

