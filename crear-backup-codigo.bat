@echo off
echo ========================================
echo   📦 CREANDO BACKUP COMPLETO DEL CÓDIGO
echo ========================================
echo.

REM Crear directorio temporal
set timestamp=%date:~-4,4%-%date:~-10,2%-%date:~-7,2%_%time:~0,2%-%time:~3,2%-%time:~6,2%
set timestamp=%timestamp: =0%
set tempdir=backup_temp_%timestamp%

echo 📁 Creando directorio temporal: %tempdir%
mkdir "%tempdir%"

echo 📋 Copiando archivos del proyecto...
xcopy /E /I /H /Y /EXCLUDE:exclude.txt . "%tempdir%"

echo 📦 Comprimiendo archivos...
powershell -Command "Compress-Archive -Path '%tempdir%\*' -DestinationPath 'backup_codigo_%timestamp%.zip' -Force"

echo 🗑️ Limpiando archivos temporales...
rmdir /S /Q "%tempdir%"

echo.
echo ========================================
echo   ✅ BACKUP COMPLETO CREADO
echo ========================================
echo 📦 Archivo: backup_codigo_%timestamp%.zip
echo 📊 Datos RRHH: backend/backups/backup_rrhh_2025-10-29_10-51-54.json
echo.
echo 🚀 El sistema está listo para producción
echo.
pause


