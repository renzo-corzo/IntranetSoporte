# Script de deploy a producción - Flujo Híbrido (PowerShell)
# 1. Commit local
# 2. Push a GitHub
# 3. Deploy directo a producción

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DEPLOY A PRODUCCION - FLUJO HIBRIDO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que estamos en el directorio correcto
if (-not (Test-Path "backend")) {
    Write-Host "ERROR: No se encuentra el directorio backend" -ForegroundColor Red
    Write-Host "Asegurate de estar en la raiz del proyecto" -ForegroundColor Red
    Read-Host "Presiona Enter para salir"
    exit 1
}

Write-Host "[1/5] Verificando estado de Git..." -ForegroundColor Yellow
git status
Write-Host ""

# Preguntar si hacer commit
$hacerCommit = Read-Host "¿Deseas hacer commit de los cambios? (S/N)"
if ($hacerCommit -eq "S" -or $hacerCommit -eq "s") {
    $mensajeCommit = Read-Host "Ingresa el mensaje del commit"
    if ([string]::IsNullOrWhiteSpace($mensajeCommit)) {
        $mensajeCommit = "Actualizacion automatica"
    }
    
    Write-Host "[2/5] Agregando archivos al staging..." -ForegroundColor Yellow
    git add .
    
    Write-Host "[3/5] Haciendo commit..." -ForegroundColor Yellow
    git commit -m $mensajeCommit
    
    Write-Host "[4/5] Subiendo a GitHub..." -ForegroundColor Yellow
    git push origin main
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: No se pudo hacer push a GitHub" -ForegroundColor Red
        Write-Host "Verifica tu conexion y credenciales" -ForegroundColor Red
        Read-Host "Presiona Enter para salir"
        exit 1
    }
    Write-Host "✓ Commit y push completados" -ForegroundColor Green
} else {
    Write-Host "Saltando commit y push..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[5/5] Desplegando a produccion..." -ForegroundColor Yellow
Write-Host ""

# Función para copiar archivos
function Copy-ToProduction {
    param(
        [string]$LocalPath,
        [string]$RemotePath
    )
    
    Write-Host "Copiando: $LocalPath -> $RemotePath" -ForegroundColor Gray
    scp -P 22 $LocalPath "intranet@192.168.123.147:$RemotePath" 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ADVERTENCIA: No se pudo copiar $LocalPath" -ForegroundColor Yellow
    }
}

# Copiar archivos modificados (puedes personalizar esta lista)
# Backend
Copy-ToProduction "backend/src/index.ts" "/opt/infra-caja/backend/src/"

# Frontend - copiar solo si existen cambios
if (Test-Path "frontend/src/pages/Stock.tsx") {
    Copy-ToProduction "frontend/src/pages/Stock.tsx" "/opt/infra-caja/frontend/src/pages/"
}

# Compilar y reiniciar en producción
Write-Host ""
Write-Host "Compilando y reiniciando servicios en produccion..." -ForegroundColor Yellow
ssh -p 22 intranet@192.168.123.147 "cd /opt/infra-caja/backend && npm run build && pm2 restart infra-backend-prod && cd /opt/infra-caja/frontend && npm run build"

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: No se pudo desplegar a produccion" -ForegroundColor Red
    Read-Host "Presiona Enter para salir"
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  DEPLOY COMPLETADO EXITOSAMENTE" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "✓ Cambios commiteados (si se selecciono)" -ForegroundColor Green
Write-Host "✓ Cambios subidos a GitHub (si se selecciono)" -ForegroundColor Green
Write-Host "✓ Archivos copiados a produccion" -ForegroundColor Green
Write-Host "✓ Servicios compilados y reiniciados" -ForegroundColor Green
Write-Host ""
Read-Host "Presiona Enter para continuar"

