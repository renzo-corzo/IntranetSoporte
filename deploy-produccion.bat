@echo off
REM Script de deploy a producción - Flujo Híbrido
REM 1. Commit local
REM 2. Push a GitHub
REM 3. Deploy directo a producción

echo ========================================
echo   DEPLOY A PRODUCCION - FLUJO HIBRIDO
echo ========================================
echo.

REM Verificar que estamos en el directorio correcto
if not exist "backend" (
    echo ERROR: No se encuentra el directorio backend
    echo Asegurate de estar en la raiz del proyecto
    pause
    exit /b 1
)

echo [1/5] Verificando estado de Git...
git status
echo.

REM Preguntar si hacer commit
set /p hacerCommit="¿Deseas hacer commit de los cambios? (S/N): "
if /i "%hacerCommit%"=="S" (
    set /p mensajeCommit="Ingresa el mensaje del commit: "
    if "%mensajeCommit%"=="" (
        set mensajeCommit=Actualizacion automatica
    )
    
    echo [2/5] Agregando archivos al staging...
    git add .
    
    echo [3/5] Haciendo commit...
    git commit -m "%mensajeCommit%"
    
    echo [4/5] Subiendo a GitHub...
    git push origin main
    if errorlevel 1 (
        echo ERROR: No se pudo hacer push a GitHub
        echo Verifica tu conexion y credenciales
        pause
        exit /b 1
    )
    echo ✓ Commit y push completados
) else (
    echo Saltando commit y push...
)

echo.
echo [5/5] Desplegando a produccion...
echo.

REM Copiar archivos del backend
echo Copiando archivos del backend...
scp -P 22 backend/src/index.ts intranet@192.168.123.147:/opt/infra-caja/backend/src/ 2>nul
if errorlevel 1 (
    echo ADVERTENCIA: No se pudo copiar index.ts
)

REM Copiar archivos del frontend
echo Copiando archivos del frontend...
scp -P 22 frontend/src/pages/Stock.tsx intranet@192.168.123.147:/opt/infra-caja/frontend/src/pages/ 2>nul
scp -P 22 frontend/src/components/*.tsx intranet@192.168.123.147:/opt/infra-caja/frontend/src/components/ 2>nul

REM Compilar y reiniciar en producción
echo.
echo Compilando y reiniciando servicios en produccion...
ssh -p 22 intranet@192.168.123.147 "cd /opt/infra-caja/backend && npm run build && pm2 restart infra-backend-prod && cd /opt/infra-caja/frontend && npm run build"

if errorlevel 1 (
    echo ERROR: No se pudo desplegar a produccion
    pause
    exit /b 1
)

echo.
echo ========================================
echo   DEPLOY COMPLETADO EXITOSAMENTE
echo ========================================
echo.
echo ✓ Cambios commiteados (si se selecciono)
echo ✓ Cambios subidos a GitHub (si se selecciono)
echo ✓ Archivos copiados a produccion
echo ✓ Servicios compilados y reiniciados
echo.
pause

