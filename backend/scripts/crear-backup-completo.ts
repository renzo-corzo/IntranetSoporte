import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function crearBackupCompleto() {
  console.log('💾 Creando backup completo del sistema...');
  
  const fecha = new Date().toISOString().split('T')[0];
  const hora = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
  const timestamp = `${fecha}_${hora}`;
  
  const backupDir = path.join(__dirname, 'backups');
  const backupFile = path.join(backupDir, `backup_completo_${timestamp}.json`);
  
  try {
    // Obtener todos los datos de la base de datos
    console.log('📊 Obteniendo datos de empleados...');
    const empleados = await prisma.empleado.findMany();
    
    console.log('📊 Obteniendo datos de usuarios...');
    const usuarios = await prisma.usuario.findMany();
    
    console.log('📊 Obteniendo datos de departamentos...');
    const departamentos = await prisma.departamento.findMany();
    
    console.log('📊 Obteniendo datos de vacaciones...');
    const vacaciones = await prisma.vacacion.findMany();
    
    console.log('📊 Obteniendo datos de licencias...');
    const licencias = await prisma.licencia.findMany();
    
    console.log('📊 Obteniendo datos de documentos...');
    const documentos = await prisma.documento.findMany();
    
    console.log('📊 Obteniendo datos de stock...');
    const stock = await prisma.stock.findMany();
    
    console.log('📊 Obteniendo datos de tareas...');
    const tareas = await prisma.tarea.findMany();
    
    console.log('📊 Obteniendo datos de procedimientos...');
    const procedimientos = await prisma.procedimiento.findMany();
    
    console.log('📊 Obteniendo datos de relevamientos...');
    const relevamientos = await prisma.relevamiento.findMany();
    
    console.log('📊 Obteniendo datos de KB...');
    const kb = await prisma.kB.findMany();
    
    console.log('📊 Obteniendo datos de links...');
    const links = await prisma.link.findMany();
    
    console.log('📊 Obteniendo datos de categorías de tareas...');
    const categoriaTareas = await prisma.categoriaTarea.findMany();
    
    // Crear objeto de backup
    const backupData = {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      sistema: 'Infraestructura Caja de Abogados',
      datos: {
        empleados,
        usuarios,
        departamentos,
        vacaciones,
        licencias,
        documentos,
        stock,
        tareas,
        procedimientos,
        relevamientos,
        kb,
        links,
        categoriaTareas
      },
      estadisticas: {
        totalEmpleados: empleados.length,
        totalUsuarios: usuarios.length,
        totalDepartamentos: departamentos.length,
        totalVacaciones: vacaciones.length,
        totalLicencias: licencias.length,
        totalDocumentos: documentos.length,
        totalStock: stock.length,
        totalTareas: tareas.length,
        totalProcedimientos: procedimientos.length,
        totalRelevamientos: relevamientos.length,
        totalKB: kb.length,
        totalLinks: links.length,
        totalCategoriaTareas: categoriaTareas.length
      }
    };
    
    // Guardar backup
    console.log('💾 Guardando backup...');
    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
    
    console.log(`✅ Backup completo creado: ${backupFile}`);
    console.log('📊 Estadísticas del backup:');
    console.log(`   - Empleados: ${backupData.estadisticas.totalEmpleados}`);
    console.log(`   - Usuarios: ${backupData.estadisticas.totalUsuarios}`);
    console.log(`   - Departamentos: ${backupData.estadisticas.totalDepartamentos}`);
    console.log(`   - Vacaciones: ${backupData.estadisticas.totalVacaciones}`);
    console.log(`   - Licencias: ${backupData.estadisticas.totalLicencias}`);
    console.log(`   - Documentos: ${backupData.estadisticas.totalDocumentos}`);
    console.log(`   - Stock: ${backupData.estadisticas.totalStock}`);
    console.log(`   - Tareas: ${backupData.estadisticas.totalTareas}`);
    console.log(`   - Procedimientos: ${backupData.estadisticas.totalProcedimientos}`);
    console.log(`   - Relevamientos: ${backupData.estadisticas.totalRelevamientos}`);
    console.log(`   - KB: ${backupData.estadisticas.totalKB}`);
    console.log(`   - Links: ${backupData.estadisticas.totalLinks}`);
    console.log(`   - Categorías de Tareas: ${backupData.estadisticas.totalCategoriaTareas}`);
    
  } catch (error) {
    console.error('❌ Error durante el backup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

crearBackupCompleto();


