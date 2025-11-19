#!/bin/bash

# 💾 Script de Backup para Infraestructura Caja de Abogados

BACKUP_DIR="/opt/infra-caja/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="infra_caja"
DB_USER="infra_user"

echo "💾 Iniciando backup de Infraestructura Caja de Abogados..."

# Crear directorio de backups
mkdir -p $BACKUP_DIR

# Backup de base de datos
echo "🗄️ Realizando backup de base de datos..."
PGPASSWORD=infra_password pg_dump -h localhost -U $DB_USER $DB_NAME > $BACKUP_DIR/db_backup_$DATE.sql

# Backup de archivos subidos
echo "📁 Realizando backup de archivos..."
tar -czf $BACKUP_DIR/uploads_backup_$DATE.tar.gz backend/uploads/

# Limpiar backups antiguos (mantener últimos 7 días)
echo "🧹 Limpiando backups antiguos..."
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "✅ Backup completado: $BACKUP_DIR"
echo "📊 Archivos de backup:"
ls -lh $BACKUP_DIR/ | tail -10