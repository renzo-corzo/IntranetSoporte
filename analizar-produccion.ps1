# Script para analizar el sistema de producción
# Ejecutar desde PowerShell en la raíz del proyecto

$HOST = "192.168.123.147"
$USER = "intranet"
$PORT = "22"
$PROJECT_DIR = "/opt/infra-caja"

Write-Host "=== Conectando a producción y ejecutando análisis ===" -ForegroundColor Green
Write-Host "Esto puede tardar unos minutos..." -ForegroundColor Yellow

$scriptBlock = @"
set -euo pipefail

PROJECT_DIR="$PROJECT_DIR"
BACKEND_DIR="\$PROJECT_DIR/backend"
FRONTEND_DIR="\$PROJECT_DIR/frontend"
OUTPUT_FILE="/tmp/analisis-produccion.txt"

echo "=== ANÁLISIS COMPLETO DE PRODUCCIÓN ===" > "\$OUTPUT_FILE"
echo "Fecha: \$(date)" >> "\$OUTPUT_FILE"
echo >> "\$OUTPUT_FILE"

# 1. BASE DE DATOS
echo "=== 1. BASE DE DATOS ===" >> "\$OUTPUT_FILE"
cd "\$BACKEND_DIR"
echo "--- Migraciones aplicadas ---" >> "\$OUTPUT_FILE"
npx prisma migrate status 2>&1 >> "\$OUTPUT_FILE" || echo "ERROR al obtener migraciones" >> "\$OUTPUT_FILE"
echo >> "\$OUTPUT_FILE"

echo "--- Schema de Prisma (versión) ---" >> "\$OUTPUT_FILE"
head -20 prisma/schema.prisma >> "\$OUTPUT_FILE" 2>&1 || echo "No se encontró schema" >> "\$OUTPUT_FILE"
echo >> "\$OUTPUT_FILE"

echo "--- Conteo de registros por tabla ---" >> "\$OUTPUT_FILE"
npx prisma db execute --stdin <<SQL 2>&1 | grep -v "Prisma" | grep -v "^$" >> "\$OUTPUT_FILE" || echo "Error al contar registros" >> "\$OUTPUT_FILE"
SELECT 
  'Usuario' as tabla, COUNT(*) as registros FROM "Usuario"
UNION ALL SELECT 'Rol', COUNT(*) FROM "Rol"
UNION ALL SELECT 'Empleado', COUNT(*) FROM "Empleado"
UNION ALL SELECT 'Vacacion', COUNT(*) FROM "Vacacion"
UNION ALL SELECT 'Licencia', COUNT(*) FROM "Licencia"
UNION ALL SELECT 'Tarea', COUNT(*) FROM "Tarea"
UNION ALL SELECT 'StockProducto', COUNT(*) FROM "StockProducto"
UNION ALL SELECT 'StockMovimiento', COUNT(*) FROM "StockMovimiento"
UNION ALL SELECT 'Procedimiento', COUNT(*) FROM "Procedimiento"
UNION ALL SELECT 'Link', COUNT(*) FROM "Link"
UNION ALL SELECT 'KBArticulo', COUNT(*) FROM "KBArticulo"
UNION ALL SELECT 'Relevamiento', COUNT(*) FROM "Relevamiento";
SQL
echo >> "\$OUTPUT_FILE"

# 2. BACKEND
echo "=== 2. BACKEND ===" >> "\$OUTPUT_FILE"
echo "--- Versión de Node y npm ---" >> "\$OUTPUT_FILE"
node -v >> "\$OUTPUT_FILE" 2>&1
npm -v >> "\$OUTPUT_FILE" 2>&1
echo >> "\$OUTPUT_FILE"

echo "--- Package.json (versiones principales) ---" >> "\$OUTPUT_FILE"
cat package.json | grep -E '"name"|"version"|"@prisma/client"|"express"|"typescript"' >> "\$OUTPUT_FILE" 2>&1 || echo "No package.json" >> "\$OUTPUT_FILE"
echo >> "\$OUTPUT_FILE"

echo "--- Rutas definidas (archivos de rutas) ---" >> "\$OUTPUT_FILE"
find src/routes -type f -name "*.ts" 2>/dev/null | sort >> "\$OUTPUT_FILE" || echo "No routes" >> "\$OUTPUT_FILE"
echo >> "\$OUTPUT_FILE"

