-- Migración para crear tablas de RRHH en producción
-- IMPORTANTE: Ejecutar después de hacer backup completo
-- Uso: psql $DATABASE_URL -f scripts/migracion-rrhh-produccion.sql

BEGIN;

-- 1. Crear enums (si no existen)
DO $$ BEGIN
  CREATE TYPE "EstadoEmpleado" AS ENUM ('ACTIVO', 'INACTIVO');
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Enum EstadoEmpleado ya existe';
END $$;

DO $$ BEGIN
  CREATE TYPE "TipoDocumento" AS ENUM ('DNI', 'CONTRATO', 'CERTIFICADO_MEDICO', 'CERTIFICADO_ESTUDIOS', 'OTRO');
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Enum TipoDocumento ya existe';
END $$;

DO $$ BEGIN
  CREATE TYPE "EstadoVacacion" AS ENUM ('PENDIENTE', 'APROBADA', 'RECHAZADA', 'CANCELADA');
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Enum EstadoVacacion ya existe';
END $$;

-- 2. Verificar si existe tabla Vacacion antigua (ya verificado que NO existe)
DO $$
BEGIN
  RAISE NOTICE 'Tabla Vacacion antigua no existe en producción. Se creará nueva tabla.';
END $$;

-- 3. Crear tabla Empleado
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

-- Índices para Empleado
CREATE INDEX IF NOT EXISTS "Empleado_departamento_idx" ON "Empleado"("departamento");
CREATE INDEX IF NOT EXISTS "Empleado_estado_idx" ON "Empleado"("estado");
CREATE INDEX IF NOT EXISTS "Empleado_email_idx" ON "Empleado"("email");

-- 4. Crear tabla Licencia
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

-- Índices para Licencia
CREATE INDEX IF NOT EXISTS "Licencia_empleadoId_idx" ON "Licencia"("empleadoId");
CREATE INDEX IF NOT EXISTS "Licencia_fechas_idx" ON "Licencia"("fechaInicio", "fechaFin");

-- 5. Crear tabla DocumentoEmpleado
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

-- Índices para DocumentoEmpleado
CREATE INDEX IF NOT EXISTS "DocumentoEmpleado_empleadoId_idx" ON "DocumentoEmpleado"("empleadoId");
CREATE INDEX IF NOT EXISTS "DocumentoEmpleado_tipoArchivo_idx" ON "DocumentoEmpleado"("tipoArchivo");

-- 6. Crear tabla Vacacion (nueva estructura con String id y referencia a Empleado)
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

-- Índices para Vacacion
CREATE INDEX IF NOT EXISTS "Vacacion_estado_idx" ON "Vacacion"("estado");
CREATE INDEX IF NOT EXISTS "Vacacion_fechas_idx" ON "Vacacion"("fechaInicio", "fechaFin");
CREATE INDEX IF NOT EXISTS "Vacacion_empleadoId_idx" ON "Vacacion"("empleadoId");

-- 6. Trigger para updatedAt en Empleado
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

COMMIT;

-- Trigger para updatedAt en Vacacion
DROP TRIGGER IF EXISTS update_vacacion_updated_at ON "Vacacion";
CREATE TRIGGER update_vacacion_updated_at
  BEFORE UPDATE ON "Vacacion"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Verificar que se crearon las tablas
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN ('Empleado', 'Licencia', 'DocumentoEmpleado', 'Vacacion')
ORDER BY table_name;

