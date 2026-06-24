-- Ver README.md de esta carpeta. Corre DESPUÉS de 01-enum-y-empresaid.sql
-- (en transacción separada, ver por qué en ese archivo).
--
-- Convierte Credencial.categoria (TipoCredencial) a Credencial.tipoEquipo
-- (TipoEquipoCredencial) preservando las 6 filas reales. Mapeo 1 a 1 salvo
-- VPN -> ACCESO_REMOTO (ver README.md).
BEGIN;

-- AlterTable
ALTER TABLE "Credencial" ADD COLUMN "tipoEquipo" "TipoEquipoCredencial";

-- Migrar datos
UPDATE "Credencial" SET "tipoEquipo" = (CASE "categoria"::text
  WHEN 'VPN' THEN 'ACCESO_REMOTO'
  ELSE "categoria"::text
END)::"TipoEquipoCredencial";

-- Ya migrado: hacerlo obligatorio (como en el schema actual)
ALTER TABLE "Credencial" ALTER COLUMN "tipoEquipo" SET NOT NULL;

-- Borrar columna y tipo viejos
DROP INDEX IF EXISTS "Credencial_categoria_idx";
ALTER TABLE "Credencial" DROP COLUMN "categoria";
DROP TYPE "TipoCredencial";

-- Indices nuevos (igual que las demás tablas en 01-additivo.sql)
CREATE INDEX "Credencial_tipoEquipo_idx" ON "Credencial"("tipoEquipo");
CREATE INDEX "Credencial_empresaId_idx" ON "Credencial"("empresaId");

-- FK de empresaId (nullable por ahora, SET NULL; se vuelve RESTRICT en
-- 03-restrictivo-empresaid.sql junto con el NOT NULL)
ALTER TABLE "Credencial" ADD CONSTRAINT "Credencial_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

COMMIT;
