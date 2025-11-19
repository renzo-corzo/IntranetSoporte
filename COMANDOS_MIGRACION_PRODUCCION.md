# Comandos para Migración de Producción

## 📋 Resumen
- ✅ Tabla Vacacion antigua NO existe (verificado)
- ✅ Plan de migración completo
- ✅ Scripts de backup y migración creados

---

## 🚀 PASO 1: Backup Completo

Ejecutar en producción:

```bash
cd /opt/infra-caja/backend

# Cargar variables de entorno
export $(grep -v '^#' .env | xargs)

# Crear directorio de backups
mkdir -p /tmp/backups_produccion

# Backup de base de datos
pg_dump "$DATABASE_URL" > /tmp/backups_produccion/db_backup_$(date +%Y%m%d_%H%M%S).sql

# Backup de código
cd /opt/infra-caja
tar -czf /tmp/backups_produccion/codigo_backup_$(date +%Y%m%d_%H%M%S).tar.gz \
  --exclude='node_modules' \
  --exclude='dist' \
  --exclude='.next' \
  --exclude='.cache' \
  --exclude='*.log' \
  backend frontend

# Backup de Nginx
tar -czf /tmp/backups_produccion/nginx_backup_$(date +%Y%m%d_%H%M%S).tar.gz \
  /etc/nginx/sites-available/infra-caja /etc/nginx/sites-enabled/infra-caja 2>/dev/null || true

echo "✅ Backup completado en /tmp/backups_produccion/"
```

---

## 🗄️ PASO 2: Aplicar Migración SQL

**Opción A: Usar el script SQL directamente**

```bash
cd /opt/infra-caja/backend

# Copiar el script de migración a producción (si no está ya)
# O crear el archivo directamente:

cat > /tmp/migracion-rrhh.sql << 'EOF'
-- Pegar aquí el contenido de scripts/migracion-rrhh-produccion.sql
EOF

# Aplicar migración
psql "$DATABASE_URL" -f /tmp/migracion-rrhh.sql
```

**Opción B: Ejecutar comandos SQL directamente**

