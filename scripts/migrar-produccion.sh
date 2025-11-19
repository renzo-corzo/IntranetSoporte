#!/usr/bin/env bash
set -euo pipefail

# Script completo de migración de desarrollo a producción
# Uso: bash scripts/migrar-produccion.sh

PROJECT_DIR="/opt/infra-caja"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"
DEV_PROJECT_DIR="${DEV_PROJECT_DIR:-/ruta/a/desarrollo}"  # Ajustar según tu entorno

log() {
  echo "==> $1"
}

error() {
  echo "!!! ERROR: $1" >&2
  exit 1
}

warn() {
  echo "[ADVERTENCIA] $1" >&2
}

# Verificar que estamos en producción
if [ ! -d "$PROJECT_DIR" ]; then
  error "No se encontró $PROJECT_DIR. ¿Estás en producción?"
fi

log "=== MIGRACIÓN DE DESARROLLO A PRODUCCIÓN ==="
log "Fecha: $(date)"
log ""

# PASO 1: Backup
log "PASO 1/8 - Creando backup completo..."
if [ -f "$(dirname "$0")/backup-produccion.sh" ]; then
  bash "$(dirname "$0")/backup-produccion.sh" || error "Fallo en backup"
else
  warn "Script de backup no encontrado. Continuando sin backup..."
fi

log ""

# PASO 2: Verificar tabla Vacacion antigua
log "PASO 2/8 - Verificando tabla Vacacion antigua..."
cd "$BACKEND_DIR" || error "No se encontró $BACKEND_DIR"

VACACION_COUNT=$(psql "$DATABASE_URL" -tAc "SELECT COUNT(*) FROM \"Vacacion\";" 2>/dev/null || echo "0")

if [ "$VACACION_COUNT" -gt 0 ]; then
  warn "⚠️  Tabla Vacacion antigua tiene $VACACION_COUNT registros"
  warn "Revisar si estos datos son importantes antes de continuar"
  read -p "¿Deseas continuar? (s/N): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    error "Migración cancelada por el usuario"
  fi
else
  log "✓ Tabla Vacacion antigua está vacía o no existe"
fi

log ""

# PASO 3: Aplicar migración SQL
log "PASO 3/8 - Aplicando migración de base de datos..."
if [ -f "$(dirname "$0")/migracion-rrhh-produccion.sql" ]; then
  psql "$DATABASE_URL" -f "$(dirname "$0")/migracion-rrhh-produccion.sql" || error "Fallo en migración SQL"
  log "✓ Migración SQL aplicada"
else
  error "No se encontró migracion-rrhh-produccion.sql"
fi

log ""

# PASO 4: Sincronizar código backend
log "PASO 4/8 - Sincronizando código backend..."
log "⚠️  NOTA: Este paso requiere copiar archivos desde desarrollo"
log "   Archivos a copiar:"
log "   - src/routes/vacaciones.routes.ts"
log "   - src/routes/licencias.routes.ts"
log "   - src/routes/empleados.routes.ts"
log "   - src/routes/documentos.routes.ts (si existe)"
log "   - src/controllers/vacaciones.controller.ts"
log "   - src/controllers/licencias.controller.ts"
log "   - src/controllers/empleados.controller.ts"
log "   - src/middlewares/rrhh.middleware.ts o rrhh.middleware.simple.ts"
log "   - src/routes/index.ts (actualizar)"
log ""
log "   Usar rsync o scp para copiar desde desarrollo"

# Aquí puedes agregar rsync si tienes acceso directo:
# rsync -av --exclude='node_modules' --exclude='dist' \
#   "$DEV_PROJECT_DIR/backend/src/routes/" "$BACKEND_DIR/src/routes/"

log "✓ Archivos sincronizados (verificar manualmente)"

log ""

# PASO 5: Actualizar dependencias backend
log "PASO 5/8 - Instalando dependencias backend..."
cd "$BACKEND_DIR" || error "No se encontró $BACKEND_DIR"
npm ci || error "Fallo al instalar dependencias"

log ""

# PASO 6: Generar Prisma Client
log "PASO 6/8 - Generando Prisma Client..."
npx prisma generate || error "Fallo al generar Prisma Client"

log ""

# PASO 7: Compilar backend
log "PASO 7/8 - Compilando backend..."
npm run build || error "Fallo al compilar backend"

log ""

# PASO 8: Reiniciar servicios
log "PASO 8/8 - Reiniciando servicios..."
pm2 restart infra-backend-prod --update-env || error "Fallo al reiniciar backend"
pm2 save || warn "No se pudo guardar configuración PM2"

log ""
log "=== MIGRACIÓN COMPLETADA ==="
log ""
log "Pendiente:"
log "  1. Sincronizar código frontend"
log "  2. Recompilar frontend: cd $FRONTEND_DIR && npm ci && npm run build"
log "  3. Recargar Nginx: sudo systemctl reload nginx"
log "  4. Verificar funcionamiento"
log ""
log "Para verificar:"
log "  - pm2 logs infra-backend-prod"
log "  - curl http://localhost:4000/api/empleados"
log "  - curl http://localhost:4000/api/vacaciones"


