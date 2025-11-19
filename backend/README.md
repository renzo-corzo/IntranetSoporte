# Backend - Infraestructura Caja de Abogados

## Requisitos
- Node.js >= 18
- PostgreSQL

## Instalación
```
npm install
```

## Variables de entorno
Ver `.env.example` y crear tu propio `.env`.

## Migraciones Prisma
```
npx prisma migrate dev
```

## Ejecutar en desarrollo
```
npm run dev
```

## Autenticación JWT
- Registro: `POST /api/auth/register`
- Login: `POST /api/auth/login`

El login devuelve un token JWT que debe enviarse en el header `Authorization: Bearer <token>` para acceder a rutas protegidas. 