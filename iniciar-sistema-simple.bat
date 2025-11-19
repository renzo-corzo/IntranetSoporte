@echo off
title Infraestructura Caja de Abogados - Sistema Completo

echo ========================================
echo   🚀 INFRAESTRUCTURA CAJA DE ABOGADOS
echo ========================================
echo.

echo 🔧 Iniciando Backend...
start "Backend Infra Caja" cmd /k "cd /d %~dp0backend && npm run dev"

echo.
echo ⏳ Esperando 5 segundos para que el backend se inicie...
timeout /t 5 /nobreak >nul

echo 🎨 Iniciando Frontend...
start "Frontend Infra Caja" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ========================================
echo   ✅ SERVICIOS INICIADOS
echo ========================================
echo.
echo 🌐 URLs disponibles:
echo    • Backend:  http://localhost:4001
echo    • Frontend: http://localhost:5174
echo.
echo 📊 Para verificar el estado:
echo    • Backend:  http://localhost:4001/health
echo    • Frontend: http://localhost:5174
echo.
echo 🛑 Para detener los servicios, cierra las ventanas de terminal
echo.
pause


