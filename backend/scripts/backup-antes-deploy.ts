import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

async function crearBackup() {
  console.log('💾 Creando backup antes del deploy...');

  try {
    const fecha = new Date().toISOString().split('T')[0];
    const hora = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
    const timestamp = `${fecha}_${hora}`;
    
    const backupDir = path.join(__dirname, '..', 'backups');
    
    // Crear directorio de backups si no existe
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Backup de la base de datos (PostgreSQL)
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl) {
      console.log('📊 Creando backup de base de datos...');
      const backupFile = path.join(backupDir, `backup_${timestamp}.sql`);
      
      try {
        execSync(`pg_dump "${dbUrl}" > "${backupFile}"`, { stdio: 'inherit' });
        console.log(`✅ Backup de BD creado: ${backupFile}`);
      } catch (error) {
        console.log('⚠️ No se pudo crear backup automático de BD (pg_dump no disponible)');
        console.log('📝 Recomendación: Crear backup manual de la base de datos antes del deploy');
      }
    }

    // Backup del código actual
    console.log('📁 Creando backup del código...');
    const codeBackupFile = path.join(backupDir, `codigo_${timestamp}.tar.gz`);
    
    try {
      execSync(`tar -czf "${codeBackupFile}" --exclude=node_modules --exclude=dist --exclude=backups .`, { 
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
      });
      console.log(`✅ Backup de código creado: ${codeBackupFile}`);
    } catch (error) {
      console.log('⚠️ No se pudo crear backup de código (tar no disponible en Windows)');
      console.log('📝 Recomendación: Crear backup manual del código antes del deploy');
    }

    console.log('\n✅ Proceso de backup completado');
    console.log('📋 Archivos de backup en:', backupDir);

  } catch (error) {
    console.error('❌ Error durante el backup:', error);
    console.log('⚠️ Continúe con precaución o cree backups manuales');
  }
}

crearBackup();


