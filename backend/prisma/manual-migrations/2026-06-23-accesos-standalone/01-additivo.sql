-- Aditivo: agrega los valores de TipoEquipoCredencial para accesos standalone
-- (sin equipo del CMDB asociado) y la columna url en Credencial.
-- Seguro de correr con la app vieja todavia corriendo: solo agrega
-- valores de enum y una columna nullable, no rompe nada existente.
BEGIN;

-- AlterEnum
ALTER TYPE "TipoEquipoCredencial" ADD VALUE 'EMAIL';
ALTER TYPE "TipoEquipoCredencial" ADD VALUE 'ACCESO_REMOTO';
ALTER TYPE "TipoEquipoCredencial" ADD VALUE 'OTRO';

-- AlterTable
ALTER TABLE "Credencial" ADD COLUMN "url" TEXT;

COMMIT;
