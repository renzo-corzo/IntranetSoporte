import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Definir todos los roles del sistema
const rolesSistema = [
  {
    nombre: 'admin',
    descripcion: 'Administrador del sistema con acceso completo',
    permisos: [
      'usuarios:read', 'usuarios:create', 'usuarios:update', 'usuarios:delete',
      'rrhh:ver', 'rrhh:stats',
      'empleados:read', 'empleados:manage',
      'vacaciones:read', 'vacaciones:manage', 'vacaciones:approve',
      'licencias:read', 'licencias:manage',
      'documentos_rrhh:read', 'documentos_rrhh:manage',
      'estadisticas:read',
      'stock:read', 'stock:create', 'stock:update', 'stock:delete',
      'tareas:read', 'tareas:create', 'tareas:update', 'tareas:delete',
      'procedimientos:read', 'procedimientos:create', 'procedimientos:update', 'procedimientos:delete',
      'relevamientos:read', 'relevamientos:create', 'relevamientos:update', 'relevamientos:delete',
      'kb:read', 'kb:create', 'kb:update', 'kb:delete',
      'links:read', 'links:create', 'links:update', 'links:delete',
      'zabbix:read', 'zabbix:create', 'zabbix:update', 'zabbix:delete',
      'ver_monitor', 'trafico:read', 'trafico:manage'
    ]
  },
  {
    nombre: 'admin_rrhh',
    descripcion: 'Administrador de Recursos Humanos con acceso completo al módulo RRHH',
    permisos: [
      'usuarios:read',
      'rrhh:ver', 'rrhh:stats',
      'empleados:read', 'empleados:manage',
      'vacaciones:read', 'vacaciones:manage', 'vacaciones:approve',
      'licencias:read', 'licencias:manage',
      'documentos_rrhh:read', 'documentos_rrhh:manage'
    ]
  },
  {
    nombre: 'rrhh',
    descripcion: 'Analista de Recursos Humanos con acceso operativo al módulo RRHH',
    permisos: [
      'rrhh:ver', 'rrhh:stats',
      'empleados:read', 'empleados:manage',
      'vacaciones:read', 'vacaciones:manage',
      'licencias:read', 'licencias:manage',
      'documentos_rrhh:read', 'documentos_rrhh:manage'
    ]
  },
  {
    nombre: 'admin_sistemas',
    descripcion: 'Administrador de Sistemas con acceso a infraestructura y monitoreo',
    permisos: [
      'usuarios:read',
      'stock:read', 'stock:create', 'stock:update', 'stock:delete',
      'tareas:read', 'tareas:create', 'tareas:update', 'tareas:delete',
      'procedimientos:read', 'procedimientos:create', 'procedimientos:update', 'procedimientos:delete',
      'relevamientos:read', 'relevamientos:create', 'relevamientos:update', 'relevamientos:delete',
      'kb:read', 'kb:create', 'kb:update', 'kb:delete',
      'links:read', 'links:create', 'links:update', 'links:delete',
      'zabbix:read', 'zabbix:create', 'zabbix:update', 'zabbix:delete',
      'ver_monitor', 'trafico:read', 'trafico:manage'
    ]
  },
  {
    nombre: 'stock_viewer',
    descripcion: 'Usuario con acceso de solo lectura al módulo de stock',
    permisos: [
      'stock:read',
      'ver_stock'
    ]
  },
  {
    nombre: 'stock_editor',
    descripcion: 'Usuario con permisos completos para gestionar el módulo de stock',
    permisos: [
      'stock:read',
      'stock:create',
      'stock:update',
      'stock:delete',
      'ver_stock'
    ]
  },
  {
    nombre: 'usuario',
    descripcion: 'Usuario estándar con acceso limitado',
    permisos: [
      'empleados:read_own',
      'vacaciones:read_own', 'vacaciones:create_own',
      'licencias:read_own', 'licencias:create_own',
      'documentos:read_own', 'documentos:create_own'
    ]
  },
  {
    nombre: 'supervisor',
    descripcion: 'Supervisor con acceso a datos de su departamento',
    permisos: [
      'usuarios:read',
      'empleados:read', 'empleados:read_department',
      'vacaciones:read', 'vacaciones:read_department', 'vacaciones:approve_department',
      'licencias:read', 'licencias:read_department', 'licencias:approve_department',
      'documentos_rrhh:read',
      'estadisticas:read_department'
    ]
  },
  {
    nombre: 'auditor',
    descripcion: 'Auditor con acceso de solo lectura a todos los módulos',
    permisos: [
      'usuarios:read',
      'empleados:read',
      'vacaciones:read',
      'licencias:read',
      'documentos_rrhh:read',
      'estadisticas:read',
      'stock:read',
      'tareas:read',
      'procedimientos:read',
      'relevamientos:read',
      'kb:read',
      'links:read',
      'zabbix:read'
    ]
  }
];

