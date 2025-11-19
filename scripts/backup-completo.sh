#!/bin/bash

# Script de backup completo del sistema
# Incluye: base de datos, código fuente, configuraciones

BACKUP_DIR="backup_sistema_$(date +%Y%m%d_%H%M%S)"
BACKUP_PATH="/opt/backups/$BACKUP_DIR"
LOG_FILE="/opt/backups/backup_$(date +%Y%m%d_%H%M%S).log"

echo "========================================="
echo "BACKUP COMPLETO DEL SISTEMA"
echo "Fecha: $(date)"
echo "========================================="

# Crear directorio de backup
mkdir -p "$BACKUP_PATH"
mkdir -p "$BACKUP_PATH/database"
mkdir -p "$BACKUP_PATH/code"
mkdir -p "$BACKUP_PATH/config"

echo "[$(date)] Iniciando backup..." | tee -a "$LOG_FILE"

# 1. Backup de la base de datos
echo "[$(date)] 1. Respaldando base de datos..." | tee -a "$LOG_FILE"
PGPASSWORD="$DB_PASSWORD" pg_dump -h localhost -U "$DB_USER" -d "$DB_NAME" -F c -f "$BACKUP_PATH/database/backup_$(date +%Y%m%d_%H%M%S).dump" 2>&1 | tee -a "$LOG_FILE"

if [ $? -eq 0 ]; then
    echo "[$(date)] ✅ Base de datos respaldada correctamente" | tee -a "$LOG_FILE"
else
    echo "[$(date)] ❌ Error al respaldar base de datos" | tee -a "$LOG_FILE"
fi

# 2. Backup del código fuente (backend)
echo "[$(date)] 2. Respaldando código backend..." | tee -a "$LOG_FILE"
tar -czf "$BACKUP_PATH/code/backend_$(date +%Y%m%d_%H%M%S).tar.gz" \
    -C /opt/infra-caja/backend \
    --exclude='node_modules' \
    --exclude='dist' \
    --exclude='.next' \
    . 2>&1 | tee -a "$LOG_FILE"

if [ $? -eq 0 ]; then
    echo "[$(date)] ✅ Código backend respaldado correctamente" | tee -a "$LOG_FILE"
else
    echo "[$(date)] ❌ Error al respaldar código backend" | tee -a "$LOG_FILE"
fi

# 3. Backup del código fuente (frontend)
echo "[$(date)] 3. Respaldando código frontend..." | tee -a "$LOG_FILE"
tar -czf "$BACKUP_PATH/code/frontend_$(date +%Y%m%d_%H%M%S).tar.gz" \
    -C /opt/infra-caja/frontend \
    --exclude='node_modules' \
    --exclude='dist' \
    --exclude='.next' \
    . 2>&1 | tee -a "$LOG_FILE"

if [ $? -eq 0 ]; then
    echo "[$(date)] ✅ Código frontend respaldado correctamente" | tee -a "$LOG_FILE"
else
    echo "[$(date)] ❌ Error al respaldar código frontend" | tee -a "$LOG_FILE"
fi

# 4. Backup de configuraciones
echo "[$(date)] 4. Respaldando configuraciones..." | tee -a "$LOG_FILE"
cp -r /opt/infra-caja/backend/.env "$BACKUP_PATH/config/backend.env" 2>/dev/null
cp -r /opt/infra-caja/frontend/.env "$BACKUP_PATH/config/frontend.env" 2>/dev/null
cp /etc/nginx/sites-available/infra-caja* "$BACKUP_PATH/config/" 2>/dev/null
pm2 save 2>/dev/null
cp ~/.pm2/dump.pm2 "$BACKUP_PATH/config/pm2_dump.json" 2>/dev/null

echo "[$(date)] ✅ Configuraciones respaldadas" | tee -a "$LOG_FILE"

# 5. Crear archivo README con información del backup
cat > "$BACKUP_PATH/README.txt" << EOF
BACKUP COMPLETO DEL SISTEMA
============================
Fecha: $(date)
Sistema: Infra Caja - Sistema de Gestión

CONTENIDO:
----------
- database/: Backup de PostgreSQL
- code/: Código fuente (backend y frontend)
- config/: Archivos de configuración

RESTAURACIÓN:
-------------
1. Base de datos:
   pg_restore -h localhost -U usuario -d nombre_db -c database/backup_*.dump

2. Código:
   tar -xzf code/backend_*.tar.gz -C /opt/infra-caja/backend
   tar -xzf code/frontend_*.tar.gz -C /opt/infra-caja/frontend

3. Configuraciones:
   Copiar archivos de config/ a sus ubicaciones correspondientes

NOTAS:
------
- Los node_modules NO están incluidos (instalar con npm install)
- Las configuraciones sensibles (.env) están incluidas
EOF

# 6. Comprimir todo el backup
echo "[$(date)] 5. Comprimiendo backup completo..." | tee -a "$LOG_FILE"
cd /opt/backups
tar -czf "${BACKUP_DIR}.tar.gz" "$BACKUP_DIR" 2>&1 | tee -a "$LOG_FILE"

if [ $? -eq 0 ]; then
    echo "[$(date)] ✅ Backup comprimido: ${BACKUP_DIR}.tar.gz" | tee -a "$LOG_FILE"
    # Calcular tamaño
    SIZE=$(du -h "${BACKUP_DIR}.tar.gz" | cut -f1)
    echo "[$(date)] Tamaño del backup: $SIZE" | tee -a "$LOG_FILE"
else
    echo "[$(date)] ❌ Error al comprimir backup" | tee -a "$LOG_FILE"
fi

echo "========================================="
echo "[$(date)] BACKUP COMPLETADO"
echo "Ubicación: /opt/backups/${BACKUP_DIR}.tar.gz"
echo "=========================================" | tee -a "$LOG_FILE"