```bash
cd /opt/infra-caja/backend
export $(grep -v '^#' .env | xargs)

psql "$DATABASE_URL" << 'SQL'
-- Crear enums
DO $$ BEGIN
  CREATE TYPE "EstadoEmpleado" AS ENUM ('ACTIVO', 'INACTIVO');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "TipoDocumento" AS ENUM ('DNI', 'CONTRATO', 'CERTIFICADO_MEDICO', 'CERTIFICADO_ESTUDIOS', 'OTRO');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "EstadoVacacion" AS ENUM ('PENDIENTE', 'APROBADA', 'RECHAZADA', 'CANCELADA');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Crear tabla Empleado
CREATE TABLE IF NOT EXISTS "Empleado" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "nombre" TEXT NOT NULL,
  "apellido" TEXT NOT NULL,
  "dni" TEXT NOT NULL UNIQUE,
  "email" TEXT NOT NULL UNIQUE,
  "departamento" TEXT NOT NULL,
  "estado" "EstadoEmpleado" NOT NULL DEFAULT 'ACTIVO',
  "fechaIngreso" TIMESTAMP(3) NOT NULL,
  "diasDisponibles" INTEGER NOT NULL DEFAULT 20,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "Empleado_departamento_idx" ON "Empleado"("departamento");
CREATE INDEX IF NOT EXISTS "Empleado_estado_idx" ON "Empleado"("estado");
CREATE INDEX IF NOT EXISTS "Empleado_email_idx" ON "Empleado"("email");

-- Crear tabla Licencia
CREATE TABLE IF NOT EXISTS "Licencia" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "empleadoId" TEXT NOT NULL,
  "tipo" TEXT NOT NULL,
  "fechaInicio" TIMESTAMP(3) NOT NULL,
  "fechaFin" TIMESTAMP(3) NOT NULL,
  "observaciones" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Licencia_empleadoId_fkey" FOREIGN KEY ("empleadoId") 
    REFERENCES "Empleado"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Licencia_empleadoId_idx" ON "Licencia"("empleadoId");
CREATE INDEX IF NOT EXISTS "Licencia_fechas_idx" ON "Licencia"("fechaInicio", "fechaFin");

-- Crear tabla DocumentoEmpleado
CREATE TABLE IF NOT EXISTS "DocumentoEmpleado" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "empleadoId" TEXT NOT NULL,
  "nombreArchivo" TEXT NOT NULL,
  "tipoArchivo" "TipoDocumento",
  "urlArchivo" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DocumentoEmpleado_empleadoId_fkey" FOREIGN KEY ("empleadoId") 
    REFERENCES "Empleado"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "DocumentoEmpleado_empleadoId_idx" ON "DocumentoEmpleado"("empleadoId");
CREATE INDEX IF NOT EXISTS "DocumentoEmpleado_tipoArchivo_idx" ON "DocumentoEmpleado"("tipoArchivo");

-- Crear tabla Vacacion
CREATE TABLE IF NOT EXISTS "Vacacion" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "empleadoId" TEXT NOT NULL,
  "fechaInicio" TIMESTAMP(3) NOT NULL,
  "fechaFin" TIMESTAMP(3) NOT NULL,
  "diasSolicitados" INTEGER NOT NULL,
  "observaciones" TEXT,
  "estado" "EstadoVacacion" NOT NULL DEFAULT 'PENDIENTE',
  "decididoPorId" INTEGER,
  "comentarioDecision" TEXT,
  "decididoEn" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Vacacion_empleadoId_fkey" FOREIGN KEY ("empleadoId") 
    REFERENCES "Empleado"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Vacacion_decididoPorId_fkey" FOREIGN KEY ("decididoPorId") 
    REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Vacacion_estado_idx" ON "Vacacion"("estado");
CREATE INDEX IF NOT EXISTS "Vacacion_fechas_idx" ON "Vacacion"("fechaInicio", "fechaFin");
CREATE INDEX IF NOT EXISTS "Vacacion_empleadoId_idx" ON "Vacacion"("empleadoId");

-- Crear función y triggers para updatedAt
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_empleado_updated_at ON "Empleado";
CREATE TRIGGER update_empleado_updated_at
  BEFORE UPDATE ON "Empleado"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_licencia_updated_at ON "Licencia";
CREATE TRIGGER update_licencia_updated_at
  BEFORE UPDATE ON "Licencia"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_documento_updated_at ON "DocumentoEmpleado";
CREATE TRIGGER update_documento_updated_at
  BEFORE UPDATE ON "DocumentoEmpleado"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_vacacion_updated_at ON "Vacacion";
CREATE TRIGGER update_vacacion_updated_at
  BEFORE UPDATE ON "Vacacion"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Verificar tablas creadas
SELECT table_name, 
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN ('Empleado', 'Licencia', 'DocumentoEmpleado', 'Vacacion')
ORDER BY table_name;
SQL
```

---

## 📝 PASO 3: Verificar Migración

```bash
cd /opt/infra-caja/backend
export $(grep -v '^#' .env | xargs)

# Verificar que las tablas se crearon
psql "$DATABASE_URL" -c "
SELECT table_name, 
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN ('Empleado', 'Licencia', 'DocumentoEmpleado', 'Vacacion')
ORDER BY table_name;
"
```

---

## 📦 PASO 4: Sincronizar Código (Backend)

**NOTA**: Necesitas copiar los archivos desde desarrollo. Usa `rsync`, `scp`, o `git`.

Archivos a copiar:

