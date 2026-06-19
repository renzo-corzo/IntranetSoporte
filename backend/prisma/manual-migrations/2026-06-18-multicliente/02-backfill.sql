-- Paso 2/3: BACKFILL. Correr SOLO despues de 01-additivo.sql.
-- Crea la empresa "Caja de Abogados" (si no existe) y le asigna todas las
-- filas existentes que todavia tengan empresaId NULL. No depende del codigo
-- nuevo del backend: es SQL puro, corre contra cualquier estado de la app.
-- Es seguro re-ejecutarlo (todo es idempotente: ON CONFLICT / WHERE ... IS NULL).

BEGIN;

DO $$
DECLARE
  v_empresa_id TEXT;
BEGIN
  INSERT INTO "Empresa" (id, nombre, activo, "createdAt", "updatedAt")
  VALUES ('cl-caja-de-abogados-001', 'Caja de Abogados', true, now(), now())
  ON CONFLICT (nombre) DO NOTHING;

  SELECT id INTO v_empresa_id FROM "Empresa" WHERE nombre = 'Caja de Abogados';

  UPDATE "Relevamiento"    SET "empresaId" = v_empresa_id WHERE "empresaId" IS NULL;
  UPDATE "Procedimiento"   SET "empresaId" = v_empresa_id WHERE "empresaId" IS NULL;
  UPDATE "CategoriaTarea"  SET "empresaId" = v_empresa_id WHERE "empresaId" IS NULL;
  UPDATE "Tarea"           SET "empresaId" = v_empresa_id WHERE "empresaId" IS NULL;
  UPDATE "Categoria"       SET "empresaId" = v_empresa_id WHERE "empresaId" IS NULL;
  UPDATE "Articulo"        SET "empresaId" = v_empresa_id WHERE "empresaId" IS NULL;
  UPDATE "CategoriaStock"  SET "empresaId" = v_empresa_id WHERE "empresaId" IS NULL;
  UPDATE "UnidadMedida"    SET "empresaId" = v_empresa_id WHERE "empresaId" IS NULL;
  UPDATE "ProveedorStock"  SET "empresaId" = v_empresa_id WHERE "empresaId" IS NULL;
  UPDATE "UbicacionStock"  SET "empresaId" = v_empresa_id WHERE "empresaId" IS NULL;
  UPDATE "ProductoStock"   SET "empresaId" = v_empresa_id WHERE "empresaId" IS NULL;
  UPDATE "TipoMovimiento"  SET "empresaId" = v_empresa_id WHERE "empresaId" IS NULL;
  UPDATE "MovimientoStock" SET "empresaId" = v_empresa_id WHERE "empresaId" IS NULL;
  UPDATE "AlertaStock"     SET "empresaId" = v_empresa_id WHERE "empresaId" IS NULL;
  UPDATE "ReporteStock"    SET "empresaId" = v_empresa_id WHERE "empresaId" IS NULL;
  UPDATE "ServidorFisico"  SET "empresaId" = v_empresa_id WHERE "empresaId" IS NULL;
  UPDATE "MaquinaVirtual"  SET "empresaId" = v_empresa_id WHERE "empresaId" IS NULL;
  UPDATE "EquipoRed"       SET "empresaId" = v_empresa_id WHERE "empresaId" IS NULL;
  UPDATE "EquipoUsuario"   SET "empresaId" = v_empresa_id WHERE "empresaId" IS NULL;
  UPDATE "Servicio"        SET "empresaId" = v_empresa_id WHERE "empresaId" IS NULL;
  UPDATE "Credencial"      SET "empresaId" = v_empresa_id WHERE "empresaId" IS NULL;

  RAISE NOTICE 'Empresa base "Caja de Abogados" id = %', v_empresa_id;
END $$;

COMMIT;

-- Verificacion rapida (deberia devolver 0 filas en TODAS las tablas):
-- SELECT 'Relevamiento' t, count(*) FROM "Relevamiento" WHERE "empresaId" IS NULL
-- UNION ALL SELECT 'Procedimiento', count(*) FROM "Procedimiento" WHERE "empresaId" IS NULL
-- UNION ALL SELECT 'CategoriaTarea', count(*) FROM "CategoriaTarea" WHERE "empresaId" IS NULL
-- UNION ALL SELECT 'Tarea', count(*) FROM "Tarea" WHERE "empresaId" IS NULL
-- UNION ALL SELECT 'Categoria', count(*) FROM "Categoria" WHERE "empresaId" IS NULL
-- UNION ALL SELECT 'Articulo', count(*) FROM "Articulo" WHERE "empresaId" IS NULL
-- UNION ALL SELECT 'CategoriaStock', count(*) FROM "CategoriaStock" WHERE "empresaId" IS NULL
-- UNION ALL SELECT 'UnidadMedida', count(*) FROM "UnidadMedida" WHERE "empresaId" IS NULL
-- UNION ALL SELECT 'ProveedorStock', count(*) FROM "ProveedorStock" WHERE "empresaId" IS NULL
-- UNION ALL SELECT 'UbicacionStock', count(*) FROM "UbicacionStock" WHERE "empresaId" IS NULL
-- UNION ALL SELECT 'ProductoStock', count(*) FROM "ProductoStock" WHERE "empresaId" IS NULL
-- UNION ALL SELECT 'TipoMovimiento', count(*) FROM "TipoMovimiento" WHERE "empresaId" IS NULL
-- UNION ALL SELECT 'MovimientoStock', count(*) FROM "MovimientoStock" WHERE "empresaId" IS NULL
-- UNION ALL SELECT 'AlertaStock', count(*) FROM "AlertaStock" WHERE "empresaId" IS NULL
-- UNION ALL SELECT 'ReporteStock', count(*) FROM "ReporteStock" WHERE "empresaId" IS NULL
-- UNION ALL SELECT 'ServidorFisico', count(*) FROM "ServidorFisico" WHERE "empresaId" IS NULL
-- UNION ALL SELECT 'MaquinaVirtual', count(*) FROM "MaquinaVirtual" WHERE "empresaId" IS NULL
-- UNION ALL SELECT 'EquipoRed', count(*) FROM "EquipoRed" WHERE "empresaId" IS NULL
-- UNION ALL SELECT 'EquipoUsuario', count(*) FROM "EquipoUsuario" WHERE "empresaId" IS NULL
-- UNION ALL SELECT 'Servicio', count(*) FROM "Servicio" WHERE "empresaId" IS NULL
-- UNION ALL SELECT 'Credencial', count(*) FROM "Credencial" WHERE "empresaId" IS NULL;
