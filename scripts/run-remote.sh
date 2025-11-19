#!/usr/bin/env bash
set -euo pipefail

# Wrapper para ejecutar un comando remoto en producción dentro del proyecto
# Ejemplo:
#   scripts/run-remote.sh -- pm2 ls
#   scripts/run-remote.sh -- "./backend/node_modules/.bin/prisma migrate status"

HOST="192.168.123.147"
USER="intranet"
PORT="22"
REMOTE_DIR="/var/www/intranet"
IDENTITY_FILE="${IDENTITY_FILE:-}"

if [[ $# -lt 1 || "$1" != "--" ]]; then
  echo "Uso: $0 -- <comando a ejecutar en el servidor>"
  exit 1
fi
shift

SSH_OPTS=("-p" "$PORT" "-o" "StrictHostKeyChecking=accept-new")
if [[ -n "$IDENTITY_FILE" ]]; then
  SSH_OPTS+=("-i" "$IDENTITY_FILE")
fi

CMD="$*"
ssh "${SSH_OPTS[@]}" "$USER@$HOST" "cd '$REMOTE_DIR' && bash -lc '$CMD'"



