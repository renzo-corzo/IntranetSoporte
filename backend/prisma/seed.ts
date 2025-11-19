import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {


  // Verificar si ya existe un usuario admin
  let adminUser = await prisma.usuario.findFirst({
    where: { username: 'admin' }
  });

  if (!adminUser) {

    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Crear rol admin si no existe
    let adminRole = await prisma.rol.findFirst({
      where: { nombre: 'admin' }
    });

    if (!adminRole) {
      adminRole = await prisma.rol.create({
        data: {
          nombre: 'admin',
          descripcion: 'Administrador del sistema'
        }
      });
    }

    adminUser = await prisma.usuario.create({
      data: {
        username: 'admin',
        email: 'admin@infra.com',
        password: hashedPassword,
        nombre: 'Administrador',
        rolId: adminRole.id,
        activo: true
      }
    });
    // Usuario admin creado
  } else {
    // Usuario admin ya existe
  }

  // Crear rol técnico si no existe
  let tecnicoRole = await prisma.rol.findFirst({
    where: { nombre: 'tecnico' }
  });

  if (!tecnicoRole) {
    tecnicoRole = await prisma.rol.create({
      data: {
        nombre: 'tecnico',
        descripcion: 'Técnico del sistema'
      }
    });
  }

  // Crear usuario técnico si no existe
  let tecnicoUser = await prisma.usuario.findFirst({
    where: { username: 'tecnico' }
  });

  if (!tecnicoUser) {
    const hashedPasswordTecnico = await bcrypt.hash('tecnico123', 10);
    tecnicoUser = await prisma.usuario.create({
      data: {
        username: 'tecnico',
        email: 'tecnico@infra.com',
        password: hashedPasswordTecnico,
        nombre: 'Técnico',
        rolId: tecnicoRole.id,
        activo: true
      }
    });
  }

  // Crear categorías principales
  const infraestructura = await prisma.categoria.create({
    data: {
      nombre: 'Infraestructura',
      descripcion: 'Procedimientos relacionados con la infraestructura de red y sistemas',
      icono: '🏗️'
    }
  });

  const mantenimiento = await prisma.categoria.create({
    data: {
      nombre: 'Mantenimiento',
      descripcion: 'Tareas de mantenimiento preventivo y correctivo',
      icono: '🔧'
    }
  });

  const seguridad = await prisma.categoria.create({
    data: {
      nombre: 'Seguridad',
      descripcion: 'Procedimientos de seguridad y auditoría',
      icono: '🔒'
    }
  });

  const backup = await prisma.categoria.create({
    data: {
      nombre: 'Backup y Recuperación',
      descripcion: 'Procedimientos de respaldo y recuperación de datos',
      icono: '💾'
    }
  });

  // Crear subcategorías
  const redes = await prisma.categoria.create({
    data: {
      nombre: 'Redes',
      descripcion: 'Configuración y mantenimiento de equipos de red',
      icono: '🌐',
      padreId: infraestructura.id
    }
  });

  const servidores = await prisma.categoria.create({
    data: {
      nombre: 'Servidores',
      descripcion: 'Administración de servidores físicos y virtuales',
      icono: '🖥️',
      padreId: infraestructura.id
    }
  });

  const mantenimientoPreventivo = await prisma.categoria.create({
    data: {
      nombre: 'Mantenimiento Preventivo',
      descripcion: 'Tareas programadas de mantenimiento',
      icono: '📅',
      padreId: mantenimiento.id
    }
  });

  const mantenimientoCorrectivo = await prisma.categoria.create({
    data: {
      nombre: 'Mantenimiento Correctivo',
      descripcion: 'Reparación de fallas y problemas',
      icono: '🛠️',
      padreId: mantenimiento.id
    }
  });

  const firewall = await prisma.categoria.create({
    data: {
      nombre: 'Firewall',
      descripcion: 'Configuración y gestión de firewalls',
      icono: '🔥',
      padreId: seguridad.id
    }
  });

  const antivirus = await prisma.categoria.create({
    data: {
      nombre: 'Antivirus',
      descripcion: 'Gestión de software antivirus',
      icono: '🛡️',
      padreId: seguridad.id
    }
  });

  const backupAutomatico = await prisma.categoria.create({
    data: {
      nombre: 'Backup Automático',
      descripcion: 'Configuración de respaldos automáticos',
      icono: '⚡',
      padreId: backup.id
    }
  });

  const recuperacion = await prisma.categoria.create({
    data: {
      nombre: 'Recuperación de Datos',
      descripcion: 'Procedimientos de recuperación ante desastres',
      icono: '🔄',
      padreId: backup.id
    }
  });

  // Crear artículos de ejemplo
  await prisma.articulo.create({
    data: {
      titulo: 'Configuración de Switch Cisco',
      contenido: '<h3>Configuración básica de switch Cisco</h3><p>Este procedimiento describe los pasos para configurar un switch Cisco desde cero:</p><ol><li>Conectar consola al switch</li><li>Configurar IP de gestión</li><li>Crear VLANs</li><li>Configurar puertos trunk</li></ol><p><strong>Nota:</strong> Siempre hacer backup de la configuración antes de cambios.</p>',
      categoriaId: redes.id,
      adjuntos: ['https://example.com/cisco-config.pdf'],
      creadoPorId: adminUser.id
    }
  });

  await prisma.articulo.create({
    data: {
      titulo: 'Mantenimiento de Servidor Windows',
      contenido: '<h3>Mantenimiento mensual de servidor Windows</h3><p>Lista de verificación para mantenimiento:</p><ul><li>Verificar espacio en disco</li><li>Revisar logs del sistema</li><li>Actualizar Windows</li><li>Verificar servicios críticos</li><li>Limpiar archivos temporales</li></ul>',
      categoriaId: servidores.id,
      adjuntos: ['https://example.com/windows-maintenance.pdf'],
      creadoPorId: adminUser.id
    }
  });

  await prisma.articulo.create({
    data: {
      titulo: 'Configuración de Firewall',
      contenido: '<h3>Configuración de reglas de firewall</h3><p>Procedimiento para configurar reglas básicas:</p><ol><li>Identificar servicios necesarios</li><li>Crear reglas de entrada</li><li>Crear reglas de salida</li><li>Probar conectividad</li></ol>',
      categoriaId: firewall.id,
      adjuntos: ['https://example.com/firewall-rules.pdf'],
      creadoPorId: adminUser.id
    }
  });

  await prisma.articulo.create({
    data: {
      titulo: 'Procedimiento de Backup',
      contenido: '<h3>Backup completo del sistema</h3><p>Pasos para realizar backup:</p><ol><li>Verificar espacio disponible</li><li>Detener servicios críticos</li><li>Ejecutar backup</li><li>Verificar integridad</li><li>Reiniciar servicios</li></ol>',
      categoriaId: backupAutomatico.id,
      adjuntos: ['https://example.com/backup-procedure.pdf'],
      creadoPorId: adminUser.id
    }
  });

  console.log('✅ Seed completado exitosamente!');
  console.log('🔑 Credenciales de acceso: admin / admin123');
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 