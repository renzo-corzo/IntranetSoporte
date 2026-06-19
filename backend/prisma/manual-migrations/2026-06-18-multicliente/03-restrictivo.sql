-- Paso 3/3: RESTRICTIVO. Correr SOLO despues de 02-backfill.sql.
-- Si quedo alguna fila con empresaId NULL, esto falla solo (no corrompe nada) -- es la red de seguridad.
BEGIN;

-- DropForeignKey
ALTER TABLE "Relevamiento" DROP CONSTRAINT "Relevamiento_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "Procedimiento" DROP CONSTRAINT "Procedimiento_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "CategoriaTarea" DROP CONSTRAINT "CategoriaTarea_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "Tarea" DROP CONSTRAINT "Tarea_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "Categoria" DROP CONSTRAINT "Categoria_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "Articulo" DROP CONSTRAINT "Articulo_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "CategoriaStock" DROP CONSTRAINT "CategoriaStock_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "UnidadMedida" DROP CONSTRAINT "UnidadMedida_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "ProveedorStock" DROP CONSTRAINT "ProveedorStock_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "UbicacionStock" DROP CONSTRAINT "UbicacionStock_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "ProductoStock" DROP CONSTRAINT "ProductoStock_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "TipoMovimiento" DROP CONSTRAINT "TipoMovimiento_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "MovimientoStock" DROP CONSTRAINT "MovimientoStock_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "AlertaStock" DROP CONSTRAINT "AlertaStock_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "ReporteStock" DROP CONSTRAINT "ReporteStock_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "ServidorFisico" DROP CONSTRAINT "ServidorFisico_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "MaquinaVirtual" DROP CONSTRAINT "MaquinaVirtual_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "EquipoRed" DROP CONSTRAINT "EquipoRed_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "EquipoUsuario" DROP CONSTRAINT "EquipoUsuario_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "Servicio" DROP CONSTRAINT "Servicio_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "Credencial" DROP CONSTRAINT "Credencial_empresaId_fkey";

-- DropIndex
DROP INDEX "CategoriaTarea_nombre_key";

-- DropIndex
DROP INDEX "CategoriaStock_nombre_key";

-- DropIndex
DROP INDEX "UnidadMedida_nombre_key";

-- DropIndex
DROP INDEX "UnidadMedida_abreviacion_key";

-- DropIndex
DROP INDEX "ProveedorStock_nombre_key";

-- DropIndex
DROP INDEX "UbicacionStock_nombre_key";

-- DropIndex
DROP INDEX "ProductoStock_codigo_key";

-- DropIndex
DROP INDEX "TipoMovimiento_nombre_key";

-- DropIndex
DROP INDEX "MovimientoStock_numero_key";

-- DropIndex
DROP INDEX "ServidorFisico_serie_key";

-- DropIndex
DROP INDEX "EquipoRed_serie_key";

-- DropIndex
DROP INDEX "EquipoUsuario_serie_key";

-- AlterTable
ALTER TABLE "Relevamiento" ALTER COLUMN "empresaId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Procedimiento" ALTER COLUMN "empresaId" SET NOT NULL;

-- AlterTable
ALTER TABLE "CategoriaTarea" ALTER COLUMN "empresaId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Tarea" ALTER COLUMN "empresaId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Categoria" ALTER COLUMN "empresaId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Articulo" ALTER COLUMN "empresaId" SET NOT NULL;

-- AlterTable
ALTER TABLE "CategoriaStock" ALTER COLUMN "empresaId" SET NOT NULL;

-- AlterTable
ALTER TABLE "UnidadMedida" ALTER COLUMN "empresaId" SET NOT NULL;

-- AlterTable
ALTER TABLE "ProveedorStock" ALTER COLUMN "empresaId" SET NOT NULL;

-- AlterTable
ALTER TABLE "UbicacionStock" ALTER COLUMN "empresaId" SET NOT NULL;

-- AlterTable
ALTER TABLE "ProductoStock" ALTER COLUMN "empresaId" SET NOT NULL;

-- AlterTable
ALTER TABLE "TipoMovimiento" ALTER COLUMN "empresaId" SET NOT NULL;

-- AlterTable
ALTER TABLE "MovimientoStock" ALTER COLUMN "empresaId" SET NOT NULL;