```bash
# Desde tu máquina local (desarrollo):
# Usando rsync (recomendado):
rsync -av --exclude='node_modules' --exclude='dist' \
  backend/src/routes/vacaciones.routes.ts \
  backend/src/routes/licencias.routes.ts \
  backend/src/routes/empleados.routes.ts \
  backend/src/routes/documentos.routes.ts \
  intranet@192.168.123.147:/opt/infra-caja/backend/src/routes/

rsync -av --exclude='node_modules' --exclude='dist' \
  backend/src/controllers/vacaciones.controller.ts \
  backend/src/controllers/licencias.controller.ts \
  backend/src/controllers/empleados.controller.ts \
  intranet@192.168.123.147:/opt/infra-caja/backend/src/controllers/

rsync -av --exclude='node_modules' --exclude='dist' \
  backend/src/middlewares/rrhh.middleware.ts \
  backend/src/middlewares/rrhh.middleware.simple.ts \
  intranet@192.168.123.147:/opt/infra-caja/backend/src/middlewares/

# Actualizar routes/index.ts
rsync -av backend/src/routes/index.ts \
  intranet@192.168.123.147:/opt/infra-caja/backend/src/routes/

# Actualizar schema.prisma
rsync -av backend/prisma/schema.prisma \
  intranet@192.168.123.147:/opt/infra-caja/backend/prisma/
```

**O manualmente en producción**:
- Copiar los archivos usando `scp` o editarlos directamente en producción

---

## 🔧 PASO 5: Actualizar Backend en Producción

```bash
cd /opt/infra-caja/backend

# Instalar dependencias (por si faltan)
npm ci

# Generar Prisma Client
npx prisma generate

# Compilar
npm run build

# Reiniciar PM2
pm2 restart infra-backend-prod --update-env
pm2 save

# Verificar logs
pm2 logs infra-backend-prod --lines 50 --nostream
```

---

## 🌐 PASO 6: Sincronizar Código (Frontend)

**Desde desarrollo**, copiar archivos:

```bash
# Usando rsync:
rsync -av --exclude='node_modules' --exclude='dist' \
  frontend/src/pages/vacaciones/ \
  frontend/src/pages/rrhh/ \
  intranet@192.168.123.147:/opt/infra-caja/frontend/src/pages/

rsync -av --exclude='node_modules' --exclude='dist' \
  frontend/src/services/vacaciones.service.ts \
  frontend/src/services/licencias.service.ts \
  frontend/src/services/empleados.service.ts \
  intranet@192.168.123.147:/opt/infra-caja/frontend/src/services/

# Actualizar App.tsx
rsync -av frontend/src/App.tsx \
  intranet@192.168.123.147:/opt/infra-caja/frontend/src/

# Actualizar Dashboard.tsx
rsync -av frontend/src/pages/Dashboard.tsx \
  intranet@192.168.123.147:/opt/infra-caja/frontend/src/pages/
```

---

## 🏗️ PASO 7: Recompilar Frontend

```bash
cd /opt/infra-caja/frontend

# Instalar dependencias
npm ci

# Recompilar
npm run build

# Recargar Nginx
sudo systemctl reload nginx
```

---

## ✅ PASO 8: Verificación Final

```bash
# Verificar backend
curl http://localhost:4000/api/empleados
curl http://localhost:4000/api/vacaciones
curl http://localhost:4000/api/licencias

# Verificar PM2
pm2 ls

# Verificar Nginx
sudo nginx -t
sudo systemctl status nginx

# Verificar en navegador
# Acceder a http://192.168.123.147
# Probar login y rutas de RRHH
```

---

## 🔄 Rollback (Si algo falla)

```bash
# 1. Restaurar base de datos
cd /opt/infra-caja/backend
export $(grep -v '^#' .env | xargs)
psql "$DATABASE_URL" < /tmp/backups_produccion/db_backup_*.sql

# 2. Restaurar código
tar -xzf /tmp/backups_produccion/codigo_backup_*.tar.gz -C /

# 3. Recompilar y reiniciar
cd /opt/infra-caja/backend
npm ci
npx prisma generate
npm run build
pm2 restart infra-backend-prod

cd /opt/infra-caja/frontend
npm ci
npm run build
sudo systemctl reload nginx
```

---

## 📞 Próximos Pasos

1. ✅ Ejecutar PASO 1 (Backup)
2. ✅ Ejecutar PASO 2 (Migración SQL)
3. ✅ Ejecutar PASO 3 (Verificar)
4. ⏳ Sincronizar código (PASO 4 y 6)
5. ⏳ Recompilar y desplegar (PASO 5 y 7)
6. ⏳ Verificar funcionamiento (PASO 8)


