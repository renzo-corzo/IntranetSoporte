# Script para iniciar los servicios de Infraestructura Caja de Abogados
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  🚀 INFRAESTRUCTURA CAJA DE ABOGADOS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que estamos en el directorio correcto
if (-not (Test-Path "backend" -PathType Container) -or -not (Test-Path "frontend" -PathType Container)) {
    Write-Host "❌ Error: Este script debe ejecutarse desde la raíz del proyecto" -ForegroundColor Red
    Write-Host "   Asegúrate de estar en el directorio que contiene las carpetas 'backend' y 'frontend'" -ForegroundColor Yellow
    Read-Host "Presiona Enter para salir"
    exit 1
}

Write-Host "✅ Directorio correcto detectado" -ForegroundColor Green
Write-Host ""

# Iniciar Backend
Write-Host "🔧 Iniciando Backend..." -ForegroundColor Yellow
Write-Host "   Puerto: 4001" -ForegroundColor Gray
Write-Host "   URL: http://localhost:4001" -ForegroundColor Gray
Write-Host ""

$backendPath = Join-Path $PWD "backend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; npm run dev"

# Esperar un poco para que el backend se inicie
Start-Sleep -Seconds 3

# Iniciar Frontend
Write-Host "🎨 Iniciando Frontend..." -ForegroundColor Yellow
Write-Host "   Puerto: 5174" -ForegroundColor Gray
Write-Host "   URL: http://localhost:5174" -ForegroundColor Gray
Write-Host ""

$frontendPath = Join-Path $PWD "frontend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; npm run dev"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ✅ SERVICIOS INICIADOS" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🌐 URLs disponibles:" -ForegroundColor White
Write-Host "   • Backend:  http://localhost:4001" -ForegroundColor Cyan
Write-Host "   • Frontend: http://localhost:5174" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 Para verificar el estado:" -ForegroundColor White
Write-Host "   • Backend:  http://localhost:4001/health" -ForegroundColor Gray
Write-Host "   • Frontend: http://localhost:5174" -ForegroundColor Gray
Write-Host ""
Write-Host "🛑 Para detener los servicios, cierra las ventanas de terminal" -ForegroundColor Yellow
Write-Host ""
Read-Host "Presiona Enter para continuar"


