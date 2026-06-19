# Migración a multi-cliente — pasos para producción

Este cambio agrega la tabla `Empresa` y vuelve obligatorio el campo `empresaId`
en los modelos de CMDB, Stock, Tareas, Relevamientos, Procedimientos y KB. De
paso, suma las tablas del módulo de Credenciales (`Credencial`,
`CredencialAcceso`).

Producción todavía no tiene ninguna de estas tablas/columnas, así que **no
alcanza con el deploy normal** (`deploy-produccion.ps1`). Hay que migrar la
base de datos primero, en 3 pasos, en este orden exacto. Cada paso fue
probado contra una base descartable con datos simulados (un servidor, un
producto de stock, una tarea, un equipo de red) antes de entregarte esto:
los 3 pasos corrieron sin errores y los datos viejos terminaron con el
`empresaId` de "Caja de Abogados" asignado correctamente. También probé que
si te saltás el paso 2 (backfill), el paso 3 **falla solo y no rompe nada**
(la transacción se revierte entera) — es la red de seguridad.

## 0. Backup (no te lo saltees)

En el servidor, con el `DATABASE_URL` real cargado:

```bash
cd /opt/infra-caja/backend
pg_dump "$DATABASE_URL" > ~/backup_pre_multicliente_$(date +%Y%m%d_%H%M%S).sql
```

(Esto es lo mismo que hace `backend/scripts/backup-antes-deploy.ts`, por si
preferís correr ese script en su lugar.)

## 1. Copiar estos 3 archivos al servidor

Desde tu máquina, en la raíz del repo:

```powershell
scp -P 22 backend/prisma/manual-migrations/2026-06-18-multicliente/*.sql intranet@192.168.123.147:/tmp/
```

(O hacé `git pull` en el servidor si el deploy de código ya va a incluir
este commit — los archivos van a estar en
`backend/prisma/manual-migrations/2026-06-18-multicliente/` de todas formas.)

## 2. Correr los 3 pasos EN ORDEN, por SSH

Conectate al servidor (`ssh -p 22 intranet@192.168.123.147`) y corré, con el
`DATABASE_URL` real de producción:

```bash
psql "$DATABASE_URL" -f /tmp/01-additivo.sql
```

Esto es 100% aditivo (tablas y columnas nuevas, todas nullable). **Se puede
correr con la app vieja todavía corriendo** — el código viejo no sabe que
existen estas columnas nuevas y las ignora.

```bash
psql "$DATABASE_URL" -f /tmp/02-backfill.sql
```

Crea la empresa "Caja de Abogados" y le asigna todas las filas existentes
que tengan `empresaId` nulo. Es SQL puro, no depende del código nuevo. Es
seguro volver a correrlo si hace falta (es idempotente).

Verificá que no quedó ninguna fila sin asignar antes de seguir: abrí
`02-backfill.sql`, copiá el bloque `SELECT ... UNION ALL ...` comentado al
final (sacándole los `--`) y pegalo en `psql "$DATABASE_URL"` interactivo.
Todas las filas deberían devolver `count = 0`.

```bash
psql "$DATABASE_URL" -f /tmp/03-restrictivo.sql
```

Vuelve `empresaId` obligatorio y agrega los `@@unique([empresaId, campo])`
(por ejemplo, ahora dos clientes distintos pueden tener una categoría de
stock con el mismo nombre, pero no el mismo cliente dos veces). **Si algo
quedó sin asignar en el paso 2, este paso va a fallar solo** (ya lo probé) —
no corrompe nada, simplemente no aplica. En ese caso, revisá qué tabla
quedó con `empresaId` nulo y corré el paso 2 de nuevo.

## 3. Deploy del código nuevo

Recién ahora, con el schema ya migrado, hacé el deploy normal:

```powershell
.\deploy-produccion.ps1
```

Esto copia el código, corre `prisma generate` (ya va a coincidir con el
schema migrado) y reinicia `pm2`.

## 4. Verificación

- Login y `GET /api/auth/me`.
- Entrar a CMDB/Stock/Tareas y confirmar que los datos de Caja de Abogados
  siguen ahí (con el cliente "Caja de Abogados" seleccionado en el switcher
  del topbar).
- Si sos admin, ir a "Clientes" (`/dashboard/empresas`) y confirmar que
  aparece "Caja de Abogados" como único cliente activo.
- RRHH y Usuarios no deberían haber cambiado en nada (quedaron globales, no
  multi-cliente).

## Nota sobre el historial de migraciones de Prisma

Esto se aplica como SQL directo, no como una migración de Prisma versionada
(`prisma/migrations/`). Es intencional: el historial de migraciones de este
repo ya estaba desincronizado de la base real antes de este cambio (lo
mismo que ya documenta `deploy-produccion.ps1`: "cambios de modelo en DB no
se ejecutan acá, hacerlo manualmente"). Si en algún momento alguien quiere
prolijizar eso, es un trabajo aparte.
