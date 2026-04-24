# Script de deploy a produccion - Flujo hibrido (PowerShell)
# Logica remota: scripts/deploy-remote.sh (se copia a /tmp/infra-caja-deploy.sh en el servidor)
#
# Dependencias remotas:
#   - Si existe package-lock.json en backend/frontend -> npm ci (reproducible).
#   - Si no -> npm install (este repo puede no tener lockfile versionado).
#   Omitir instalacion remota (solo build; riesgo de desalineacion): $env:SKIP_REMOTE_NPM = "1"
#
# Prisma:
#   - Se copia backend/prisma; en servidor: prisma generate + validate antes del build backend.
#   - Cambios de modelo en DB: NO se ejecuta migrate/db push aqui; hacerlo manualmente en ventana
#     de mantenimiento (npx prisma db push o flujo acordado). Ver mensaje final.
#
# Pre-deploy local: $env:SKIP_LOCAL_BUILD = "1" para omitir npm run build local.

$RemoteHost = "192.168.123.147"
$RemoteUser = "intranet"
$RemoteSshPort = 22
$RemoteBase = "/opt/infra-caja"

function Test-ExeInPath {
    param([string]$Name)
    return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

function Assert-LastExitCode {
    param([string]$StepName)
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Fallo en: $StepName (codigo $LASTEXITCODE)" -ForegroundColor Red
        exit 1
    }
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DEPLOY A PRODUCCION" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path "backend")) {
    Write-Host "ERROR: No se encuentra el directorio backend" -ForegroundColor Red
    Write-Host "Ejecuta este script desde la raiz del proyecto." -ForegroundColor Red
    Read-Host "Presiona Enter para salir"
    exit 1
}

if (-not (Test-Path "frontend")) {
    Write-Host "ERROR: No se encuentra el directorio frontend" -ForegroundColor Red
    Read-Host "Presiona Enter para salir"
    exit 1
}

if (-not (Test-Path "backend/prisma/schema.prisma")) {
    Write-Host "ERROR: Falta backend/prisma/schema.prisma" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "scripts/deploy-remote.sh")) {
    Write-Host "ERROR: Falta scripts/deploy-remote.sh" -ForegroundColor Red
    exit 1
}

$requiredFiles = @(
    "backend/package.json",
    "backend/tsconfig.json",
    "frontend/package.json",
    "frontend/vite.config.ts"
)
foreach ($f in $requiredFiles) {
    if (-not (Test-Path $f)) {
        Write-Host "ERROR: Falta archivo requerido: $f" -ForegroundColor Red
        exit 1
    }
}

foreach ($tool in @("git", "ssh", "scp")) {
    if (-not (Test-ExeInPath $tool)) {
        Write-Host "ERROR: No se encontro '$tool' en PATH (instala Git for Windows / OpenSSH)." -ForegroundColor Red
        exit 1
    }
}

if (-not (Test-ExeInPath "npm")) {
    Write-Host "ADVERTENCIA: No se encontro 'npm' en PATH." -ForegroundColor Yellow
}

