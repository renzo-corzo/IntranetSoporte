# Restauración del Backup (Desarrollo)

Contenido del backup:
- backend/, frontend/, prisma/ (si existe), scripts y archivos raíz relevantes
- .backup_artifacts/db_dump.sql: volcado de la base de datos

## Requisitos
- Node.js 18+
- PostgreSQL (cliente y servidor). Asegúrate de tener `psql` disponible

## Pasos
1) Descomprimir el archivo en la carpeta de destino
   - Linux/macOS: `tar -xzf backup_YYYYMMDD_HHMMSS.tar.gz`
   - Windows (WSL recomendado): `wsl tar -xzf backup_YYYYMMDD_HHMMSS.tar.gz`

2) Variables de entorno
   - Copia/ajusta `.env` en `backend/.env` con tu `DATABASE_URL`

3) Restaurar base de datos (opcional)
   - Crea la base de datos destino si no existe: `createdb <mi_db>`
   - Importa: `psql "$DATABASE_URL" -f .backup_artifacts/db_dump.sql`

4) Instalar dependencias e iniciar
   - Backend: `cd backend && npm ci && npm run dev`
   - Frontend: `cd frontend && npm ci && npm run dev`

