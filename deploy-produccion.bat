@echo off
setlocal EnableExtensions EnableDelayedExpansion

REM Deploy a produccion (alineado con deploy-produccion.ps1)
REM Omitir build local: set SKIP_LOCAL_BUILD=1 antes de ejecutar
REM Omitir npm install remoto: set SKIP_REMOTE_NPM=1 (solo si no cambiaron dependencias)
REM Dependencias: con package-lock.json -> npm ci; sin lockfile -> npm install (ver scripts/deploy-remote.sh)

set "REMOTE_HOST=192.168.123.147"
set "REMOTE_USER=intranet"
set "REMOTE_PORT=22"
set "REMOTE_BASE=/opt/infra-caja"

echo ========================================
echo   DEPLOY A PRODUCCION
echo ========================================
echo.

if not exist "backend\" (
    echo ERROR: No se encuentra el directorio backend
    echo Ejecuta este script desde la raiz del proyecto
    pause
    exit /b 1
)

if not exist "frontend\" (
    echo ERROR: No se encuentra el directorio frontend
    pause
    exit /b 1
)

if not exist "backend\prisma\schema.prisma" (
    echo ERROR: Falta backend\prisma\schema.prisma
    pause
    exit /b 1
)

if not exist "scripts\deploy-remote.sh" (
    echo ERROR: Falta scripts\deploy-remote.sh
    pause
    exit /b 1
)

for %%F in (backend\package.json backend\tsconfig.json frontend\package.json frontend\vite.config.ts) do (
    if not exist "%%~F" (
        echo ERROR: Falta archivo requerido: %%F
        pause
        exit /b 1
    )
)

where git >nul 2>&1
if errorlevel 1 (
    echo ERROR: git no esta en PATH
    pause
    exit /b 1
)
where ssh >nul 2>&1
if errorlevel 1 (
    echo ERROR: ssh no esta en PATH
    pause
    exit /b 1
)
where scp >nul 2>&1
if errorlevel 1 (
    echo ERROR: scp no esta en PATH
    pause
    exit /b 1
)

if "%SKIP_LOCAL_BUILD%"=="1" (
    echo [0] Omitiendo compilacion local ^(SKIP_LOCAL_BUILD=1^).
    goto :after_local_build
)

where npm >nul 2>&1
if errorlevel 1 (
    echo ADVERTENCIA: npm no esta en PATH; no se validara build local.
    goto :after_local_build
)

echo [0] Validando compilacion local ^(backend + frontend^)...
pushd backend
call npm run build
if errorlevel 1 (
    echo ERROR: npm run build ^(backend^) fallo
    popd
    pause
    exit /b 1
)
popd

pushd frontend
call npm run build
if errorlevel 1 (
    echo ERROR: npm run build ^(frontend^) fallo
    popd
    pause
    exit /b 1
)
popd
echo OK: Builds locales exitosos.

:after_local_build
echo.
echo [1/6] Verificando estado de Git...
git status
echo.

set /p hacerCommit="Deseas hacer commit de los cambios? (S/N): "
if /i not "%hacerCommit%"=="S" goto :skip_git

set /p mensajeCommit="Ingresa el mensaje del commit: "
if "%mensajeCommit%"=="" set mensajeCommit=Actualizacion automatica

echo [2/6] Agregando archivos al staging...
git add .

echo [3/6] Haciendo commit...
git commit -m "%mensajeCommit%"
if errorlevel 1 (
    echo ERROR: git commit fallo ^(sin cambios o conflicto^).
    pause
    exit /b 1
)

echo [4/6] Subiendo a GitHub...
git push origin main
if errorlevel 1 (
    echo ERROR: No se pudo hacer push a GitHub
    pause
    exit /b 1
)
echo OK: Commit y push completados
goto :after_git

:skip_git
echo Saltando commit y push...

:after_git
echo.
echo [5/6] Creando backup en produccion...
ssh -p %REMOTE_PORT% %REMOTE_USER%@%REMOTE_HOST% "cd %REMOTE_BASE% && mkdir -p backups && tar czf backups/backup_pre_deploy_$(date +%%Y%%m%%d_%%H%%M%%S).tar.gz backend/src frontend/src backend/prisma backend/package.json frontend/package.json backend/tsconfig.json frontend/vite.config.ts 2>/dev/null && echo Backup creado"
if errorlevel 1 (
    echo ERROR: backup remoto fallo
    pause
    exit /b 1
)

