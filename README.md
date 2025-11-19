# Sistema de Gestión - Infra Caja

Sistema integral de gestión para la Caja de Abogados, incluyendo módulos de RRHH, Stock, Relevamientos, Tareas, y más.

## 📋 Características Principales

### Módulo RRHH (Recursos Humanos)
- **Gestión de Empleados**: CRUD completo con cálculo automático de días de vacaciones
- **Vacaciones**: Sistema de solicitudes, aprobación y calendario visual
- **Licencias**: Gestión de licencias médicas y especiales
- **Documentos**: Almacenamiento y gestión de documentos de empleados
- **Estadísticas**: Dashboard con métricas y reportes por año

### Módulo Stock
- Gestión de productos y categorías
- Control de inventario con alertas de stock mínimo
- Movimientos de entrada y salida
- Reportes y estadísticas

### Módulo Relevamientos
- Gestión de equipos y su estado
- Integración con Zabbix para monitoreo
- Visualización de uptime y grupos
- Filtros y ordenamiento avanzado

### Otros Módulos
- **Tareas**: Gestión de tareas y categorías
- **Procedimientos**: Base de conocimiento
- **Tráfico**: Monitoreo de red con ntopng
- **Usuarios y Roles**: Sistema de permisos granular

## 🚀 Tecnologías

### Backend
- **Node.js** con **Express**
- **TypeScript**
- **Prisma ORM** con PostgreSQL
- **JWT** para autenticación
- **PM2** para gestión de procesos

### Frontend
- **React** con **TypeScript**
- **Vite** como build tool
- **Tailwind CSS** para estilos
- **React Router** para navegación
- **Axios** para peticiones HTTP

## 📦 Instalación

### Requisitos Previos
- Node.js 18+ 
- PostgreSQL 14+
- npm o yarn

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Configurar variables de entorno en .env
npx prisma generate
npx prisma migrate deploy
npm run build
npm start
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
# Configurar variables de entorno en .env
npm run build
npm start
```

## 🔧 Configuración

### Variables de Entorno Backend

```env
DATABASE_URL="postgresql://usuario:password@localhost:5432/infra_caja"
JWT_SECRET="tu_secreto_jwt"
PORT=4000
NODE_ENV=production
```

### Variables de Entorno Frontend

```env
VITE_API_URL=http://localhost:4000/api
```

## 📊 Base de Datos

El esquema de la base de datos está definido en `backend/prisma/schema.prisma`.

Para aplicar migraciones:
```bash
cd backend
npx prisma migrate deploy
```

Para generar el cliente Prisma:
```bash
npx prisma generate
```

## 🔐 Autenticación y Permisos

El sistema utiliza JWT para autenticación y un sistema de roles y permisos granular.

### Roles Principales
- `admin`: Acceso completo
- `admin_sistemas`: Administración de sistemas
- `rrhh`: Gestión de RRHH
- `stock`: Gestión de stock (solo lectura o edición según permisos)

## 📝 Scripts Útiles

### Backup
```bash
# Backup completo (servidor)
bash scripts/backup-completo.sh

# Backup local (Windows)
powershell -ExecutionPolicy Bypass -File scripts/backup-completo-local.ps1
```

### Desarrollo
```bash
# Iniciar backend
cd backend && npm run dev

# Iniciar frontend
cd frontend && npm run dev
```

## 🗂️ Estructura del Proyecto

```
Infra_Caja/
├── backend/              # API Backend
│   ├── src/
│   │   ├── controllers/  # Controladores
│   │   ├── routes/       # Rutas
│   │   ├── middlewares/  # Middlewares
│   │   └── services/     # Servicios
│   ├── prisma/           # Esquema y migraciones
│   └── scripts/          # Scripts de utilidad
├── frontend/             # Aplicación React
│   ├── src/
│   │   ├── components/   # Componentes React
│   │   ├── pages/        # Páginas
│   │   ├── services/     # Servicios API
│   │   └── context/      # Contextos React
│   └── public/           # Archivos estáticos
└── scripts/              # Scripts de deployment y utilidades
```

## 🔄 Deployment

El sistema está configurado para producción con:
- **PM2** para gestión de procesos
- **Nginx** como reverse proxy
- **PostgreSQL** como base de datos

Ver `scripts/` para scripts de deployment.

## 📄 Licencia

Propietario - Caja de Abogados

## 👥 Contribuidores

Sistema desarrollado para la Caja de Abogados.

## 📞 Soporte

Para soporte técnico, contactar al equipo de desarrollo.
