#!/usr/bin/env bash
set -euo pipefail

# Configuración
HOST="192.168.123.147"
USER="intranet"
PORT="22"
REMOTE_DIR="/var/www/intranet"
IDENTITY_FILE="${IDENTITY_FILE:-}"  # opcional, ej: ~/.ssh/id_rsa

usage() {
  echo "Uso: $0 [--host HOST] [--user USER] [--port PORT] [--key PATH] [--dir REMOTE_DIR]"
  echo "     $0 -- cmd 'comando a ejecutar en el servidor'"
}

HOST_ARG=(); USER_ARG=(); PORT_ARG=(); KEY_ARG=();
DIR_ARG=(); RUN_CMD=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --host) HOST="$2"; shift 2;;
    --user) USER="$2"; shift 2;;
    --port) PORT="$2"; shift 2;;
    --key)  IDENTITY_FILE="$2"; shift 2;;
    --dir)  REMOTE_DIR="$2"; shift 2;;
    --cmd)  shift; RUN_CMD="$*"; break;;
    -h|--help) usage; exit 0;;
    *) echo "Argumento no reconocido: $1"; usage; exit 1;;
  esac
done

SSH_OPTS=("-p" "$PORT" "-o" "StrictHostKeyChecking=accept-new")
if [[ -n "$IDENTITY_FILE" ]]; then
  SSH_OPTS+=("-i" "$IDENTITY_FILE")
fi

if [[ -n "$RUN_CMD" ]]; then
  # Ejecuta comando remoto dentro del directorio del proyecto
  exec ssh "${SSH_OPTS[@]}" "$USER@$HOST" "cd '$REMOTE_DIR' && bash -lc '$RUN_CMD'"
else
  # Abre sesión interactiva y posiciona en el proyecto
  exec ssh "${SSH_OPTS[@]}" -t "$USER@$HOST" "cd '$REMOTE_DIR' && exec bash -l"
fi



