-- Ver README.md de esta carpeta. Corre DESPUÉS de
-- 2026-06-18-multicliente/03-restrictivo.sql (que ya corrió DESPUÉS del
-- backfill, así que "Credencial"."empresaId" ya está completo en todas las
-- filas). Si quedó alguna fila sin empresaId, esto falla solo (no corrompe
-- nada) -- misma red de seguridad que el paso restrictivo de multicliente.
BEGIN;

ALTER TABLE "Credencial" DROP CONSTRAINT "Credencial_empresaId_fkey";
ALTER TABLE "Credencial" ALTER COLUMN "empresaId" SET NOT NULL;
ALTER TABLE "Credencial" ADD CONSTRAINT "Credencial_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

COMMIT;
