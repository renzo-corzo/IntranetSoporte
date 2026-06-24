-- Paso 1/3: ADITIVO. Seguro de correr con la app vieja todavia corriendo:
-- solo agrega tablas/columnas nuevas (nullable), no rompe nada existente.
BEGIN;

-- CreateEnum
CREATE TYPE "TipoEquipoCredencial" AS ENUM ('SERVIDOR_FISICO', 'MAQUINA_VIRTUAL', 'EQUIPO_RED', 'EQUIPO_USUARIO', 'SERVICIO');

-- AlterEnum (IF NOT EXISTS: en producción real este valor ya existía de
-- antes de este chequeo, aparentemente de un intento previo)
ALTER TYPE "TipoServicio" ADD VALUE IF NOT EXISTS 'WIFI';

-- AlterTable
ALTER TABLE "Relevamiento" ADD COLUMN     "empresaId" TEXT;

-- AlterTable
ALTER TABLE "Procedimiento" ADD COLUMN     "empresaId" TEXT;

-- AlterTable
ALTER TABLE "CategoriaTarea" ADD COLUMN     "empresaId" TEXT;

-- AlterTable
ALTER TABLE "Tarea" ADD COLUMN     "empresaId" TEXT;

-- AlterTable
ALTER TABLE "Categoria" ADD COLUMN     "empresaId" TEXT;

-- AlterTable
ALTER TABLE "Articulo" ADD COLUMN     "empresaId" TEXT;

-- AlterTable
ALTER TABLE "CategoriaStock" ADD COLUMN     "empresaId" TEXT;

-- AlterTable
ALTER TABLE "UnidadMedida" ADD COLUMN     "empresaId" TEXT;

-- AlterTable
ALTER TABLE "ProveedorStock" ADD COLUMN     "empresaId" TEXT;

-- AlterTable
ALTER TABLE "UbicacionStock" ADD COLUMN     "empresaId" TEXT;

-- AlterTable
ALTER TABLE "ProductoStock" ADD COLUMN     "empresaId" TEXT;

-- AlterTable
ALTER TABLE "TipoMovimiento" ADD COLUMN     "empresaId" TEXT;

-- AlterTable
ALTER TABLE "MovimientoStock" ADD COLUMN     "empresaId" TEXT;

-- AlterTable
ALTER TABLE "AlertaStock" ADD COLUMN     "empresaId" TEXT;

-- AlterTable
ALTER TABLE "ReporteStock" ADD COLUMN     "empresaId" TEXT;

-- AlterTable
ALTER TABLE "ServidorFisico" ADD COLUMN     "empresaId" TEXT;

-- AlterTable
ALTER TABLE "MaquinaVirtual" ADD COLUMN     "empresaId" TEXT;

-- AlterTable
ALTER TABLE "EquipoRed" ADD COLUMN     "empresaId" TEXT;

-- AlterTable
ALTER TABLE "EquipoUsuario" ADD COLUMN     "empresaId" TEXT;

-- AlterTable ("ssid" con IF NOT EXISTS: en producción real ya existía de
-- antes de este chequeo, igual que el valor 'WIFI' del enum de arriba)
ALTER TABLE "Servicio" ADD COLUMN     "empresaId" TEXT,
ADD COLUMN IF NOT EXISTS "ssid" TEXT,
ALTER COLUMN "tipoEquipo" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Empresa" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Empresa_pkey" PRIMARY KEY ("id")
);

-- NOTA: "Credencial" y "CredencialAcceso" ya existen en producción real (de
-- un intento previo, con 6 filas de credenciales reales) con una forma
-- distinta (columna "categoria"/TipoCredencial en vez de "tipoEquipo"/
-- TipoEquipoCredencial, sin empresaId). Esa reconciliación se hace en
-- 2026-06-19-reconciliar-credencial/01-migrar.sql, no acá: no hay CREATE
-- TABLE para ninguna de las dos en este paso.

-- CreateIndex
CREATE UNIQUE INDEX "Empresa_nombre_key" ON "Empresa"("nombre");