echo.
echo [6/6] Desplegando a produccion...
echo.

echo Copiando backend/src...
scp -P %REMOTE_PORT% -r backend/src %REMOTE_USER%@%REMOTE_HOST%:%REMOTE_BASE%/backend/
if errorlevel 1 goto :scp_fail

echo Copiando backend/prisma...
scp -P %REMOTE_PORT% -r backend/prisma %REMOTE_USER%@%REMOTE_HOST%:%REMOTE_BASE%/backend/
if errorlevel 1 goto :scp_fail

echo Copiando backend/package.json...
scp -P %REMOTE_PORT% backend/package.json %REMOTE_USER%@%REMOTE_HOST%:%REMOTE_BASE%/backend/
if errorlevel 1 goto :scp_fail

echo Copiando backend/tsconfig.json...
scp -P %REMOTE_PORT% backend/tsconfig.json %REMOTE_USER%@%REMOTE_HOST%:%REMOTE_BASE%/backend/
if errorlevel 1 goto :scp_fail

echo Copiando frontend/src...
scp -P %REMOTE_PORT% -r frontend/src %REMOTE_USER%@%REMOTE_HOST%:%REMOTE_BASE%/frontend/
if errorlevel 1 goto :scp_fail

echo Copiando frontend/package.json...
scp -P %REMOTE_PORT% frontend/package.json %REMOTE_USER%@%REMOTE_HOST%:%REMOTE_BASE%/frontend/
if errorlevel 1 goto :scp_fail

echo Copiando frontend/vite.config.ts...
scp -P %REMOTE_PORT% frontend/vite.config.ts %REMOTE_USER%@%REMOTE_HOST%:%REMOTE_BASE%/frontend/
if errorlevel 1 goto :scp_fail

if exist "backend\package-lock.json" (
    echo Copiando backend/package-lock.json...
    scp -P %REMOTE_PORT% backend/package-lock.json %REMOTE_USER%@%REMOTE_HOST%:%REMOTE_BASE%/backend/
    if errorlevel 1 goto :scp_fail
)

if exist "frontend\package-lock.json" (
    echo Copiando frontend/package-lock.json...
    scp -P %REMOTE_PORT% frontend/package-lock.json %REMOTE_USER%@%REMOTE_HOST%:%REMOTE_BASE%/frontend/
    if errorlevel 1 goto :scp_fail
)

echo Copiando scripts/deploy-remote.sh...
scp -P %REMOTE_PORT% scripts/deploy-remote.sh %REMOTE_USER%@%REMOTE_HOST%:/tmp/infra-caja-deploy.sh
if errorlevel 1 goto :scp_fail

if "%SKIP_REMOTE_NPM%"=="1" (
    echo ADVERTENCIA: SKIP_REMOTE_NPM=1 - no se ejecuta npm install/ci en servidor.
)

echo.
echo Ejecutando deploy remoto ^(deps, Prisma, build, validacion^)...
ssh -p %REMOTE_PORT% %REMOTE_USER%@%REMOTE_HOST% "sed -i 's/\r$//' /tmp/infra-caja-deploy.sh && chmod +x /tmp/infra-caja-deploy.sh && export REMOTE_BASE='%REMOTE_BASE%' SKIP_REMOTE_NPM='%SKIP_REMOTE_NPM%' && /tmp/infra-caja-deploy.sh"
if errorlevel 1 (
    echo ERROR: deploy remoto fallo
    pause
    exit /b 1
)

echo.
echo ========================================
echo   DEPLOY COMPLETADO
echo ========================================
echo.
echo Post-deploy sugerido:
echo   Login, /api/auth/me, Stock, CMDB, RRHH segun rol.
echo   Si cambio schema.prisma: ejecutar en servidor con backup DB: npx prisma db push ^(o flujo acordado^).
echo.
pause
exit /b 0

:scp_fail
echo ERROR: Fallo scp. Verifica red, claves SSH y rutas remotas.
pause
exit /b 1