// Usuarios por defecto para cada rol
const usuariosPorDefecto = [
  {
    username: 'admin',
    email: 'admin@cajadeabogados.com',
    password: 'admin123',
    rol: 'admin',
    nombre: 'Administrador Sistema',
    activo: true
  },
  {
    username: 'rrhh',
    email: 'analista.rrhh@cajadeabogados.com',
    password: 'rrhh123',
    rol: 'rrhh',
    nombre: 'Analista RRHH',
    activo: true
  },
  {
    username: 'admin_rrhh',
    email: 'rrhh@cajadeabogados.com',
    password: 'rrhh123',
    rol: 'admin_rrhh',
    nombre: 'Admin RRHH',
    activo: true
  },
  {
    username: 'admin_sistemas',
    email: 'sistemas@cajadeabogados.com',
    password: 'sistemas123',
    rol: 'admin_sistemas',
    nombre: 'Admin Sistemas',
    activo: true
  },
  {
    username: 'stock',
    email: 'stock@cajadeabogados.com',
    password: 'stock123',
    rol: 'stock_viewer',
    nombre: 'Usuario Stock Consulta',
    activo: true
  },
  {
    username: 'stock_editor',
    email: 'stock.editor@cajadeabogados.com',
    password: 'stock123',
    rol: 'stock_editor',
    nombre: 'Usuario Stock Gestión',
    activo: true
  },
  {
    username: 'supervisor',
    email: 'supervisor@cajadeabogados.com',
    password: 'supervisor123',
    rol: 'supervisor',
    nombre: 'Supervisor General',
    activo: true
  },
  {
    username: 'auditor',
    email: 'auditor@cajadeabogados.com',
    password: 'auditor123',
    rol: 'auditor',
    nombre: 'Auditor Sistema',
    activo: true
  }
];

async function generarRolesSistema() {
  try {
    console.log('🚀 Iniciando generación de roles del sistema...\n');

    // 1. Crear o actualizar roles
    console.log('📋 Creando/actualizando roles...');
    for (const rolData of rolesSistema) {
      const rol = await prisma.rol.upsert({
        where: { nombre: rolData.nombre },
        update: {
          descripcion: rolData.descripcion,
          permisos: rolData.permisos
        },
        create: {
          nombre: rolData.nombre,
          descripcion: rolData.descripcion,
          permisos: rolData.permisos
        }
      });
      console.log(`✅ Rol '${rol.nombre}' creado/actualizado`);
    }

    // 2. Crear usuarios por defecto
    console.log('\n👥 Creando usuarios por defecto...');
    for (const usuarioData of usuariosPorDefecto) {
      // Buscar el rol
      const rol = await prisma.rol.findUnique({
        where: { nombre: usuarioData.rol }
      });

      if (!rol) {
        console.log(`❌ Rol '${usuarioData.rol}' no encontrado para usuario '${usuarioData.username}'`);
        continue;
      }

      // Verificar si el usuario ya existe
      const usuarioExistente = await prisma.usuario.findUnique({
        where: { username: usuarioData.username }
      });

      if (usuarioExistente) {
        console.log(`⚠️  Usuario '${usuarioData.username}' ya existe, actualizando...`);
        
        // Actualizar usuario existente
        const passwordHash = await bcrypt.hash(usuarioData.password, 10);
        await prisma.usuario.update({
          where: { id: usuarioExistente.id },
          data: {
            email: usuarioData.email,
            password: passwordHash,
            rolId: rol.id,
            nombre: usuarioData.nombre,
            activo: usuarioData.activo
          }
        });
        console.log(`✅ Usuario '${usuarioData.username}' actualizado`);
      } else {
        // Crear nuevo usuario
        const passwordHash = await bcrypt.hash(usuarioData.password, 10);
        await prisma.usuario.create({
          data: {
            username: usuarioData.username,
            email: usuarioData.email,
            password: passwordHash,
            rolId: rol.id,
            nombre: usuarioData.nombre,
            activo: usuarioData.activo
          }
        });
        console.log(`✅ Usuario '${usuarioData.username}' creado`);
      }
    }

    // 3. Verificar roles creados
    console.log('\n🔍 Verificando roles creados...');
    const rolesCreados = await prisma.rol.findMany({
      include: {
        usuarios: {
          select: {
            username: true,
            email: true,
            activo: true
          }
        }
      }
    });

    console.log('\n📊 RESUMEN DE ROLES:');
    console.log('==================');
    rolesCreados.forEach(rol => {
      console.log(`\n🔹 ${rol.nombre.toUpperCase()}`);
      console.log(`   Descripción: ${rol.descripcion}`);
      console.log(`   Permisos: ${rol.permisos.length} permisos`);
      console.log(`   Usuarios: ${rol.usuarios.length} usuarios`);
      if (rol.usuarios.length > 0) {
        rol.usuarios.forEach(usuario => {
          console.log(`     - ${usuario.username} (${usuario.email}) - ${usuario.activo ? 'Activo' : 'Inactivo'}`);
        });
      }
    });

    // 4. Verificar usuarios creados
    console.log('\n👥 RESUMEN DE USUARIOS:');
    console.log('======================');
    const usuariosCreados = await prisma.usuario.findMany({
      include: {
        rol: true
      }
    });

    usuariosCreados.forEach(usuario => {
      console.log(`- ${usuario.username} (${usuario.email}) - Rol: ${usuario.rol.nombre} - ${usuario.activo ? 'Activo' : 'Inactivo'}`);
    });

    console.log('\n🎉 ¡Generación de roles completada exitosamente!');
    console.log('\n📝 CREDENCIALES DE ACCESO:');
    console.log('==========================');
    usuariosPorDefecto.forEach(usuario => {
      console.log(`${usuario.rol.toUpperCase()}: ${usuario.username} / ${usuario.password}`);
    });

  } catch (error) {
    console.error('❌ Error al generar roles del sistema:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  generarRolesSistema()
    .then(() => {
      console.log('\n✅ Script ejecutado correctamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Error en el script:', error);
      process.exit(1);
    });
}

export default generarRolesSistema;
