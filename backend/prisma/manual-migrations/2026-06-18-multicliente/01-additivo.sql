-- Paso 1/3: ADITIVO. Seguro de correr con la app vieja todavia corriendo:
-- solo agrega tablas/columnas nuevas (nullable), no rompe nada existente.
BEGIN;

-- CreateEnum
CREATE TYPE "TipoEquipoCredencial" AS ENUM ('SERVIDOR_FISICO', 'MAQUINA_VIRTUAL', 'EQUIPO_RED', 'EQUIPO_USUARIO', 'SERVICIO');

-- AlterEnum
ALTER TYPE "TipoServicio" ADD VALUE 'WIFI';

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

-- AlterTable
ALTER TABLE "Servicio" ADD COLUMN     "empresaId" TEXT,
ADD COLUMN     "ssid" TEXT,
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

-- CreateTable
CREATE TABLE "Credencial" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "usuario" TEXT,
    "passwordCifrada" TEXT NOT NULL,
    "iv" TEXT NOT NULL,
    "authTag" TEXT NOT NULL,
    "notas" TEXT,
    "tipoEquipo" "TipoEquipoCredencial" NOT NULL,
    "servidorFisicoId" TEXT,
    "maquinaVirtualId" TEXT,
    "equipoRedId" TEXT,
    "equipoUsuarioId" TEXT,
    "servicioId" TEXT,
    "empresaId" TEXT,
    "creadoPorId" INTEGER NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Credencial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CredencialAcceso" (
    "id" TEXT NOT NULL,
    "credencialId" TEXT NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CredencialAcceso_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Empresa_nombre_key" ON "Empresa"("nombre");

-- CreateIndex
CREATE INDEX "Empresa_nombre_idx" ON "Empresa"("nombre");

-- CreateIndex
CREATE INDEX "Credencial_tipoEquipo_idx" ON "Credencial"("tipoEquipo");

-- CreateIndex
CREATE INDEX "Credencial_servidorFisicoId_idx" ON "Credencial"("servidorFisicoId");

-- CreateIndex
CREATE INDEX "Credencial_maquinaVirtualId_idx" ON "Credencial"("maquinaVirtualId");

-- CreateIndex
CREATE INDEX "Credencial_equipoRedId_idx" ON "Credencial"("equipoRedId");

-- CreateIndex
CREATE INDEX "Credencial_equipoUsuarioId_idx" ON "Credencial"("equipoUsuarioId");

-- CreateIndex
CREATE INDEX "Credencial_servicioId_idx" ON "Credencial"("servicioId");

-- CreateIndex
CREATE INDEX "Credencial_empresaId_idx" ON "Credencial"("empresaId");

-- CreateIndex
CREATE INDEX "CredencialAcceso_credencialId_idx" ON "CredencialAcceso"("credencialId");

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

-- AddForeignKey
ALTER TABLE "Credencial" ADD CONSTRAINT "Credencial_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Credencial" ADD CONSTRAINT "Credencial_servidorFisicoId_fkey" FOREIGN KEY ("servidorFisicoId") REFERENCES "ServidorFisico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Credencial" ADD CONSTRAINT "Credencial_maquinaVirtualId_fkey" FOREIGN KEY ("maquinaVirtualId") REFERENCES "MaquinaVirtual"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Credencial" ADD CONSTRAINT "Credencial_equipoRedId_fkey" FOREIGN KEY ("equipoRedId") REFERENCES "EquipoRed"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Credencial" ADD CONSTRAINT "Credencial_equipoUsuarioId_fkey" FOREIGN KEY ("equipoUsuarioId") REFERENCES "EquipoUsuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Credencial" ADD CONSTRAINT "Credencial_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "Servicio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Credencial" ADD CONSTRAINT "Credencial_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CredencialAcceso" ADD CONSTRAINT "CredencialAcceso_credencialId_fkey" FOREIGN KEY ("credencialId") REFERENCES "Credencial"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CredencialAcceso" ADD CONSTRAINT "CredencialAcceso_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


COMMIT;
