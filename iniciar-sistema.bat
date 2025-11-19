@echo off
echo ========================================
echo   🚀 INFRAESTRUCTURA CAJA DE ABOGADOS
echo ========================================
echo.
echo Iniciando servicios...

REM Iniciar Backend
echo 🔧 Iniciando Backend...
start "Backend" cmd /k "cd backend && npm run dev"

REM Esperar un momento
timeout /t 3 /nobreak >nul

REM Iniciar Frontend
echo 🌐 Iniciando Frontend...
start "Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo   ✅ SERVICIOS INICIADOS
echo ========================================
echo.
echo 📡 Backend:  http://localhost:4001
echo 🌐 Frontend: http://localhost:5174
echo.
echo 💡 Para detener los servicios, cierra las ventanas de terminal
echo.
pause


