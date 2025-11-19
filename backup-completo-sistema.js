const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function crearBackupCompleto() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + 
                   new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
  
  const backupDir = `backup_sistema_completo_${timestamp}`;
  
  console.log('💾 Iniciando backup completo del sistema...');
  console.log(`📁 Directorio de backup: ${backupDir}`);
  
  try {
    // Crear directorio de backup
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    // 1. Backup de la base de datos
    console.log('🗄️ Exportando datos de la base de datos...');
    
    const empleados = await prisma.empleado.findMany();
    const vacaciones = await prisma.vacacion.findMany({
      include: {
        empleado: true,
        decididoPor: true
      }
    });
    const usuarios = await prisma.usuario.findMany();
    
    const datosCompletos = {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      descripcion: 'Backup completo del sistema Infraestructura Caja de Abogados',
      datos: {
        empleados,
        vacaciones,
        usuarios
      },
      estadisticas: {
        totalEmpleados: empleados.length,
        totalVacaciones: vacaciones.length,
        totalUsuarios: usuarios.length,
        vacacionesPorEstado: {
          PENDIENTE: vacaciones.filter(v => v.estado === 'PENDIENTE').length,
          APROBADA: vacaciones.filter(v => v.estado === 'APROBADA').length,
          RECHAZADA: vacaciones.filter(v => v.estado === 'RECHAZADA').length,
          CANCELADA: vacaciones.filter(v => v.estado === 'CANCELADA').length
        },
        empleadosPorDepartamento: empleados.reduce((acc, emp) => {
          acc[emp.departamento] = (acc[emp.departamento] || 0) + 1;
          return acc;
        }, {})
      }
    };
    
    // Guardar datos de la base de datos
    fs.writeFileSync(
      path.join(backupDir, 'database_backup.json'), 
      JSON.stringify(datosCompletos, null, 2)
    );
    
    // 2. Backup de archivos de configuración
    console.log('⚙️ Copiando archivos de configuración...');
    
    const archivosConfig = [
      'backend/.env',
      'backend/package.json',
      'backend/tsconfig.json',
      'backend/prisma/schema.prisma',
      'frontend/.env',
      'frontend/package.json',
      'frontend/vite.config.ts',
      'frontend/tailwind.config.js',
      'README.md'
    ];
    
    for (const archivo of archivosConfig) {
      if (fs.existsSync(archivo)) {
        const destPath = path.join(backupDir, archivo);
        const destDir = path.dirname(destPath);
        
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, { recursive: true });
        }
        
        fs.copyFileSync(archivo, destPath);
        console.log(`✅ Copiado: ${archivo}`);
      } else {
        console.log(`⚠️ No encontrado: ${archivo}`);
      }
    }
    
    // 3. Backup del código fuente (excluyendo node_modules y dist)
    console.log('📁 Copiando código fuente...');
    
    const carpetasCodigo = ['backend/src', 'frontend/src'];
    
    for (const carpeta of carpetasCodigo) {
      if (fs.existsSync(carpeta)) {
        const destPath = path.join(backupDir, carpeta);
        copiarDirectorio(carpeta, destPath);
        console.log(`✅ Copiado: ${carpeta}`);
      }
    }
    
    // 4. Crear script de restauración
    console.log('🔧 Creando script de restauración...');
    
    const scriptRestauracion = `#!/usr/bin/env node
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function restaurarSistema() {
  try {
    console.log('🔄 Iniciando restauración del sistema...');
    
    // Leer datos del backup
    const backupData = JSON.parse(fs.readFileSync('database_backup.json', 'utf8'));
    console.log(\`📅 Backup del: \${backupData.timestamp}\`);
    console.log(\`📊 Empleados: \${backupData.estadisticas.totalEmpleados}\`);
    console.log(\`📊 Vacaciones: \${backupData.estadisticas.totalVacaciones}\`);
    console.log(\`📊 Usuarios: \${backupData.estadisticas.totalUsuarios}\`);
    
    // Limpiar tablas existentes
    console.log('🧹 Limpiando datos existentes...');
    await prisma.vacacion.deleteMany();
    await prisma.empleado.deleteMany();
    await prisma.usuario.deleteMany();
    
    // Restaurar empleados
    console.log('👥 Restaurando empleados...');
    for (const empleado of backupData.datos.empleados) {
      await prisma.empleado.create({
        data: {
          id: empleado.id,
          nombre: empleado.nombre,
          apellido: empleado.apellido,
          dni: empleado.dni,
          email: empleado.email,
          departamento: empleado.departamento,
          estado: empleado.estado,
          fechaIngreso: new Date(empleado.fechaIngreso),
          diasDisponibles: empleado.diasDisponibles,
          createdAt: new Date(empleado.createdAt),
          updatedAt: new Date(empleado.updatedAt)
        }
      });
    }
    
    // Restaurar usuarios
    console.log('👤 Restaurando usuarios...');
    for (const usuario of backupData.datos.usuarios) {
      await prisma.usuario.create({
        data: {
          id: usuario.id,
          nombre: usuario.nombre,
          email: usuario.email,
          password: usuario.password,
          rol: usuario.rol,
          activo: usuario.activo,
          createdAt: new Date(usuario.createdAt),
          updatedAt: new Date(usuario.updatedAt)
        }
      });
    }
    
    // Restaurar vacaciones
    console.log('🏖️ Restaurando vacaciones...');
    for (const vacacion of backupData.datos.vacaciones) {
      await prisma.vacacion.create({
        data: {
          id: vacacion.id,
          empleadoId: vacacion.empleadoId,
          fechaInicio: new Date(vacacion.fechaInicio),
          fechaFin: new Date(vacacion.fechaFin),
          diasSolicitados: vacacion.diasSolicitados,
          observaciones: vacacion.observaciones,
          estado: vacacion.estado,
          decididoPorId: vacacion.decididoPorId,
          comentarioDecision: vacacion.comentarioDecision,
          decididoEn: vacacion.decididoEn ? new Date(vacacion.decididoEn) : null,
          createdAt: new Date(vacacion.createdAt),
          updatedAt: new Date(vacacion.updatedAt)
        }
      });
    }
    
    console.log('✅ Restauración completada exitosamente!');
    console.log('🚀 Puedes iniciar el sistema con: npm run dev');
    
  } catch (error) {
    console.error('❌ Error durante la restauración:', error);
  } finally {
    await prisma.$disconnect();
  }
}

restaurarSistema();
`;
    
    fs.writeFileSync(
      path.join(backupDir, 'restaurar-sistema.js'), 
      scriptRestauracion
    );
    
    // 5. Crear README del backup
    const readmeBackup = `# Backup Completo del Sistema - ${timestamp}

## 📋 Información del Backup

- **Fecha**: ${new Date().toLocaleString('es-ES')}
- **Versión del Sistema**: 1.0.0
- **Descripción**: Backup completo del sistema Infraestructura Caja de Abogados

## 📊 Estadísticas

- **Total Empleados**: ${datosCompletos.estadisticas.totalEmpleados}
- **Total Vacaciones**: ${datosCompletos.estadisticas.totalVacaciones}
- **Total Usuarios**: ${datosCompletos.estadisticas.totalUsuarios}

### Vacaciones por Estado:
- Pendientes: ${datosCompletos.estadisticas.vacacionesPorEstado.PENDIENTE}
- Aprobadas: ${datosCompletos.estadisticas.vacacionesPorEstado.APROBADA}
- Rechazadas: ${datosCompletos.estadisticas.vacacionesPorEstado.RECHAZADA}
- Canceladas: ${datosCompletos.estadisticas.vacacionesPorEstado.CANCELADA}

### Empleados por Departamento:
${Object.entries(datosCompletos.estadisticas.empleadosPorDepartamento).map(([dept, count]) => `- ${dept}: ${count}`).join('\n')}

## 📁 Contenido del Backup

- \`database_backup.json\` - Datos completos de la base de datos
- \`restaurar-sistema.js\` - Script para restaurar el sistema
- \`backend/\` - Configuración y código del backend
- \`frontend/\` - Configuración y código del frontend
- \`README.md\` - Este archivo

## 🔄 Cómo Restaurar

1. Instalar dependencias:
   \`\`\`bash
   cd backend && npm install
   cd ../frontend && npm install
   \`\`\`

2. Configurar base de datos:
   \`\`\`bash
   cd backend
   npx prisma generate
   npx prisma db push
   \`\`\`

3. Restaurar datos:
   \`\`\`bash
   node restaurar-sistema.js
   \`\`\`

4. Iniciar sistema:
   \`\`\`bash
   # Backend
   cd backend && npm run dev
   
   # Frontend (en otra terminal)
   cd frontend && npm run dev
   \`\`\`

## ✅ Estado del Sistema

El sistema está completamente funcional con:
- ✅ Módulo de Empleados
- ✅ Módulo de Vacaciones con calendario
- ✅ Filtros por estado y departamento
- ✅ Sistema de aprobación/rechazo
- ✅ Autenticación JWT
- ✅ Interfaz responsive

---
*Backup generado automáticamente por el sistema Infraestructura Caja de Abogados*
`;
    
    fs.writeFileSync(
      path.join(backupDir, 'README_BACKUP.md'), 
      readmeBackup
    );
    
    console.log('\n✅ BACKUP COMPLETADO EXITOSAMENTE!');
    console.log(`📁 Directorio: ${backupDir}`);
    console.log(`📊 Empleados: ${datosCompletos.estadisticas.totalEmpleados}`);
    console.log(`📊 Vacaciones: ${datosCompletos.estadisticas.totalVacaciones}`);
    console.log(`📊 Usuarios: ${datosCompletos.estadisticas.totalUsuarios}`);
    console.log('\n📋 Archivos incluidos:');
    console.log('  - database_backup.json (datos completos)');
    console.log('  - restaurar-sistema.js (script de restauración)');
    console.log('  - README_BACKUP.md (documentación)');
    console.log('  - backend/ (código y configuración)');
    console.log('  - frontend/ (código y configuración)');
    
  } catch (error) {
    console.error('❌ Error durante el backup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

function copiarDirectorio(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const items = fs.readdirSync(src);
  
  for (const item of items) {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    
    if (fs.statSync(srcPath).isDirectory()) {
      // Excluir node_modules y dist
      if (item !== 'node_modules' && item !== 'dist') {
        copiarDirectorio(srcPath, destPath);
      }
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

crearBackupCompleto();


