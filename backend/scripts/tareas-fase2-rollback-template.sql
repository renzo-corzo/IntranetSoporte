-- Tareas Fase 2 - Rollback template
-- Requiere tabla backup creada antes de migrar (ej: Tarea_backup_fase2_YYYYMMDDHHMMSS).
-- Reemplazar __BACKUP_TABLE__ por el nombre real generado en tu corrida.

UPDATE "Tarea" AS t
SET
  "estado" = b."estado",
  "fechaCierre" = b."fechaCierre",
  "finalizadaEn" = b."finalizadaEn",
  "actualizadaEn" = b."actualizadaEn",
  "categoria" = b."categoria",
  "origen" = b."origen",
  "impacto" = b."impacto",
  "solicitante" = b."solicitante",
  "activoRelacionado" = b."activoRelacionado",
  "observaciones" = b."observaciones",
  "fechaVencimiento" = b."fechaVencimiento"
FROM "__BACKUP_TABLE__" AS b
WHERE t."id" = b."id";

