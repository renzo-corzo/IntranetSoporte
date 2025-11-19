import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// Función para crear directorio si no existe
function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Función para formatear fecha
function formatDate(date: Date): string {
  return date.toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

async function backupSistemaCompleto() {
  const timestamp = formatDate(new Date());
  const backupDir = path.join(__dirname, '..', 'backups', `backup_sistema_completo_${timestamp}`);
  
  try {
    console.log('🚀 Iniciando backup completo del sistema...\n');
    console.log(`📁 Directorio de backup: ${backupDir}\n`);

    // Crear directorio de backup
    ensureDir(backupDir);

    // 1. Backup de Roles
    console.log('📋 Exportando roles...');
    const roles = await prisma.rol.findMany({
      include: {
        usuarios: {
          select: {
            id: true,
            username: true,
            email: true,
            nombre: true,
            activo: true,
            creadoEn: true,
            departamento: true
          }
        }
      }
    });

    const rolesData = {
      timestamp: new Date().toISOString(),
      total: roles.length,
      roles: roles.map(rol => ({
        id: rol.id,
        nombre: rol.nombre,
        descripcion: rol.descripcion,
        permisos: rol.permisos,
        usuarios: rol.usuarios
      }))
    };

    fs.writeFileSync(
      path.join(backupDir, 'roles.json'),
      JSON.stringify(rolesData, null, 2)
    );
    console.log(`✅ Roles exportados: ${roles.length} roles`);

    // 2. Backup de Usuarios
    console.log('👥 Exportando usuarios...');
    const usuarios = await prisma.usuario.findMany({
      include: {
        rol: {
          select: {
            nombre: true,
            descripcion: true
          }
        }
      }
    });

    const usuariosData = {
      timestamp: new Date().toISOString(),
      total: usuarios.length,
      usuarios: usuarios.map(usuario => ({
        id: usuario.id,
        username: usuario.username,
        email: usuario.email,
        nombre: usuario.nombre,
        activo: usuario.activo,
        creadoEn: usuario.creadoEn,
        departamento: usuario.departamento,
        rol: usuario.rol
      }))
    };

    fs.writeFileSync(
      path.join(backupDir, 'usuarios.json'),
      JSON.stringify(usuariosData, null, 2)
    );
    console.log(`✅ Usuarios exportados: ${usuarios.length} usuarios`);

    // 3. Backup de Empleados
    console.log('👨‍💼 Exportando empleados...');
    const empleados = await prisma.empleado.findMany({
      include: {
        vacaciones: {
          include: {
            decididoPor: {
              select: {
                username: true,
                nombre: true
              }
            }
          }
        },
        licencias: true,
        documentos: true
      }
    });

    const empleadosData = {
      timestamp: new Date().toISOString(),
      total: empleados.length,
      empleados: empleados.map(empleado => ({
        id: empleado.id,
        nombre: empleado.nombre,
        apellido: empleado.apellido,
        email: empleado.email,
        telefono: empleado.telefono,
        dni: empleado.dni,
        fechaIngreso: empleado.fechaIngreso,
        departamento: empleado.departamento,
        cargo: empleado.cargo,
        salario: empleado.salario,
        activo: empleado.activo,
        creadoEn: empleado.creadoEn,
        actualizadoEn: empleado.actualizadoEn,
        vacaciones: empleado.vacaciones.map(vacacion => ({
          id: vacacion.id,
          fechaInicio: vacacion.fechaInicio,
          fechaFin: vacacion.fechaFin,
          dias: vacacion.dias,
          estado: vacacion.estado,
          observaciones: vacacion.observaciones,
          creadoEn: vacacion.creadoEn,
          decididoEn: vacacion.decididoEn,
          decididoPor: vacacion.decididoPor
        })),
        licencias: empleado.licencias.map(licencia => ({
          id: licencia.id,
          tipo: licencia.tipo,
          fechaInicio: licencia.fechaInicio,
          fechaFin: licencia.fechaFin,
          observaciones: licencia.observaciones,
          creadoEn: licencia.creadoEn
        })),
        documentos: empleado.documentos.map(doc => ({
          id: doc.id,
          tipo: doc.tipo,
          nombre: doc.nombre,
          ruta: doc.ruta,
          creadoEn: doc.creadoEn
        }))
      }))
    };

    fs.writeFileSync(
      path.join(backupDir, 'empleados.json'),
      JSON.stringify(empleadosData, null, 2)
    );
    console.log(`✅ Empleados exportados: ${empleados.length} empleados`);

    // 4. Backup de Vacaciones
    console.log('🏖️ Exportando vacaciones...');
    const vacaciones = await prisma.vacacion.findMany({
      include: {
        empleado: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            departamento: true
          }
        },
        decididoPor: {
          select: {
            username: true,
            nombre: true
          }
        }
      }
    });

    const vacacionesData = {
      timestamp: new Date().toISOString(),
      total: vacaciones.length,
      vacaciones: vacaciones.map(vacacion => ({
        id: vacacion.id,
        empleadoId: vacacion.empleadoId,
        empleado: vacacion.empleado,
        fechaInicio: vacacion.fechaInicio,
        fechaFin: vacacion.fechaFin,
        dias: vacacion.dias,
        estado: vacacion.estado,
        observaciones: vacacion.observaciones,
        creadoEn: vacacion.creadoEn,
        decididoEn: vacacion.decididoEn,
        decididoPor: vacacion.decididoPor
      }))
    };

    fs.writeFileSync(
      path.join(backupDir, 'vacaciones.json'),
      JSON.stringify(vacacionesData, null, 2)
    );
    console.log(`✅ Vacaciones exportadas: ${vacaciones.length} vacaciones`);

    // 5. Backup de Licencias
    console.log('📄 Exportando licencias...');
    const licencias = await prisma.licencia.findMany({
      include: {
        empleado: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            departamento: true
          }
        }
      }
    });

    const licenciasData = {
      timestamp: new Date().toISOString(),
      total: licencias.length,
      licencias: licencias.map(licencia => ({
        id: licencia.id,
        empleadoId: licencia.empleadoId,
        empleado: licencia.empleado,
        tipo: licencia.tipo,
        fechaInicio: licencia.fechaInicio,
        fechaFin: licencia.fechaFin,
        observaciones: licencia.observaciones,
        creadoEn: licencia.creadoEn
      }))
    };

    fs.writeFileSync(
      path.join(backupDir, 'licencias.json'),
      JSON.stringify(licenciasData, null, 2)
    );
    console.log(`✅ Licencias exportadas: ${licencias.length} licencias`);

    // 6. Backup de Documentos de Empleados
    console.log('📁 Exportando documentos...');
    const documentos = await prisma.documentoEmpleado.findMany({
      include: {
        empleado: {
          select: {
            id: true,
            nombre: true,
            apellido: true
          }
        }
      }
    });

    const documentosData = {
      timestamp: new Date().toISOString(),
      total: documentos.length,
      documentos: documentos.map(doc => ({
        id: doc.id,
        empleadoId: doc.empleadoId,
        empleado: doc.empleado,
        tipo: doc.tipo,
        nombre: doc.nombre,
        ruta: doc.ruta,
        creadoEn: doc.creadoEn
      }))
    };

    fs.writeFileSync(
      path.join(backupDir, 'documentos.json'),
      JSON.stringify(documentosData, null, 2)
    );
    console.log(`✅ Documentos exportados: ${documentos.length} documentos`);

    // 7. Backup de Stock (si existe)
    console.log('📦 Exportando datos de stock...');
    try {
      const productos = await prisma.productoStock.findMany({
        include: {
          movimientos: true,
          creadoPor: {
            select: {
              username: true,
              nombre: true
            }
          }
        }
      });

      const stockData = {
        timestamp: new Date().toISOString(),
        total: productos.length,
        productos: productos.map(producto => ({
          id: producto.id,
          nombre: producto.nombre,
          descripcion: producto.descripcion,
          categoria: producto.categoria,
          stockActual: producto.stockActual,
          stockMinimo: producto.stockMinimo,
          precio: producto.precio,
          ubicacion: producto.ubicacion,
          activo: producto.activo,
          creadoEn: producto.creadoEn,
          creadoPor: producto.creadoPor,
          movimientos: producto.movimientos
        }))
      };

      fs.writeFileSync(
        path.join(backupDir, 'stock.json'),
        JSON.stringify(stockData, null, 2)
      );
      console.log(`✅ Stock exportado: ${productos.length} productos`);
    } catch (error) {
      console.log('⚠️  No se pudo exportar stock (tabla no existe o error)');
    }

    // 8. Crear archivo de resumen
    const resumen = {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      descripcion: 'Backup completo del sistema de Infraestructura Caja de Abogados',
      archivos: [
        'roles.json',
        'usuarios.json',
        'empleados.json',
        'vacaciones.json',
        'licencias.json',
        'documentos.json',
        'stock.json'
      ],
      estadisticas: {
        roles: roles.length,
        usuarios: usuarios.length,
        empleados: empleados.length,
        vacaciones: vacaciones.length,
        licencias: licencias.length,
        documentos: documentos.length
      },
      credenciales: {
        admin: 'admin / admin123',
        admin_rrhh: 'admin_rrhh / rrhh123',
        admin_sistemas: 'admin_sistemas / sistemas123',
        supervisor: 'supervisor / supervisor123',
        auditor: 'auditor / auditor123'
      }
    };

    fs.writeFileSync(
      path.join(backupDir, 'README_BACKUP.md'),
      `# 📦 BACKUP COMPLETO DEL SISTEMA
## Infraestructura Caja de Abogados

**Fecha:** ${resumen.timestamp}
**Versión:** ${resumen.version}

### 📊 Estadísticas del Backup
- **Roles:** ${resumen.estadisticas.roles}
- **Usuarios:** ${resumen.estadisticas.usuarios}
- **Empleados:** ${resumen.estadisticas.empleados}
- **Vacaciones:** ${resumen.estadisticas.vacaciones}
- **Licencias:** ${resumen.estadisticas.licencias}
- **Documentos:** ${resumen.estadisticas.documentos}

### 🔐 Credenciales de Acceso
- **ADMIN:** admin / admin123
- **ADMIN_RRHH:** admin_rrhh / rrhh123
- **ADMIN_SISTEMAS:** admin_sistemas / sistemas123
- **SUPERVISOR:** supervisor / supervisor123
- **AUDITOR:** auditor / auditor123

### 📁 Archivos Incluidos
${resumen.archivos.map(archivo => `- ${archivo}`).join('\n')}

### 🚀 Para Restaurar
1. Ejecutar migraciones: \`npx prisma migrate deploy\`
2. Ejecutar script de restauración
3. Verificar datos importados

---
*Backup generado automáticamente por el sistema*
`
    );

    fs.writeFileSync(
      path.join(backupDir, 'resumen.json'),
      JSON.stringify(resumen, null, 2)
    );

    console.log('\n🎉 ¡Backup completo realizado exitosamente!');
    console.log(`📁 Directorio: ${backupDir}`);
    console.log(`📊 Total de archivos: ${resumen.archivos.length + 2}`);
    console.log('\n📋 RESUMEN:');
    console.log(`   - Roles: ${resumen.estadisticas.roles}`);
    console.log(`   - Usuarios: ${resumen.estadisticas.usuarios}`);
    console.log(`   - Empleados: ${resumen.estadisticas.empleados}`);
    console.log(`   - Vacaciones: ${resumen.estadisticas.vacaciones}`);
    console.log(`   - Licencias: ${resumen.estadisticas.licencias}`);
    console.log(`   - Documentos: ${resumen.estadisticas.documentos}`);

  } catch (error) {
    console.error('❌ Error durante el backup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  backupSistemaCompleto()
    .then(() => {
      console.log('\n✅ Backup completado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Error en el backup:', error);
      process.exit(1);
    });
}

export default backupSistemaCompleto;