echo "--- Variables de entorno (.env keys) ---" >> "\$OUTPUT_FILE"
grep -E "^(PORT|NODE_ENV|DATABASE_URL|JWT_SECRET|CORS_ORIGIN)" .env 2>/dev/null | sed 's/=.*/=<oculto>/' >> "\$OUTPUT_FILE" || echo "No .env o sin keys críticas" >> "\$OUTPUT_FILE"
echo >> "\$OUTPUT_FILE"

# 3. FRONTEND
echo "=== 3. FRONTEND ===" >> "\$OUTPUT_FILE"
cd "\$FRONTEND_DIR"
echo "--- Package.json (versiones principales) ---" >> "\$OUTPUT_FILE"
cat package.json | grep -E '"name"|"version"|"react"|"vite"|"typescript"' >> "\$OUTPUT_FILE" 2>&1 || echo "No package.json" >> "\$OUTPUT_FILE"
echo >> "\$OUTPUT_FILE"

echo "--- Variables de entorno (.env keys) ---" >> "\$OUTPUT_FILE"
grep -E "^(VITE_API_URL|VITE_ENV)" .env 2>/dev/null | sed 's/=.*/=<oculto>/' >> "\$OUTPUT_FILE" || echo "No .env o sin keys" >> "\$OUTPUT_FILE"
echo >> "\$OUTPUT_FILE"

echo "--- Rutas del frontend (App.tsx) ---" >> "\$OUTPUT_FILE"
grep -E 'path="' src/App.tsx 2>/dev/null | head -20 >> "\$OUTPUT_FILE" || echo "No App.tsx" >> "\$OUTPUT_FILE"
echo >> "\$OUTPUT_FILE"

# 4. NGINX
echo "=== 4. NGINX ===" >> "\$OUTPUT_FILE"
echo "--- Configuración del sitio ---" >> "\$OUTPUT_FILE"
cat /etc/nginx/sites-available/infra-caja >> "\$OUTPUT_FILE" 2>&1 || echo "No config Nginx" >> "\$OUTPUT_FILE"
echo >> "\$OUTPUT_FILE"

# 5. PM2
echo "=== 5. PM2 ===" >> "\$OUTPUT_FILE"
pm2 ls >> "\$OUTPUT_FILE" 2>&1 || echo "PM2 no disponible" >> "\$OUTPUT_FILE"
echo >> "\$OUTPUT_FILE"

# 6. HASH DE ARCHIVOS CRÍTICOS
echo "=== 6. HASH DE ARCHIVOS CRÍTICOS ===" >> "\$OUTPUT_FILE"
cd "\$PROJECT_DIR"
echo "--- Backend package.json ---" >> "\$OUTPUT_FILE"
md5sum backend/package.json 2>/dev/null >> "\$OUTPUT_FILE" || sha256sum backend/package.json 2>/dev/null >> "\$OUTPUT_FILE" || echo "No package.json backend" >> "\$OUTPUT_FILE"
echo "--- Frontend package.json ---" >> "\$OUTPUT_FILE"
md5sum frontend/package.json 2>/dev/null >> "\$OUTPUT_FILE" || sha256sum frontend/package.json 2>/dev/null >> "\$OUTPUT_FILE" || echo "No package.json frontend" >> "\$OUTPUT_FILE"
echo "--- Prisma schema ---" >> "\$OUTPUT_FILE"
md5sum backend/prisma/schema.prisma 2>/dev/null >> "\$OUTPUT_FILE" || sha256sum backend/prisma/schema.prisma 2>/dev/null >> "\$OUTPUT_FILE" || echo "No schema.prisma" >> "\$OUTPUT_FILE"
echo >> "\$OUTPUT_FILE"

# Mostrar resultado
cat "\$OUTPUT_FILE"
"@

# Ejecutar el script en producción
ssh -p $PORT $USER@$HOST "bash -lc `"$scriptBlock`""

Write-Host "`n=== Análisis completado ===" -ForegroundColor Green
Write-Host "El reporte completo está guardado en: /tmp/analisis-produccion.txt en el servidor" -ForegroundColor Yellow
Write-Host "Para verlo de nuevo, ejecuta:" -ForegroundColor Yellow
Write-Host "  ssh -p $PORT $USER@$HOST 'cat /tmp/analisis-produccion.txt'" -ForegroundColor Cyan


