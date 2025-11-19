# Script de backup completo para Windows (local)
# Ejecutar desde el directorio del proyecto

$BackupDir = "backup_sistema_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
$BackupPath = ".\$BackupDir"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "BACKUP COMPLETO DEL SISTEMA" -ForegroundColor Cyan
Write-Host "Fecha: $(Get-Date)" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Crear directorios
New-Item -ItemType Directory -Force -Path "$BackupPath\database" | Out-Null
New-Item -ItemType Directory -Force -Path "$BackupPath\code" | Out-Null
New-Item -ItemType Directory -Force -Path "$BackupPath\config" | Out-Null
New-Item -ItemType Directory -Force -Path "$BackupPath\scripts" | Out-Null

Write-Host "[$(Get-Date)] Iniciando backup..." -ForegroundColor Yellow

# 1. Backup del código fuente
Write-Host "[$(Get-Date)] 1. Respaldando código fuente..." -ForegroundColor Yellow

# Backend
if (Test-Path ".\backend") {
    Compress-Archive -Path ".\backend\*" -DestinationPath "$BackupPath\code\backend.zip" -Force
    Write-Host "[$(Get-Date)] ✅ Código backend respaldado" -ForegroundColor Green
}

# Frontend
if (Test-Path ".\frontend") {
    Compress-Archive -Path ".\frontend\*" -DestinationPath "$BackupPath\code\frontend.zip" -Force
    Write-Host "[$(Get-Date)] ✅ Código frontend respaldado" -ForegroundColor Green
}

# Scripts
if (Test-Path ".\scripts") {
    Compress-Archive -Path ".\scripts\*" -DestinationPath "$BackupPath\scripts\scripts.zip" -Force
    Write-Host "[$(Get-Date)] ✅ Scripts respaldados" -ForegroundColor Green
}

# 2. Backup de configuraciones
Write-Host "[$(Get-Date)] 2. Respaldando configuraciones..." -ForegroundColor Yellow

if (Test-Path ".\backend\.env") {
    Copy-Item ".\backend\.env" "$BackupPath\config\backend.env" -Force
}
if (Test-Path ".\frontend\.env") {
    Copy-Item ".\frontend\.env" "$BackupPath\config\frontend.env" -Force
}
if (Test-Path "\.gitignore") {
    Copy-Item "\.gitignore" "$BackupPath\config\.gitignore" -Force
}

Write-Host "[$(Get-Date)] ✅ Configuraciones respaldadas" -ForegroundColor Green

# 3. Crear README
$ReadmeContent = @"
BACKUP COMPLETO DEL SISTEMA
============================
Fecha: $(Get-Date)
Sistema: Infra Caja - Sistema de Gestión

CONTENIDO:
----------
- code/: Código fuente (backend y frontend)
- config/: Archivos de configuración
- scripts/: Scripts de utilidades

NOTAS:
------
- Los node_modules NO están incluidos (instalar con npm install)
- Las configuraciones sensibles (.env) están incluidas
- Para restaurar, descomprimir los archivos .zip en sus ubicaciones correspondientes
"@

$ReadmeContent | Out-File -FilePath "$BackupPath\README.txt" -Encoding UTF8

# 4. Comprimir todo
Write-Host "[$(Get-Date)] 3. Comprimiendo backup completo..." -ForegroundColor Yellow
$ZipFile = ".\${BackupDir}.zip"
Compress-Archive -Path "$BackupPath\*" -DestinationPath $ZipFile -Force

if ($?) {
    $Size = (Get-Item $ZipFile).Length / 1MB
    Write-Host "[$(Get-Date)] ✅ Backup comprimido: $ZipFile" -ForegroundColor Green
    Write-Host "[$(Get-Date)] Tamaño: $([math]::Round($Size, 2)) MB" -ForegroundColor Green
} else {
    Write-Host "[$(Get-Date)] ❌ Error al comprimir backup" -ForegroundColor Red
}

# Limpiar directorio temporal
Remove-Item -Path $BackupPath -Recurse -Force

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "[$(Get-Date)] BACKUP COMPLETADO" -ForegroundColor Green
Write-Host "Ubicación: $ZipFile" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

