@echo off
echo ========================================
echo   🔧 BACKEND - INFRA CAJA DE ABOGADOS
echo ========================================
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

REM Cambiar al directorio backend
cd backend

REM Verificar que package.json existe
if not exist package.json (
    echo ❌ Error: package.json no encontrado en el directorio backend
    pause
    exit /b 1
)

REM Verificar que node_modules existe
if not exist node_modules (
    echo 📦 Instalando dependencias...
    npm install
    if errorlevel 1 (
        echo ❌ Error al instalar dependencias
        pause
        exit /b 1
    )
)

echo 🚀 Iniciando Backend...
echo 📡 Puerto: 4001
echo 🌐 URL: http://localhost:4001
echo 📊 API: http://localhost:4001/api
echo.

npm run dev

pause