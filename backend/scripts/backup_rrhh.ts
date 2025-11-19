import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('💾 Iniciando backup RRHH...');
  const now = new Date();
  const fecha = now.toISOString().split('T')[0];
  const hora = now.toTimeString().split(' ')[0].replace(/:/g, '-');
  const timestamp = `${fecha}_${hora}`;

  const backupsDir = path.join(__dirname, '..', 'backups');
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }
  const targetFile = path.join(backupsDir, `backup_rrhh_${timestamp}.json`);

  try {
    console.log('📊 Exportando empleados...');
    const empleados = await prisma.empleado.findMany({
      include: {
        vacaciones: true,
        licencias: true,
        documentos: true,
      },
      orderBy: [{ apellido: 'asc' }, { nombre: 'asc' }],
    });

    console.log('📊 Exportando licencias...');
    const licencias = await prisma.licencia.findMany({
      include: { empleado: true },
      orderBy: [{ createdAt: 'desc' }],
    });

    console.log('📊 Exportando vacaciones...');
    const vacaciones = await prisma.vacacion.findMany({
      include: { empleado: true, decididoPor: true },
      orderBy: [{ createdAt: 'desc' }],
    });

    console.log('📊 Exportando usuarios (metadatos)...');
    const usuarios = await prisma.usuario.findMany({
      select: { id: true, username: true, email: true, nombre: true, departamento: true, rolId: true, activo: true },
    });

    const payload = {
      meta: {
        generadoEn: now.toISOString(),
        sistema: 'Infraestructura Caja de Abogados',
        modulo: 'RRHH',
        version: '1.0.0',
        totales: {
          empleados: empleados.length,
          licencias: licencias.length,
          vacaciones: vacaciones.length,
          usuarios: usuarios.length,
        },
      },
      data: {
        empleados,
        licencias,
        vacaciones,
        usuarios,
      },
    };

    fs.writeFileSync(targetFile, JSON.stringify(payload, null, 2));
    console.log(`✅ Backup RRHH creado: ${targetFile}`);
  } catch (err) {
    console.error('❌ Error creando backup RRHH:', err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();