if ($env:SKIP_LOCAL_BUILD -eq "1") {
    Write-Host "[0] Omitiendo compilacion local (SKIP_LOCAL_BUILD=1)." -ForegroundColor Yellow
} elseif (Test-ExeInPath "npm") {
    Write-Host "[0] Validando compilacion local (backend + frontend)..." -ForegroundColor Yellow
    Push-Location backend
    npm run build
    Assert-LastExitCode "npm run build (backend)"
    Pop-Location
    Push-Location frontend
    npm run build
    Assert-LastExitCode "npm run build (frontend)"
    Pop-Location
    Write-Host "OK: Builds locales exitosos." -ForegroundColor Green
} else {
    Write-Host "[0] ADVERTENCIA: Sin npm no se valido build local." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[1/6] Verificando estado de Git..." -ForegroundColor Yellow
git status
Write-Host ""

$hacerCommit = Read-Host "Deseas hacer commit de los cambios? (S/N)"
if ($hacerCommit -eq "S" -or $hacerCommit -eq "s") {
    $mensajeCommit = Read-Host "Ingresa el mensaje del commit"
    if ([string]::IsNullOrWhiteSpace($mensajeCommit)) {
        $mensajeCommit = "Actualizacion automatica"
    }

    Write-Host "[2/6] Agregando archivos al staging..." -ForegroundColor Yellow
    git add .

    Write-Host "[3/6] Haciendo commit..." -ForegroundColor Yellow
    git commit -m $mensajeCommit
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: git commit fallo (sin cambios o conflicto)." -ForegroundColor Red
        Read-Host "Presiona Enter para salir"
        exit 1
    }

    Write-Host "[4/6] Subiendo a GitHub..." -ForegroundColor Yellow
    git push origin main
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: No se pudo hacer push a GitHub" -ForegroundColor Red
        Read-Host "Presiona Enter para salir"
        exit 1
    }
    Write-Host "OK: Commit y push completados" -ForegroundColor Green
} else {
    Write-Host "Saltando commit y push..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[5/6] Creando backup en produccion..." -ForegroundColor Yellow
$backupCmd = 'cd ' + $RemoteBase + ' && mkdir -p backups && tar czf backups/backup_pre_deploy_$(date +%Y%m%d_%H%M%S).tar.gz backend/src frontend/src backend/prisma backend/package.json frontend/package.json backend/tsconfig.json frontend/vite.config.ts 2>/dev/null && echo Backup creado'
ssh -p $RemoteSshPort "${RemoteUser}@${RemoteHost}" $backupCmd
Assert-LastExitCode "ssh backup remoto"

Write-Host ""
Write-Host "[6/6] Desplegando a produccion..." -ForegroundColor Yellow
Write-Host ""

$scpTarget = "${RemoteUser}@${RemoteHost}"

Write-Host "Copiando backend/src..." -ForegroundColor Gray
scp -P $RemoteSshPort -r backend/src "${scpTarget}:${RemoteBase}/backend/"
Assert-LastExitCode "scp backend/src"

Write-Host "Copiando backend/prisma..." -ForegroundColor Gray
scp -P $RemoteSshPort -r backend/prisma "${scpTarget}:${RemoteBase}/backend/"
Assert-LastExitCode "scp backend/prisma"

Write-Host "Copiando backend/package.json y tsconfig..." -ForegroundColor Gray
scp -P $RemoteSshPort backend/package.json "${scpTarget}:${RemoteBase}/backend/"
Assert-LastExitCode "scp backend/package.json"
scp -P $RemoteSshPort backend/tsconfig.json "${scpTarget}:${RemoteBase}/backend/"
Assert-LastExitCode "scp backend/tsconfig.json"

if (Test-Path "backend/package-lock.json") {
    Write-Host "Copiando backend/package-lock.json..." -ForegroundColor Gray
    scp -P $RemoteSshPort backend/package-lock.json "${scpTarget}:${RemoteBase}/backend/"
    Assert-LastExitCode "scp backend/package-lock.json"
}

Write-Host "Copiando frontend/src..." -ForegroundColor Gray
scp -P $RemoteSshPort -r frontend/src "${scpTarget}:${RemoteBase}/frontend/"
Assert-LastExitCode "scp frontend/src"

Write-Host "Copiando frontend/package.json y vite.config.ts..." -ForegroundColor Gray
scp -P $RemoteSshPort frontend/package.json "${scpTarget}:${RemoteBase}/frontend/"
Assert-LastExitCode "scp frontend/package.json"
scp -P $RemoteSshPort frontend/vite.config.ts "${scpTarget}:${RemoteBase}/frontend/"
Assert-LastExitCode "scp frontend/vite.config.ts"

if (Test-Path "frontend/package-lock.json") {
    Write-Host "Copiando frontend/package-lock.json..." -ForegroundColor Gray
    scp -P $RemoteSshPort frontend/package-lock.json "${scpTarget}:${RemoteBase}/frontend/"
    Assert-LastExitCode "scp frontend/package-lock.json"
}

Write-Host "Copiando scripts/deploy-remote.sh..." -ForegroundColor Gray
scp -P $RemoteSshPort scripts/deploy-remote.sh "${scpTarget}:/tmp/infra-caja-deploy.sh"
Assert-LastExitCode "scp deploy-remote.sh"

$skipRemoteNpm = $env:SKIP_REMOTE_NPM
if ($skipRemoteNpm -eq "1") {
    Write-Host "ADVERTENCIA: SKIP_REMOTE_NPM=1 (no se ejecuta npm install/ci en servidor)." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Instalando dependencias, Prisma, build y validacion remota..." -ForegroundColor Yellow

$sshCmd = "sed -i 's/\r$//' /tmp/infra-caja-deploy.sh && chmod +x /tmp/infra-caja-deploy.sh && export REMOTE_BASE='$RemoteBase' SKIP_REMOTE_NPM='$skipRemoteNpm' && /tmp/infra-caja-deploy.sh"
ssh -p $RemoteSshPort "${RemoteUser}@${RemoteHost}" $sshCmd
Assert-LastExitCode "ssh deploy remoto (deps, prisma, build, validacion)"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  DEPLOY COMPLETADO" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Prueba manual recomendada:" -ForegroundColor Cyan
Write-Host "  - Login y GET /api/auth/me" -ForegroundColor Gray
Write-Host "  - Modulos: Stock, CMDB, RRHH segun rol" -ForegroundColor Gray
Write-Host ""
Write-Host "Si cambiaste schema.prisma (modelo de datos):" -ForegroundColor Yellow
Write-Host "  - En servidor, con backup DB: npx prisma db push (o flujo acordado)." -ForegroundColor Gray
Write-Host "  - No se ejecuta automaticamente en este script." -ForegroundColor Gray
Write-Host ""
Read-Host "Presiona Enter para continuar"
