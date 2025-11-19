# Plan de Migración de Desarrollo a Producción

## 📋 Resumen Ejecutivo

**Objetivo**: Migrar los cambios del módulo RRHH (Empleados, Vacaciones, Licencias) desde desarrollo a producción sin pérdida de datos.

**Fecha de análisis**: 2025-11-05

**Riesgos identificados**:
- ⚠️ Discrepancia entre schema.prisma y migraciones existentes
- ⚠️ Tabla `Vacacion` antigua en producción (diseño diferente)
- ⚠️ Faltan tablas: `Empleado`, `Licencia`, `DocumentoEmpleado`
- ⚠️ Faltan rutas y controladores en backend de producción
- ⚠️ Faltan componentes y rutas en frontend de producción

---

## 🔍 Análisis de Diferencias

### Base de Datos

#### Tablas Faltantes en Producción:
1. **Empleado** - Modelo principal de RRHH
   - `id` String (cuid)
   - `nombre`, `apellido`, `dni`, `email`
   - `departamento`, `estado`, `fechaIngreso`
   - `diasDisponibles` (default: 20)

2. **Licencia** - Licencias especiales
   - `id` String (cuid)
   - `empleadoId` String (FK a Empleado)
   - `tipo`, `fechaInicio`, `fechaFin`
   - `observaciones`

3. **DocumentoEmpleado** - Documentos adjuntos
   - `id` String (cuid)
   - `empleadoId` String (FK a Empleado)
   - `nombreArchivo`, `tipoArchivo`, `urlArchivo`

#### Tabla Vacacion - ✅ VERIFICADO:
- **Estado**: La tabla `Vacacion` antigua NO existe en producción
- **Conclusión**: No hay conflicto, podemos crear la tabla nueva directamente
- **Acción requerida**: Crear tabla nueva según schema actual (con String id y referencia a Empleado)

#### Enums Faltantes:
- `EstadoEmpleado` (ACTIVO, INACTIVO)
- `TipoDocumento` (DNI, CONTRATO, CERTIFICADO_MEDICO, etc.)

### Backend

#### Rutas Faltantes en Producción:
- `/api/vacaciones` - `vacaciones.routes.ts`
- `/api/licencias` - `licencias.routes.ts`
- `/api/empleados` - `empleados.routes.ts`
- `/api/documentos` - `documentos.routes.ts`

#### Controladores Faltantes:
- `vacaciones.controller.ts`
- `licencias.controller.ts`
- `empleados.controller.ts`
- `documentos.controller.ts` (si existe)

#### Middlewares Faltantes:
- `rrhh.middleware.ts` o `rrhh.middleware.simple.ts`

### Frontend

#### Rutas Faltantes:
- `/dashboard/vacaciones/mis`
- `/dashboard/vacaciones/admin`
- `/dashboard/vacaciones/rrhh`
- `/dashboard/rrhh`
- `/dashboard/roles/permisos`

#### Componentes Faltantes:
- `MisVacaciones.tsx`
- `VacacionesAdmin.tsx`
- `VacacionesRRHH_Final.tsx`
- `DashboardRRHH.tsx`
- `RolesPermisosPage.tsx`
- Componentes de licencias
- Componentes de empleados

---

## 🚀 Plan de Migración Paso a Paso

### FASE 1: Preparación y Backup (⚠️ CRÍTICO)

#### 1.1 Backup Completo de Producción
```bash
# En producción, ejecutar:
cd /opt/infra-caja/backend

# Backup de base de datos
pg_dump $DATABASE_URL > /tmp/backup_prod_$(date +%Y%m%d_%H%M%S).sql

# Backup de código
tar -czf /tmp/backup_codigo_prod_$(date +%Y%m%d_%H%M%S).tar.gz \
  /opt/infra-caja/backend \
  /opt/infra-caja/frontend \
  /etc/nginx/sites-available/infra-caja
```

#### 1.2 Verificar Estado Actual
- ✅ Migraciones aplicadas: 12
- ✅ Tabla Vacacion antigua existe (verificar datos)
- ⚠️ Tabla Empleado NO existe
- ⚠️ Tabla Licencia NO existe

### FASE 2: Crear Migraciones para Nuevas Tablas

#### 2.1 Generar Migración para Empleado, Licencia, DocumentoEmpleado
**IMPORTANTE**: Crear migración manualmente para evitar conflictos con Vacacion existente.

