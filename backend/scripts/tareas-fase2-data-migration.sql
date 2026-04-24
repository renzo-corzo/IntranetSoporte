-- Tareas Fase 2 - Migracion de datos legacy
-- Ejecutar solo despues de aplicar schema Prisma (columnas nuevas ya creadas).
-- Recomendado: correr primero en staging/local.

-- 1) Normalizar estado legado en_progreso -> en_curso
UPDATE "Tarea"
SET "estado" = 'en_curso'
WHERE "estado" = 'en_progreso';

-- 2) Normalizar estado legado hecha -> resuelta y completar fechas de cierre
UPDATE "Tarea"
SET
  "estado" = 'resuelta',
  "fechaCierre" = COALESCE("fechaCierre", "finalizadaEn", NOW()),
  "finalizadaEn" = COALESCE("finalizadaEn", "fechaCierre", NOW())
WHERE "estado" = 'hecha';

-- 3) Para cerradas historicas sin fechaCierre
UPDATE "Tarea"
SET "fechaCierre" = COALESCE("fechaCierre", "finalizadaEn", NOW())
WHERE "estado" IN ('resuelta', 'cancelada')
  AND "fechaCierre" IS NULL;

-- 4) Mantener compatibilidad con finalizadaEn durante la transicion
UPDATE "Tarea"
SET "finalizadaEn" = COALESCE("finalizadaEn", "fechaCierre")
WHERE "estado" IN ('resuelta', 'cancelada')
  AND "finalizadaEn" IS NULL
  AND "fechaCierre" IS NOT NULL;

