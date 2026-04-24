# Replica deploy-produccion.ps1 sin pasos interactivos (commit Git omitido).
# No establece SKIP_REMOTE_NPM.
$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

$RemoteHost = "192.168.123.147"
$RemoteUser = "intranet"
$RemoteSshPort = 22
$RemoteBase = "/opt/infra-caja"

function Assert-LastExitCode {
    param([string]$StepName)
    if ($LASTEXITCODE -ne 0) {
        throw "FAIL: $StepName (exit $LASTEXITCODE)"
    }
}

if ($env:SKIP_REMOTE_NPM -eq "1") {
    Write-Host "ERROR: SKIP_REMOTE_NPM no permitido en este script." -ForegroundColor Red
    exit 1
}

Write-Host "[0] Build local backend + frontend..." -ForegroundColor Yellow
Push-Location backend
npm run build
Assert-LastExitCode "npm run build (backend local)"
Pop-Location
Push-Location frontend
npm run build
Assert-LastExitCode "npm run build (frontend local)"
Pop-Location

Write-Host "[5] Backup remoto..." -ForegroundColor Yellow
$backupCmd = 'cd ' + $RemoteBase + ' && mkdir -p backups && tar czf backups/backup_pre_deploy_$(date +%Y%m%d_%H%M%S).tar.gz backend/src frontend/src backend/prisma backend/package.json frontend/package.json backend/tsconfig.json frontend/vite.config.ts 2>/dev/null && echo Backup creado'
ssh -p $RemoteSshPort "${RemoteUser}@${RemoteHost}" $backupCmd
Assert-LastExitCode "ssh backup"

$scpTarget = "${RemoteUser}@${RemoteHost}"

Write-Host "[6] scp backend/src..." -ForegroundColor Yellow
scp -P $RemoteSshPort -r backend/src "${scpTarget}:${RemoteBase}/backend/"
Assert-LastExitCode "scp backend/src"

scp -P $RemoteSshPort -r backend/prisma "${scpTarget}:${RemoteBase}/backend/"
Assert-LastExitCode "scp prisma"

scp -P $RemoteSshPort backend/package.json "${scpTarget}:${RemoteBase}/backend/"
Assert-LastExitCode "scp package.json backend"
scp -P $RemoteSshPort backend/tsconfig.json "${scpTarget}:${RemoteBase}/backend/"
Assert-LastExitCode "scp tsconfig backend"

if (Test-Path "backend/package-lock.json") {
    scp -P $RemoteSshPort backend/package-lock.json "${scpTarget}:${RemoteBase}/backend/"
    Assert-LastExitCode "scp backend package-lock.json"
}

scp -P $RemoteSshPort -r frontend/src "${scpTarget}:${RemoteBase}/frontend/"
Assert-LastExitCode "scp frontend/src"

scp -P $RemoteSshPort frontend/package.json "${scpTarget}:${RemoteBase}/frontend/"
Assert-LastExitCode "scp frontend package.json"
scp -P $RemoteSshPort frontend/vite.config.ts "${scpTarget}:${RemoteBase}/frontend/"
Assert-LastExitCode "scp vite.config"

if (Test-Path "frontend/package-lock.json") {
    scp -P $RemoteSshPort frontend/package-lock.json "${scpTarget}:${RemoteBase}/frontend/"
    Assert-LastExitCode "scp frontend package-lock.json"
}

scp -P $RemoteSshPort scripts/deploy-remote.sh "${scpTarget}:/tmp/infra-caja-deploy.sh"
Assert-LastExitCode "scp deploy-remote.sh"

Write-Host "[remote] deps + prisma + builds + pm2 + health..." -ForegroundColor Yellow
$sshCmd = "sed -i 's/\r$//' /tmp/infra-caja-deploy.sh && chmod +x /tmp/infra-caja-deploy.sh && export REMOTE_BASE='$RemoteBase' SKIP_REMOTE_NPM='' && /tmp/infra-caja-deploy.sh"
ssh -p $RemoteSshPort "${RemoteUser}@${RemoteHost}" $sshCmd
Assert-LastExitCode "ssh deploy-remote"

Write-Host "DEPLOY_APPLY_OK" -ForegroundColor Green