-- CreateIndex
CREATE INDEX "Empresa_nombre_idx" ON "Empresa"("nombre");

-- CreateIndex
CREATE INDEX "Relevamiento_empresaId_idx" ON "Relevamiento"("empresaId");

-- CreateIndex
CREATE INDEX "Procedimiento_empresaId_idx" ON "Procedimiento"("empresaId");

-- CreateIndex
CREATE INDEX "CategoriaTarea_empresaId_idx" ON "CategoriaTarea"("empresaId");

-- CreateIndex
CREATE INDEX "Tarea_empresaId_idx" ON "Tarea"("empresaId");

-- CreateIndex
CREATE INDEX "Categoria_empresaId_idx" ON "Categoria"("empresaId");

-- CreateIndex
CREATE INDEX "Articulo_empresaId_idx" ON "Articulo"("empresaId");

-- CreateIndex
CREATE INDEX "CategoriaStock_empresaId_idx" ON "CategoriaStock"("empresaId");

-- CreateIndex
CREATE INDEX "UnidadMedida_empresaId_idx" ON "UnidadMedida"("empresaId");

-- CreateIndex
CREATE INDEX "ProveedorStock_empresaId_idx" ON "ProveedorStock"("empresaId");

-- CreateIndex
CREATE INDEX "UbicacionStock_empresaId_idx" ON "UbicacionStock"("empresaId");

-- CreateIndex
CREATE INDEX "ProductoStock_empresaId_idx" ON "ProductoStock"("empresaId");

-- CreateIndex
CREATE INDEX "TipoMovimiento_empresaId_idx" ON "TipoMovimiento"("empresaId");

-- CreateIndex
CREATE INDEX "MovimientoStock_empresaId_idx" ON "MovimientoStock"("empresaId");

-- CreateIndex
CREATE INDEX "AlertaStock_empresaId_idx" ON "AlertaStock"("empresaId");

-- CreateIndex
CREATE INDEX "ReporteStock_empresaId_idx" ON "ReporteStock"("empresaId");

-- CreateIndex
CREATE INDEX "ServidorFisico_empresaId_idx" ON "ServidorFisico"("empresaId");

-- CreateIndex
CREATE INDEX "MaquinaVirtual_empresaId_idx" ON "MaquinaVirtual"("empresaId");

-- CreateIndex
CREATE INDEX "EquipoRed_empresaId_idx" ON "EquipoRed"("empresaId");

-- CreateIndex
CREATE INDEX "EquipoUsuario_empresaId_idx" ON "EquipoUsuario"("empresaId");

-- CreateIndex
CREATE INDEX "Servicio_empresaId_idx" ON "Servicio"("empresaId");

-- AddForeignKey
ALTER TABLE "Relevamiento" ADD CONSTRAINT "Relevamiento_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Procedimiento" ADD CONSTRAINT "Procedimiento_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoriaTarea" ADD CONSTRAINT "CategoriaTarea_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tarea" ADD CONSTRAINT "Tarea_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Categoria" ADD CONSTRAINT "Categoria_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Articulo" ADD CONSTRAINT "Articulo_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoriaStock" ADD CONSTRAINT "CategoriaStock_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnidadMedida" ADD CONSTRAINT "UnidadMedida_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProveedorStock" ADD CONSTRAINT "ProveedorStock_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UbicacionStock" ADD CONSTRAINT "UbicacionStock_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductoStock" ADD CONSTRAINT "ProductoStock_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TipoMovimiento" ADD CONSTRAINT "TipoMovimiento_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoStock" ADD CONSTRAINT "MovimientoStock_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertaStock" ADD CONSTRAINT "AlertaStock_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReporteStock" ADD CONSTRAINT "ReporteStock_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServidorFisico" ADD CONSTRAINT "ServidorFisico_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaquinaVirtual" ADD CONSTRAINT "MaquinaVirtual_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipoRed" ADD CONSTRAINT "EquipoRed_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipoUsuario" ADD CONSTRAINT "EquipoUsuario_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Servicio" ADD CONSTRAINT "Servicio_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE;


COMMIT;
