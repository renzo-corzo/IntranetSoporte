# Verificaciones minimas post-limpieza (sin CI/CD).
# Uso: desde la raiz del repo:  .\scripts\smoke-post-limpieza.ps1
# Opcional: .\scripts\smoke-post-limpieza.ps1 -ApiBase "http://localhost:4001"

param(
    [string]$ApiBase = "http://localhost:4001"
)

$ErrorActionPreference = "Continue"
# scripts/ -> raiz del repo
$root = Split-Path $PSScriptRoot -Parent
if (-not (Test-Path (Join-Path $root "backend"))) {
    Write-Host "ERROR: ejecuta desde el repo (falta backend/). Raiz detectada: $root" -ForegroundColor Red
    exit 1
}

Write-Host "=== Smoke post-limpieza (raiz: $root) ===" -ForegroundColor Cyan

# 1) Sin Bitdefender en codigo fuente activo
$dirs = @(
    (Join-Path $root "backend\src"),
    (Join-Path $root "frontend\src")
)
$found = $false
foreach ($d in $dirs) {
    if (-not (Test-Path $d)) { continue }
    $hits = Get-ChildItem -Path $d -Recurse -Include *.ts,*.tsx -File -ErrorAction SilentlyContinue |
        Select-String -Pattern "bitdefender|BITDEFENDER_|Bitdefender" -CaseSensitive:$false -ErrorAction SilentlyContinue
    if ($hits) {
        $hits | ForEach-Object { Write-Host "FAIL: $($_.Path):$($_.LineNumber) $($_.Line.Trim())" -ForegroundColor Red }
        $found = $true
    }
}
if ($found) {
    Write-Host "RESULTADO: FAIL (referencias Bitdefender en src)" -ForegroundColor Red
    exit 1
}
Write-Host "OK: sin coincidencias Bitdefender en backend/src y frontend/src" -ForegroundColor Green

# 2) Health HTTP si el backend esta levantado
try {
    $u = $ApiBase.TrimEnd("/") + "/health"
    $r = Invoke-WebRequest -Uri $u -UseBasicParsing -TimeoutSec 5
    if ($r.StatusCode -eq 200) {
        Write-Host "OK: GET $u -> 200" -ForegroundColor Green
    } else {
        Write-Host "WARN: GET $u -> $($r.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "SKIP: no se pudo contactar $ApiBase/health (levanta el backend para probar): $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host "=== Fin smoke ===" -ForegroundColor Cyan
exit 0