-- AlterTable
ALTER TABLE "AlertaStock" ALTER COLUMN "empresaId" SET NOT NULL;

-- AlterTable
ALTER TABLE "ReporteStock" ALTER COLUMN "empresaId" SET NOT NULL;

-- AlterTable
ALTER TABLE "ServidorFisico" ALTER COLUMN "empresaId" SET NOT NULL;

-- AlterTable
ALTER TABLE "MaquinaVirtual" ALTER COLUMN "empresaId" SET NOT NULL;

-- AlterTable
ALTER TABLE "EquipoRed" ALTER COLUMN "empresaId" SET NOT NULL;

-- AlterTable
ALTER TABLE "EquipoUsuario" ALTER COLUMN "empresaId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Servicio" ALTER COLUMN "empresaId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Credencial" ALTER COLUMN "empresaId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "CategoriaTarea_empresaId_nombre_key" ON "CategoriaTarea"("empresaId", "nombre");

-- CreateIndex
CREATE UNIQUE INDEX "CategoriaStock_empresaId_nombre_key" ON "CategoriaStock"("empresaId", "nombre");

-- CreateIndex
CREATE UNIQUE INDEX "UnidadMedida_empresaId_nombre_key" ON "UnidadMedida"("empresaId", "nombre");

-- CreateIndex
CREATE UNIQUE INDEX "UnidadMedida_empresaId_abreviacion_key" ON "UnidadMedida"("empresaId", "abreviacion");

-- CreateIndex
CREATE UNIQUE INDEX "ProveedorStock_empresaId_nombre_key" ON "ProveedorStock"("empresaId", "nombre");

-- CreateIndex
CREATE UNIQUE INDEX "UbicacionStock_empresaId_nombre_key" ON "UbicacionStock"("empresaId", "nombre");

-- CreateIndex
CREATE UNIQUE INDEX "ProductoStock_empresaId_codigo_key" ON "ProductoStock"("empresaId", "codigo");

-- CreateIndex
CREATE UNIQUE INDEX "TipoMovimiento_empresaId_nombre_key" ON "TipoMovimiento"("empresaId", "nombre");

-- CreateIndex
CREATE UNIQUE INDEX "MovimientoStock_empresaId_numero_key" ON "MovimientoStock"("empresaId", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "ServidorFisico_empresaId_serie_key" ON "ServidorFisico"("empresaId", "serie");

-- CreateIndex
CREATE UNIQUE INDEX "EquipoRed_empresaId_serie_key" ON "EquipoRed"("empresaId", "serie");

-- CreateIndex
CREATE UNIQUE INDEX "EquipoUsuario_empresaId_serie_key" ON "EquipoUsuario"("empresaId", "serie");

-- AddForeignKey
ALTER TABLE "Relevamiento" ADD CONSTRAINT "Relevamiento_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Procedimiento" ADD CONSTRAINT "Procedimiento_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoriaTarea" ADD CONSTRAINT "CategoriaTarea_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tarea" ADD CONSTRAINT "Tarea_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Categoria" ADD CONSTRAINT "Categoria_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Articulo" ADD CONSTRAINT "Articulo_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoriaStock" ADD CONSTRAINT "CategoriaStock_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnidadMedida" ADD CONSTRAINT "UnidadMedida_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProveedorStock" ADD CONSTRAINT "ProveedorStock_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UbicacionStock" ADD CONSTRAINT "UbicacionStock_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductoStock" ADD CONSTRAINT "ProductoStock_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TipoMovimiento" ADD CONSTRAINT "TipoMovimiento_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoStock" ADD CONSTRAINT "MovimientoStock_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertaStock" ADD CONSTRAINT "AlertaStock_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReporteStock" ADD CONSTRAINT "ReporteStock_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServidorFisico" ADD CONSTRAINT "ServidorFisico_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaquinaVirtual" ADD CONSTRAINT "MaquinaVirtual_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipoRed" ADD CONSTRAINT "EquipoRed_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipoUsuario" ADD CONSTRAINT "EquipoUsuario_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Servicio" ADD CONSTRAINT "Servicio_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Credencial" ADD CONSTRAINT "Credencial_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


COMMIT;