```sql
-- Migración: crear_tablas_rrhh.sql
-- Crear enums
DO $$ BEGIN
  CREATE TYPE "EstadoEmpleado" AS ENUM ('ACTIVO', 'INACTIVO');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "TipoDocumento" AS ENUM ('DNI', 'CONTRATO', 'CERTIFICADO_MEDICO', 'CERTIFICADO_ESTUDIOS', 'OTRO');
EXCEPTION
  WHEN duplicate_object THEN null;
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
  "updatedAt" TIMESTAMP(3) NOT NULL
);

-- Índices para Empleado
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
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Licencia_empleadoId_fkey" FOREIGN KEY ("empleadoId") 
    REFERENCES "Empleado"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Índices para Licencia
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
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DocumentoEmpleado_empleadoId_fkey" FOREIGN KEY ("empleadoId") 
    REFERENCES "Empleado"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Índices para DocumentoEmpleado
CREATE INDEX IF NOT EXISTS "DocumentoEmpleado_empleadoId_idx" ON "DocumentoEmpleado"("empleadoId");
CREATE INDEX IF NOT EXISTS "DocumentoEmpleado_tipoArchivo_idx" ON "DocumentoEmpleado"("tipoArchivo");
```

#### 2.2 Verificar Tabla Vacacion Antigua ✅ COMPLETADO

**Estado verificado**: La tabla `Vacacion` antigua NO existe en producción.

**Conclusión**: No hay conflicto, podemos crear la nueva tabla `Vacacion` directamente según el schema actual.

**Acción**: La nueva tabla `Vacacion` se creará automáticamente cuando se actualice el schema de Prisma o se ejecute la migración SQL.

### FASE 3: Actualizar Schema Prisma

#### 3.1 Verificar Schema en Producción
- Comparar `schema.prisma` de desarrollo vs producción
- Asegurar que ambos sean idénticos ANTES de migrar

#### 3.2 Generar Prisma Client
```bash
cd /opt/infra-caja/backend
npx prisma generate
```

### FASE 4: Sincronizar Código Backend

#### 4.1 Archivos a Copiar/Sincronizar:
```
backend/src/routes/vacaciones.routes.ts
backend/src/routes/licencias.routes.ts
backend/src/routes/empleados.routes.ts
backend/src/routes/documentos.routes.ts (si existe)
backend/src/controllers/vacaciones.controller.ts
backend/src/controllers/licencias.controller.ts
backend/src/controllers/empleados.controller.ts
backend/src/middlewares/rrhh.middleware.ts (o rrhh.middleware.simple.ts)
backend/src/routes/index.ts (actualizar para incluir nuevas rutas)
```

#### 4.2 Dependencias a Verificar:
- `date-fns` (ya instalado en dev)
- Verificar que no falten otras dependencias

### FASE 5: Sincronizar Código Frontend

#### 5.1 Archivos a Copiar/Sincronizar:
```
frontend/src/pages/vacaciones/
frontend/src/pages/rrhh/
frontend/src/components/rrhh/ (si existe)
frontend/src/services/vacaciones.service.ts
frontend/src/services/licencias.service.ts
frontend/src/services/empleados.service.ts
frontend/src/App.tsx (actualizar rutas)
frontend/src/pages/Dashboard.tsx (actualizar menú)
```

#### 5.2 Dependencias a Verificar:
- `@fullcalendar/react` y dependencias (ya instalado en dev)
- Verificar que no falten otras dependencias

### FASE 6: Aplicar Migraciones en Producción

#### 6.1 Aplicar Migración de Nuevas Tablas
```bash
cd /opt/infra-caja/backend

# Opción 1: Usar Prisma migrate (si se crea migración formal)
npx prisma migrate dev --name add_rrhh_tables

# Opción 2: Ejecutar SQL manualmente (más control)
psql $DATABASE_URL -f /tmp/crear_tablas_rrhh.sql
```

#### 6.2 Verificar Migraciones
```bash
npx prisma migrate status
```

### FASE 7: Reconstruir y Desplegar

#### 7.1 Backend
```bash
cd /opt/infra-caja/backend
npm ci
npx prisma generate
npm run build

# Reiniciar con PM2
pm2 restart infra-backend-prod --update-env
pm2 save
```

#### 7.2 Frontend
```bash
cd /opt/infra-caja/frontend
npm ci
npm run build

# Recargar Nginx
sudo systemctl reload nginx
```

### FASE 8: Verificación y Rollback

