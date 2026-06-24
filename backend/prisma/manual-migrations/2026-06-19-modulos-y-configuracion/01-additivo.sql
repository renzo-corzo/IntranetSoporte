-- Aditivo: el commit dc40583 ("módulos habilitados por cliente y apagado
-- global de RRHH") agregó ConfiguracionSistema y Empresa.modulosHabilitados
-- al schema pero nunca se escribió la migración manual correspondiente
-- (production nunca llegó a tener ninguna de las tablas de multicliente).
-- Todo aditivo: tabla nueva + columna nueva con default, no rompe nada
-- existente. Debe correr DESPUÉS de 2026-06-18-multicliente/01-additivo.sql
-- (depende de que exista la tabla "Empresa").
BEGIN;

-- CreateTable
CREATE TABLE "ConfiguracionSistema" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "rrhhHabilitado" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfiguracionSistema_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Empresa" ADD COLUMN "modulosHabilitados" TEXT[] NOT NULL DEFAULT ARRAY['cmdb', 'stock', 'tareas', 'relevamientos', 'procedimientos', 'kb']::TEXT[];

COMMIT;
