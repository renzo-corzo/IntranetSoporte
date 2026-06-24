-- Aditivo: agrega los valores de TipoEquipoCredencial para accesos standalone
-- (sin equipo del CMDB asociado) y la columna url en Credencial.
-- Seguro de correr con la app vieja todavia corriendo: solo agrega
-- valores de enum y una columna nullable, no rompe nada existente.
-- IF NOT EXISTS en todo: en producción real ya existían de antes (ver
-- 2026-06-19-reconciliar-credencial/README.md), de un intento previo.
BEGIN;

-- AlterEnum
ALTER TYPE "TipoEquipoCredencial" ADD VALUE IF NOT EXISTS 'EMAIL';
ALTER TYPE "TipoEquipoCredencial" ADD VALUE IF NOT EXISTS 'ACCESO_REMOTO';
ALTER TYPE "TipoEquipoCredencial" ADD VALUE IF NOT EXISTS 'OTRO';

-- AlterTable
ALTER TABLE "Credencial" ADD COLUMN IF NOT EXISTS "url" TEXT;

COMMIT;
