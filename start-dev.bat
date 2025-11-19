@echo off
echo ========================================
echo   🚀 INFRAESTRUCTURA CAJA DE ABOGADOS
echo ========================================
echo.
echo Iniciando servicios de desarrollo...
echo.

REM Verificar que Node.js esté instalado
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Error: Node.js no está instalado
    echo Por favor instala Node.js desde https://nodejs.org/
    pause
    exit /b 1
)

REM Verificar que npm esté instalado
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Error: npm no está instalado
    pause
    exit /b 1
)

echo ✅ Node.js y npm detectados
echo.

REM Iniciar Backend
echo 🔧 Iniciando Backend (Puerto 4001)...
start "Backend - Infra Caja" cmd /k "cd backend && echo 🚀 Iniciando Backend... && npm run dev"

REM Esperar un momento para que el backend inicie
timeout /t 3 /nobreak >nul

REM Iniciar Frontend
echo 🌐 Iniciando Frontend (Puerto 5174)...
start "Frontend - Infra Caja" cmd /k "cd frontend && echo 🌐 Iniciando Frontend... && npm run dev"

REM Esperar un momento
timeout /t 2 /nobreak >nul

echo.
echo ========================================
echo   ✅ SERVICIOS INICIADOS CORRECTAMENTE
echo ========================================
echo.
echo 📡 Backend:  http://localhost:4001
echo 🌐 Frontend: http://localhost:5174
echo 📊 API:      http://localhost:4001/api
echo.
echo 💡 Para detener los servicios, cierra las ventanas de terminal
echo.
pause