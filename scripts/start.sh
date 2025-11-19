#!/bin/bash

# 🚀 Script para iniciar Infraestructura Caja de Abogados

echo "🚀 Iniciando Infraestructura Caja de Abogados..."

# ✅ Verificar servicios
echo "🔍 Verificando servicios..."

# PostgreSQL
if ! systemctl is-active --quiet postgresql; then
    echo "🐘 Iniciando PostgreSQL..."
    sudo systemctl start postgresql
fi

# Nginx
if ! systemctl is-active --quiet nginx; then
    echo "🌐 Iniciando Nginx..."
    sudo systemctl start nginx
fi

# Backend con PM2
echo "🔄 Iniciando backend..."
cd backend
pm2 start npm --name "infra-backend" -- start 2>/dev/null || pm2 restart infra-backend

echo "✅ Servicios iniciados correctamente!"
echo ""
echo "📱 Aplicación disponible en: http://localhost"
echo "🔧 Ver estado: pm2 status"