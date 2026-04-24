# Plan seguro - migracion Tareas Fase 2

## 1) Cambios de schema (Prisma)

En `Tarea`:

- Nuevos campos:
  - `categoria String @default("infraestructura")`
  - `origen String @default("interno")`
  - `impacto String @default("individual")`
  - `fechaCierre DateTime?`
  - `observaciones String?`
  - `solicitante String?`
  - `activoRelacionado String?`
  - `actualizadaEn DateTime @updatedAt`
- Ajustes:
  - `estado` pasa a `@default("pendiente")`
  - `prioridad` pasa a `@default("media")`
- Relacion:
  - renombre de relacion Prisma `categoria` -> `categoriaRef` para evitar conflicto con campo string `categoria`
- Indices:
  - `@@index([estado])`
  - `@@index([prioridad])`
  - `@@index([categoria])`
  - `@@index([responsableId])`
  - `@@index([fechaVencimiento])`
  - `@@index([fechaCierre])`

## 2) Recomendacion schema: migracion formal

Usar migracion formal para entornos compartidos:

```bash
cd backend
npx prisma migrate dev --name tareas_fase2_mvp
npx prisma generate
```

Para aplicar en servidores luego:

```bash
cd backend
npx prisma migrate deploy
npx prisma generate
```

`prisma db push` solo recomendado para desarrollo local rapido.

## 3) Migracion de datos legacy (sin deploy)

### Dry run (solo diagnostico)

```bash
cd backend
npx tsx scripts/migrate-tareas-fase2.ts
```

### Aplicar migracion de datos

```bash
cd backend
npx tsx scripts/migrate-tareas-fase2.ts --apply
```

Este script:

1. Genera backup completo de tabla `Tarea` en una tabla `Tarea_backup_fase2_<timestamp>`.
2. Migra estados:
   - `en_progreso` -> `en_curso`
   - `hecha` -> `resuelta`
3. Completa `fechaCierre` para cerradas historicas.
4. Mantiene `finalizadaEn` para compatibilidad.

## 4) Validaciones pre/post

### Pre

```sql
SELECT "estado", COUNT(*) FROM "Tarea" GROUP BY "estado" ORDER BY "estado";
SELECT COUNT(*) FROM "Tarea" WHERE "estado" IN ('resuelta','cancelada','hecha') AND "fechaCierre" IS NULL;
```

### Post esperado

- Sin `hecha`
- Sin `en_progreso`
- Cerradas (`resuelta`/`cancelada`) con `fechaCierre` completa

```sql
SELECT "estado", COUNT(*) FROM "Tarea" GROUP BY "estado" ORDER BY "estado";
SELECT COUNT(*) FROM "Tarea" WHERE "estado" IN ('hecha','en_progreso');
SELECT COUNT(*) FROM "Tarea" WHERE "estado" IN ('resuelta','cancelada') AND "fechaCierre" IS NULL;
```

## 5) Rollback basico

1. Tomar nombre de backup reportado por script (`Tarea_backup_fase2_...`).
2. Usar template SQL en `scripts/tareas-fase2-rollback-template.sql`.
3. Reemplazar `__BACKUP_TABLE__`.
4. Ejecutar rollback.

## 6) Criterio de listo para deploy

- `prisma migrate dev` (local/staging) exitoso.
- script de datos `--apply` exitoso sin errores.
- queries post-migracion en cero para legacy (`hecha`, `en_progreso`).
- backend build ok.
- frontend build ok.
- smoke test Tareas: listar, filtros, tablero, agenda, KPI, cierre/reapertura, comentario.

