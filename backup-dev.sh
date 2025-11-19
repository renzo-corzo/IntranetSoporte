#!/usr/bin/env bash
set -euo pipefail

# Backup completo de entorno de desarrollo
# - Backend, Frontend, Prisma, archivos raíz, dump de DB
# - Salida: backups/backup_YYYYMMDD_HHMMSS.tar.gz

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKUPS_DIR="$ROOT_DIR/backups"
ARTIFACTS_DIR="$ROOT_DIR/.backup_artifacts"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
ARCHIVE_NAME="backup_${TIMESTAMP}.tar.gz"

mkdir -p "$BACKUPS_DIR"
rm -rf "$ARTIFACTS_DIR" && mkdir -p "$ARTIFACTS_DIR"

echo "==> Cargando variables de entorno…"
# Cargar .env desde backend si existe (compatible con bash)
if [ -f "$ROOT_DIR/backend/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  . "$ROOT_DIR/backend/.env"
  set +a
fi
# Si no existe en backend, intentar .env en raíz
if [ -z "${DATABASE_URL:-}" ] && [ -f "$ROOT_DIR/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  . "$ROOT_DIR/.env"
  set +a
fi

echo "==> Exportando base de datos (pg_dump)…"
DB_DUMP_FILE="$ARTIFACTS_DIR/db_dump.sql"
if [ -n "${DATABASE_URL:-}" ]; then
  if command -v pg_dump >/dev/null 2>&1; then
    # Export en formato SQL estándar (fácil de restaurar en cualquier entorno)
    pg_dump --no-owner --no-privileges "$DATABASE_URL" > "$DB_DUMP_FILE"
  else
    echo "[ADVERTENCIA] pg_dump no encontrado en PATH. Omitiendo dump de DB." >&2
    echo "-- pg_dump no disponible; dumpeo omitido" > "$DB_DUMP_FILE"
  fi
else
  echo "[ADVERTENCIA] DATABASE_URL no definido. Omitiendo dump de DB." >&2
  echo "-- DATABASE_URL no definido; dumpeo omitido" > "$DB_DUMP_FILE"
fi

echo "==> Generando README de restauración…"
cat > "$ARTIFACTS_DIR/README_RESTORE.md" <<'EOF'
# Restauración del Backup (Desarrollo)

Contenido del backup:
- backend/, frontend/, prisma/ (si existe), scripts y archivos raíz relevantes
- .backup_artifacts/db_dump.sql: volcado de la base de datos

## Requisitos
- Node.js 18+
- PostgreSQL (cliente y servidor). Asegúrate de tener `psql` disponible

## Pasos
1) Descomprimir el archivo en la carpeta de destino
   - Linux/macOS: `tar -xzf backup_YYYYMMDD_HHMMSS.tar.gz`
   - Windows (WSL recomendado): `wsl tar -xzf backup_YYYYMMDD_HHMMSS.tar.gz`

2) Variables de entorno
   - Copia/ajusta `.env` en `backend/.env` con tu `DATABASE_URL`

3) Restaurar base de datos (opcional)
   - Crea la base de datos destino si no existe: `createdb <mi_db>`
   - Importa: `psql "$DATABASE_URL" -f .backup_artifacts/db_dump.sql`

4) Instalar dependencias e iniciar
   - Backend: `cd backend && npm ci && npm run dev`
   - Frontend: `cd frontend && npm ci && npm run dev`

EOF

echo "==> Creando archivo comprimido con exclusiones…"
# Empaquetamos TODO el repo con exclusiones frecuentes de build/deps y backups
# Mantenemos .backup_artifacts dentro del tar para incluir el dump y el README

tar \
  --exclude='**/node_modules' \
  --exclude='**/dist' \
  --exclude='**/.next' \
  --exclude='**/.turbo' \
  --exclude='**/.cache' \
  --exclude='**/.DS_Store' \
  --exclude='**/*.log' \
  --exclude='backups' \
  -czf "$BACKUPS_DIR/$ARCHIVE_NAME" \
  -C "$ROOT_DIR" .

echo "==> Backup creado: $BACKUPS_DIR/$ARCHIVE_NAME"
echo "✔ Listo"



