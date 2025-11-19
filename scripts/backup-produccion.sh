#!/usr/bin/env bash
set -euo pipefail

# Script para backup completo de producción antes de migración
# Uso: bash scripts/backup-produccion.sh

PROJECT_DIR="/opt/infra-caja"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/tmp/backups_produccion"
BACKUP_DB="$BACKUP_DIR/db_backup_$TIMESTAMP.sql"
BACKUP_CODE="$BACKUP_DIR/codigo_backup_$TIMESTAMP.tar.gz"
BACKUP_NGINX="$BACKUP_DIR/nginx_backup_$TIMESTAMP.tar.gz"

log() {
  echo "==> $1"
}

error() {
  echo "!!! ERROR: $1" >&2
  exit 1
}

# Crear directorio de backups
mkdir -p "$BACKUP_DIR"

log "Iniciando backup completo de producción..."

# 1. Backup de base de datos
log "1/3 - Backup de base de datos..."
cd "$BACKEND_DIR" || error "No se encontró $BACKEND_DIR"

if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

if [ -z "$DATABASE_URL" ]; then
  error "DATABASE_URL no está definida en .env"
fi

if ! pg_dump "$DATABASE_URL" > "$BACKUP_DB" 2>/dev/null; then
  error "Fallo al hacer backup de base de datos"
fi

log "✓ Backup de DB guardado en: $BACKUP_DB"

# 2. Backup de código
log "2/3 - Backup de código..."
cd "$PROJECT_DIR" || error "No se encontró $PROJECT_DIR"

tar -czf "$BACKUP_CODE" \
  --exclude='node_modules' \
  --exclude='dist' \
  --exclude='.next' \
  --exclude='.cache' \
  --exclude='*.log' \
  backend frontend 2>/dev/null || error "Fallo al hacer backup de código"

log "✓ Backup de código guardado en: $BACKUP_CODE"

# 3. Backup de configuración Nginx
log "3/3 - Backup de configuración Nginx..."
if [ -f /etc/nginx/sites-available/infra-caja ]; then
  tar -czf "$BACKUP_NGINX" /etc/nginx/sites-available/infra-caja /etc/nginx/sites-enabled/infra-caja 2>/dev/null || true
  log "✓ Backup de Nginx guardado en: $BACKUP_NGINX"
else
  log "⚠ No se encontró configuración de Nginx"
fi

# Resumen
log ""
log "=== BACKUP COMPLETADO ==="
log "Base de datos: $BACKUP_DB"
log "Código: $BACKUP_CODE"
log "Nginx: $BACKUP_NGINX"
log ""
log "Para restaurar:"
log "  DB: psql \$DATABASE_URL < $BACKUP_DB"
log "  Código: tar -xzf $BACKUP_CODE -C /"
log "  Nginx: tar -xzf $BACKUP_NGINX -C /"


