const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function limpiarDuplicados() {
  try {
    console.log('🧹 Iniciando limpieza de empleados duplicados...');
    
    // Conectar a la base de datos
    await prisma.$connect();
    console.log('✅ Conectado a la base de datos');

    // Obtener todos los empleados ordenados por fecha de creación
    const empleados = await prisma.empleado.findMany({
      orderBy: [
        { nombre: 'asc' },
        { apellido: 'asc' },
        { createdAt: 'asc' } // Los más antiguos primero
      ]
    });

    console.log(`📋 Total de empleados antes de limpiar: ${empleados.length}`);

    // Agrupar por nombre completo
    const grupos = {};
    empleados.forEach(empleado => {
      const nombreCompleto = `${empleado.nombre} ${empleado.apellido}`.toUpperCase();
      if (!grupos[nombreCompleto]) {
        grupos[nombreCompleto] = [];
      }
      grupos[nombreCompleto].push(empleado);
    });

    // Identificar duplicados y mantener solo el primero (más antiguo)
    const idsAEliminar = [];
    const empleadosAMantener = [];

    Object.keys(grupos).forEach(nombre => {
      const empleadosDelGrupo = grupos[nombre];
      if (empleadosDelGrupo.length > 1) {
        // Ordenar por fecha de creación (más antiguo primero)
        empleadosDelGrupo.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        
        // Mantener el primero (más antiguo)
        const empleadoAMantener = empleadosDelGrupo[0];
        empleadosAMantener.push(empleadoAMantener);
        
        // Marcar los demás para eliminar
        empleadosDelGrupo.slice(1).forEach(emp => {
          idsAEliminar.push(emp.id);
        });

        console.log(`👥 ${nombre}:`);
        console.log(`   ✅ Mantener: ${empleadoAMantener.email} (${empleadoAMantener.createdAt.toLocaleString('es-AR')})`);
        empleadosDelGrupo.slice(1).forEach(emp => {
          console.log(`   ❌ Eliminar: ${emp.email} (${emp.createdAt.toLocaleString('es-AR')})`);
        });
      } else {
        // Si solo hay uno, mantenerlo
        empleadosAMantener.push(empleadosDelGrupo[0]);
      }
    });

    console.log(`\n📊 RESUMEN DE LIMPIEZA:`);
    console.log(`   Empleados únicos: ${empleadosAMantener.length}`);
    console.log(`   Registros a eliminar: ${idsAEliminar.length}`);
    console.log(`   Total después de limpiar: ${empleadosAMantener.length}`);

    if (idsAEliminar.length === 0) {
      console.log('✅ No hay duplicados para eliminar');
      return;
    }

    // Confirmar antes de eliminar
    console.log('\n⚠️  ADVERTENCIA: Esta operación eliminará registros de la base de datos');
    console.log('📝 Registros que se eliminarán:');
    idsAEliminar.forEach((id, index) => {
      const emp = empleados.find(e => e.id === id);
      console.log(`   ${index + 1}. ${emp.nombre} ${emp.apellido} - ${emp.email}`);
    });

    // Crear backup antes de eliminar
    const fs = require('fs');
    const path = require('path');
    
    const backupDir = path.join(__dirname, 'exports');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const backupFile = path.join(backupDir, `backup_antes_limpieza_${timestamp}.json`);
    
    const backupData = {
      fechaBackup: new Date().toISOString(),
      totalEmpleados: empleados.length,
      empleadosAEliminar: idsAEliminar.map(id => {
        const emp = empleados.find(e => e.id === id);
        return {
          id: emp.id,
          nombre: emp.nombre,
          apellido: emp.apellido,
          email: emp.email,
          dni: emp.dni,
          departamento: emp.departamento,
          fechaCreacion: emp.createdAt.toISOString()
        };
      }),
      empleadosAMantener: empleadosAMantener.map(emp => ({
        id: emp.id,
        nombre: emp.nombre,
        apellido: emp.apellido,
        email: emp.email,
        dni: emp.dni,
        departamento: emp.departamento,
        fechaCreacion: emp.createdAt.toISOString()
      }))
    };

    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2), 'utf8');
    console.log(`\n💾 Backup creado en: ${backupFile}`);

    // Eliminar duplicados
    console.log('\n🗑️  Eliminando registros duplicados...');
    
    const resultado = await prisma.empleado.deleteMany({
      where: {
        id: {
          in: idsAEliminar
        }
      }
    });

    console.log(`✅ Eliminados ${resultado.count} registros duplicados`);

    // Verificar resultado final
    const empleadosFinales = await prisma.empleado.findMany({
      orderBy: [
        { nombre: 'asc' },
        { apellido: 'asc' }
      ]
    });

    console.log(`\n🎉 LIMPIEZA COMPLETADA:`);
    console.log(`   Empleados finales: ${empleadosFinales.length}`);
    console.log(`   Registros eliminados: ${resultado.count}`);
    console.log(`   Empleados únicos: ${empleadosFinales.length}`);

    // Generar reporte final
    const reporteFinal = {
      fechaLimpieza: new Date().toISOString(),
      empleadosAntes: empleados.length,
      empleadosDespues: empleadosFinales.length,
      registrosEliminados: resultado.count,
      empleadosFinales: empleadosFinales.map(emp => ({
        id: emp.id,
        nombre: emp.nombre,
        apellido: emp.apellido,
        email: emp.email,
        dni: emp.dni,
        departamento: emp.departamento,
        estado: emp.estado,
        fechaIngreso: emp.fechaIngreso.toISOString(),
        fechaCreacion: emp.createdAt.toISOString()
      }))
    };

    const reporteFile = path.join(backupDir, `reporte_limpieza_${timestamp}.json`);
    fs.writeFileSync(reporteFile, JSON.stringify(reporteFinal, null, 2), 'utf8');
    console.log(`📁 Reporte final guardado en: ${reporteFile}`);

    return {
      eliminados: resultado.count,
      finales: empleadosFinales.length,
      backup: backupFile,
      reporte: reporteFile
    };

  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Desconectado de la base de datos');
  }
}

// Ejecutar limpieza
if (require.main === module) {
  limpiarDuplicados()
    .then((resultado) => {
      console.log('\n🎉 Limpieza de duplicados completada exitosamente!');
      console.log(`📊 Resultado: ${resultado.eliminados} eliminados, ${resultado.finales} empleados únicos`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Error en la limpieza:', error);
      process.exit(1);
    });
}

module.exports = { limpiarDuplicados };


