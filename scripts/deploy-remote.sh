#!/usr/bin/env bash
# Ejecutar en el servidor Linux (llamado desde deploy-produccion.ps1 / .bat).
# Variables de entorno:
#   REMOTE_BASE  - raiz del proyecto (ej. /opt/infra-caja)
#   SKIP_REMOTE_NPM - si es "1", no ejecuta npm install/ci (solo prisma + build; riesgo si cambian deps)
#
# Health: usa PORT desde backend/.env (sin exponer el archivo). Si no hay PORT, default 4001.

set -euo pipefail

REMOTE_BASE="${REMOTE_BASE:-/opt/infra-caja}"
SKIP_REMOTE_NPM="${SKIP_REMOTE_NPM:-}"

echo "[remote] REMOTE_BASE=$REMOTE_BASE"

# ── BACKUP AUTOMÁTICO DE BASE DE DATOS ──────────────────────────────────────
echo "[remote] Creando backup de PostgreSQL..."
BACKUP_DIR="${REMOTE_BASE}/backups"
mkdir -p "$BACKUP_DIR"
BACKUP_FILE="${BACKUP_DIR}/db_backup_$(date +%Y%m%d_%H%M%S).sql"

ENV_FILE="${REMOTE_BASE}/backend/.env"
# DATABASE_URL completa (con credenciales), no solo el nombre de la DB: la
# conexion por socket local con -U postgres/-U intranet falla por peer auth
# (el rol de Postgres no coincide con el usuario del SO). Con la URL
# completa, pg_dump conecta por TCP a localhost con el rol/password reales.
DB_URL=$(grep -E '^DATABASE_URL' "$ENV_FILE" | sed -E 's/^DATABASE_URL=//' | tr -d '\r"')

if [ -n "$DB_URL" ] && pg_dump "$DB_URL" > "$BACKUP_FILE" 2>/tmp/pgdump_deploy_err.log; then
  gzip "$BACKUP_FILE"
  echo "[remote] Backup DB: ${BACKUP_FILE}.gz"
else
  echo "[remote] ADVERTENCIA: No se pudo hacer backup de DB"
  cat /tmp/pgdump_deploy_err.log 2>/dev/null
  rm -f "$BACKUP_FILE"
fi
rm -f /tmp/pgdump_deploy_err.log

ls -t "${BACKUP_DIR}"/db_backup_*.sql.gz 2>/dev/null | tail -n +11 | xargs rm -f 2>/dev/null || true
# ────────────────────────────────────────────────────────────────────────────

cd "${REMOTE_BASE}/backend"

if [ "$SKIP_REMOTE_NPM" = "1" ]; then
  echo "[remote] SKIP_REMOTE_NPM=1: omitiendo npm install/ci"
else
  if [ -f package-lock.json ]; then
    echo "[remote] npm ci (package-lock.json presente)"
    npm ci
  else
    echo "[remote] npm install (sin package-lock.json en servidor)"
    npm install
  fi
fi

echo "[remote] prisma generate + validate"
npx prisma generate
npx prisma validate

echo "[remote] npm run build (backend)"
npm run build

echo "[remote] pm2 restart"
pm2 restart infra-backend-prod

cd "${REMOTE_BASE}/frontend"

if [ "$SKIP_REMOTE_NPM" != "1" ]; then
  if [ -f package-lock.json ]; then
    echo "[remote] npm ci (frontend)"
    npm ci
  else
    echo "[remote] npm install (frontend)"
    npm install
  fi
fi

echo "[remote] npm run build (frontend)"
npm run build

# Puerto health: leer PORT del .env del backend (misma fuente que usa dotenv al arrancar)
ENV_FILE="${REMOTE_BASE}/backend/.env"
HEALTH_PORT=""
if [ -f "$ENV_FILE" ]; then
  HEALTH_PORT="$(
    grep -E '^[[:space:]]*PORT[[:space:]]*=' "$ENV_FILE" | tail -1 \
    | sed -E 's/^[[:space:]]*PORT[[:space:]]*=[[:space:]]*//; s/\r$//' \
    | sed -E 's/^"(.*)"$/\1/; s/^'"'"'(.*)'"'"'$/\1/'
  )"
fi
if [ -z "${HEALTH_PORT}" ]; then
  HEALTH_PORT="${PORT:-4001}"
  echo "[remote] ADVERTENCIA: PORT no encontrado en .env; usando default ${HEALTH_PORT}"
fi

echo ""
echo "=== Post-deploy (servidor) ==="
echo "[remote] GET http://127.0.0.1:${HEALTH_PORT}/health"
curl -fsS "http://127.0.0.1:${HEALTH_PORT}/health"
echo ""

if pm2 list 2>/dev/null | grep "infra-backend-prod" | grep -q "online"; then
  echo "POST-DEPLOY: PM2 infra-backend-prod -> online"
else
  echo "ERROR: PM2 no muestra infra-backend-prod como online"
  pm2 list
  exit 1
fi

echo "[remote] OK"