#### 8.1 Verificaciones Post-Migración
- ✅ Backend responde en `/api/health`
- ✅ Rutas nuevas responden: `/api/empleados`, `/api/vacaciones`, `/api/licencias`
- ✅ Frontend carga correctamente
- ✅ Rutas de RRHH son accesibles
- ✅ Login funciona
- ✅ Permisos funcionan correctamente

#### 8.2 Plan de Rollback
Si algo falla:
1. Restaurar backup de base de datos: `psql $DATABASE_URL < /tmp/backup_prod_*.sql`
2. Restaurar código: `tar -xzf /tmp/backup_codigo_prod_*.tar.gz -C /`
3. Reconstruir backend y frontend
4. Reiniciar servicios

---

## ⚠️ PUNTOS CRÍTICOS DE ATENCIÓN

1. **Tabla Vacacion antigua**: Decidir si eliminar o migrar datos ANTES de continuar
2. **Permisos y roles**: Asegurar que los roles existentes tengan permisos de RRHH
3. **Variables de entorno**: Verificar que `DATABASE_URL` y otras sean correctas
4. **Prisma Client**: Siempre ejecutar `npx prisma generate` después de cambios en schema
5. **Dependencias**: Verificar que todas las dependencias estén instaladas

---

## 📝 Checklist de Migración

### Pre-Migración
- [ ] Backup completo de base de datos
- [ ] Backup completo de código
- [ ] Verificar estado de migraciones en producción
- [ ] Verificar si hay datos en tabla Vacacion antigua
- [ ] Documentar decisión sobre tabla Vacacion antigua

### Migración Base de Datos
- [ ] Crear migración SQL para nuevas tablas
- [ ] Verificar que enums no existan antes de crearlos
- [ ] Aplicar migración en ambiente de prueba (si existe)
- [ ] Aplicar migración en producción
- [ ] Verificar que tablas se crearon correctamente

### Migración Backend
- [ ] Copiar archivos de rutas faltantes
- [ ] Copiar archivos de controladores faltantes
- [ ] Copiar middlewares faltantes
- [ ] Actualizar `routes/index.ts`
- [ ] Verificar dependencias en `package.json`
- [ ] Instalar dependencias faltantes
- [ ] Generar Prisma Client
- [ ] Compilar backend
- [ ] Reiniciar backend con PM2

### Migración Frontend
- [ ] Copiar componentes de RRHH
- [ ] Copiar servicios de API
- [ ] Actualizar `App.tsx` con nuevas rutas
- [ ] Actualizar `Dashboard.tsx` con menú
- [ ] Verificar dependencias en `package.json`
- [ ] Instalar dependencias faltantes
- [ ] Compilar frontend
- [ ] Recargar Nginx

### Post-Migración
- [ ] Verificar que backend responde
- [ ] Verificar que frontend carga
- [ ] Probar login
- [ ] Probar rutas de RRHH
- [ ] Verificar permisos
- [ ] Documentar cambios realizados

---

## 🔄 Plan de Rollback

Si algo falla durante la migración:

1. **Detener servicios**:
   ```bash
   pm2 stop infra-backend-prod
   sudo systemctl stop nginx
   ```

2. **Restaurar base de datos**:
   ```bash
   psql $DATABASE_URL < /tmp/backup_prod_*.sql
   ```

3. **Restaurar código**:
   ```bash
   tar -xzf /tmp/backup_codigo_prod_*.tar.gz -C /
   ```

4. **Reconstruir y reiniciar**:
   ```bash
   cd /opt/infra-caja/backend
   npm ci
   npx prisma generate
   npm run build
   pm2 restart infra-backend-prod
   
   cd /opt/infra-caja/frontend
   npm ci
   npm run build
   sudo systemctl start nginx
   ```

---

## 📅 Cronograma Sugerido

1. **Día 1 - Preparación**:
   - Ejecutar backups
   - Verificar estado actual
   - Decidir sobre tabla Vacacion antigua

2. **Día 2 - Migración Base de Datos**:
   - Crear y aplicar migraciones
   - Verificar integridad

3. **Día 3 - Migración Código**:
   - Sincronizar backend
   - Sincronizar frontend
   - Probar en ambiente de prueba (si existe)

4. **Día 4 - Despliegue y Verificación**:
   - Desplegar en producción
   - Verificar funcionamiento
   - Documentar cambios

---

## 📞 Contacto y Soporte

En caso de problemas durante la migración:
1. Revisar logs: `pm2 logs infra-backend-prod`
2. Verificar base de datos: `npx prisma migrate status`
3. Verificar Nginx: `sudo nginx -t && sudo systemctl status nginx`
4. Ejecutar rollback si es necesario

