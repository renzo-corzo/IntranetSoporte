-- Ver README.md de esta carpeta. Corre DESPUÉS de
-- 2026-06-18-multicliente/01-additivo.sql (necesita que exista el tipo
-- "TipoEquipoCredencial" y la tabla "Empresa") y ANTES de
-- 2026-06-18-multicliente/02-backfill.sql (necesita que "Credencial" ya
-- tenga columna "empresaId" para que el backfill genérico la complete).
--
-- Los 3 ALTER TYPE van en esta transacción separada porque Postgres no
-- permite usar un valor de enum nuevo en la misma transacción en la que se
-- agregó (eso pasa en 02-migrar-tipoequipo.sql, después de que esto commitee).
BEGIN;

ALTER TYPE "TipoEquipoCredencial" ADD VALUE IF NOT EXISTS 'EMAIL';
ALTER TYPE "TipoEquipoCredencial" ADD VALUE IF NOT EXISTS 'ACCESO_REMOTO';
ALTER TYPE "TipoEquipoCredencial" ADD VALUE IF NOT EXISTS 'OTRO';

-- AlterTable (nullable por ahora; el backfill de multicliente lo completa)
ALTER TABLE "Credencial" ADD COLUMN IF NOT EXISTS "empresaId" TEXT;

COMMIT;
