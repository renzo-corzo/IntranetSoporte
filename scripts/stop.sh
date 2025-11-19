#!/bin/bash

# ⏹️ Script para detener Infraestructura Caja de Abogados

echo "⏹️ Deteniendo Infraestructura Caja de Abogados..."

# Detener backend
echo "🔄 Deteniendo backend..."
pm2 stop infra-backend 2>/dev/null || echo "Backend ya estaba detenido"

# Detener nginx (opcional)
# echo "🌐 Deteniendo Nginx..."
# sudo systemctl stop nginx

echo "✅ Aplicación detenida correctamente!"
echo "🔧 Para iniciar nuevamente: ./scripts/start.sh"