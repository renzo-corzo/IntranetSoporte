# Reconciliar Credencial con producción real

Cuando se preparó el deploy de multicliente (2026-06-24) se descubrió que
producción **nunca llegó a tener ninguna tabla de multicliente**, pero sí
tiene, de un intento/código anterior (aparentemente del otro repo
`Infra_Caja`), una tabla `Credencial` **real, con 6 filas de contraseñas
cifradas en uso**, con una forma distinta a la que asumía
`2026-06-18-multicliente/01-additivo.sql`:

- Columna `categoria` (enum `TipoCredencial`, con valores `EMAIL`,
  `ACCESO_REMOTO`, `SERVIDOR_FISICO`, `MAQUINA_VIRTUAL`, `EQUIPO_RED`,
  `EQUIPO_USUARIO`, `SERVICIO`, `OTRO`, `VPN`) en vez de `tipoEquipo`
  (enum `TipoEquipoCredencial`).
- Sin columna `empresaId`.
- Ya tenía columna `url` (que en este repo se agrega recién en
  `2026-06-23-accesos-standalone`).

Por eso `2026-06-18-multicliente/01-additivo.sql` ya NO crea las tablas
`Credencial`/`CredencialAcceso` (se removió ese `CREATE TABLE`): esas tablas
ya existen y esta migración las ajusta en su lugar, preservando las 6 filas
reales.

Mapeo de `categoria` → `tipoEquipo` (1 a 1 salvo un caso):

| categoria (viejo) | tipoEquipo (nuevo) |
|---|---|
| SERVIDOR_FISICO, MAQUINA_VIRTUAL, EQUIPO_RED, EQUIPO_USUARIO, SERVICIO, EMAIL, OTRO | igual |
| **VPN** | **ACCESO_REMOTO** (el form de Accesos ya rotula esa categoría "Acceso remoto (RDP/VPN/SSH)") |

## Orden de ejecución (intercalado con multicliente)

1. `2026-06-18-multicliente/01-additivo.sql`
2. **`01-enum-y-empresaid.sql`** (este folder)
3. **`02-migrar-tipoequipo.sql`** (este folder) — en transacción separada del
   paso 2 porque Postgres no permite usar un valor de enum nuevo
   (`ALTER TYPE ... ADD VALUE`) en la misma transacción en que se agregó.
4. `2026-06-18-multicliente/02-backfill.sql` (ya completa
   `Credencial.empresaId`, no hace falta tocar ese archivo)
5. `2026-06-18-multicliente/03-restrictivo.sql`
6. **`03-restrictivo-empresaid.sql`** (este folder) — recién acá se exige
   `empresaId NOT NULL` en Credencial, una vez que el backfill ya lo completó.
7. `2026-06-23-accesos-standalone/01-additivo.sql` (con los `IF NOT EXISTS`
   agregados, porque para entonces `EMAIL`/`ACCESO_REMOTO`/`OTRO` y la
   columna `url` ya existen)
8. resto de migraciones posteriores
