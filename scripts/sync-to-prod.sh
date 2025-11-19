#!/usr/bin/env bash
set -euo pipefail

# Sincronización segura a producción (rsync vía SSH) con DRY-RUN por defecto.
# No borra en destino. Excluye artefactos y node_modules.
# Para aplicar cambios realmente, ejecutar con --apply al final.

HOST="192.168.123.147"
USER="intranet"
PORT="22"
REMOTE_DIR="/var/www/intranet"
IDENTITY_FILE="${IDENTITY_FILE:-}"

APPLY=false
if [[ "${1:-}" == "--apply" ]]; then
  APPLY=true
fi

EXCLUDES=(
  "--exclude=.git/"
  "--exclude=**/node_modules/"
  "--exclude=**/dist/"
  "--exclude=**/.next/"
  "--exclude=**/.turbo/"
  "--exclude=**/.cache/"
  "--exclude=**/*.log"
  "--exclude=**/.env*"   # evita sobreescribir secretos en prod
  "--exclude=backups/"
)

SSH_CMD=(ssh -p "$PORT")
if [[ -n "$IDENTITY_FILE" ]]; then
  SSH_CMD+=("-i" "$IDENTITY_FILE")
fi

RSYNC_FLAGS=(-avz --no-perms --no-owner --no-group)
${APPLY} || RSYNC_FLAGS+=(--dry-run)

rsync "${RSYNC_FLAGS[@]}" "${EXCLUDES[@]}" \
  -e "${SSH_CMD[*]}" \
  ./ "$USER@$HOST:$REMOTE_DIR/"

if ! ${APPLY}; then
  echo "\nEste fue un DRY-RUN. Para aplicar cambios realmente, ejecutá:"
  echo "  $0 --apply"
fi



