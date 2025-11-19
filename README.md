# 🏢 Sistema de Infraestructura - Caja de Abogados

Sistema full-stack para la gestión de infraestructura, empleados, stock y tareas de la Caja de Abogados.

## 🚀 Inicio Rápido

### Prerrequisitos
- Node.js >= 18.0.0
- npm >= 8.0.0
- PostgreSQL (para base de datos)

### Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd Infra_Caja
   ```

2. **Instalar dependencias**
   ```bash
   # Backend
   cd backend
   npm install
   
   # Frontend
   cd ../frontend
   npm install
   ```

3. **Configurar variables de entorno**
   ```bash
   # Backend
   cp backend/env.example backend/.env
   
   # Frontend
   cp frontend/env.example frontend/.env
   ```

4. **Configurar base de datos**
   ```bash
   cd backend
   npx prisma generate
   npx prisma db push
   npx prisma db seed
   ```

5. **Iniciar servicios**
   ```bash
   # Opción 1: Script automático (recomendado)
   start-dev.bat
   
   # Opción 2: Manual
   # Terminal 1 - Backend
   cd backend && npm run dev
   
   # Terminal 2 - Frontend
   cd frontend && npm run dev
   ```

## 📁 Estructura del Proyecto

```
Infra_Caja/
├── backend/                 # Backend Node.js + TypeScript
│   ├── src/
│   │   ├── controllers/    # Controladores de rutas
│   │   ├── routes/         # Definición de rutas
│   │   ├── middlewares/    # Middlewares de autenticación
│   │   ├── services/       # Lógica de negocio
│   │   ├── utils/          # Utilidades
│   │   └── index.ts        # Punto de entrada
│   ├── prisma/             # Schema y migraciones
│   └── package.json
├── frontend/               # Frontend React + Vite
│   ├── src/
│   │   ├── components/     # Componentes reutilizables
│   │   ├── pages/          # Páginas de la aplicación
│   │   ├── services/       # Servicios API
│   │   ├── hooks/          # Custom hooks
│   │   ├── utils/          # Utilidades
│   │   └── main.tsx        # Punto de entrada
│   └── package.json
├── start-dev.bat          # Script para iniciar ambos servicios
├── start-backend.bat      # Script para iniciar solo backend
├── start-frontend.bat     # Script para iniciar solo frontend
└── README.md
```

## 🔧 Configuración

### Backend (Puerto 4001)
- **URL**: http://localhost:4001
- **API**: http://localhost:4001/api
- **Variables de entorno**: `backend/.env`

### Frontend (Puerto 5174)
- **URL**: http://localhost:5174
- **Variables de entorno**: `frontend/.env`

## 📊 Módulos Disponibles

### 🔐 Autenticación
- Login/Logout
- Gestión de usuarios
- Roles y permisos

### 👥 Recursos Humanos (RRHH)
- Gestión de empleados
- Departamentos
- Vacaciones y licencias
- Documentos
- Estadísticas

### 📦 Stock
- Gestión de inventario
- Movimientos de stock
- Categorías y productos
- Reportes

### 📋 Tareas
- Gestión de tareas
- Categorías
- Procedimientos
- Relevamientos

### 🔗 Enlaces y KB
- Base de conocimientos
- Enlaces útiles
- Documentación

## 🛠️ Scripts Disponibles

### Backend
```bash
npm run dev          # Desarrollo
npm run build        # Construcción
npm run start        # Producción
npm run prisma:generate  # Generar cliente Prisma
npm run prisma:push      # Sincronizar schema
npm run prisma:migrate   # Ejecutar migraciones
npm run prisma:studio    # Abrir Prisma Studio
npm run lint          # Linter
npm run format        # Formatear código
```

### Frontend
```bash
npm run dev          # Desarrollo
npm run build        # Construcción
npm run preview      # Vista previa
npm run lint         # Linter
npm run format       # Formatear código
```

## 🚀 Despliegue

### Desarrollo
```bash
start-dev.bat
```

### Producción
```bash
# Backend
cd backend
npm run build
npm run start

# Frontend
cd frontend
npm run build
# Servir archivos estáticos
```

## 📝 Notas de Desarrollo

- **Backend**: Node.js + Express + TypeScript + Prisma + PostgreSQL
- **Frontend**: React + Vite + TypeScript + Tailwind CSS
- **Autenticación**: JWT
- **Base de datos**: PostgreSQL con Prisma ORM
- **Formateo**: Prettier + ESLint

## 🐛 Solución de Problemas

### Puerto en uso
```bash
# Encontrar proceso usando puerto 4001
netstat -ano | findstr :4001

# Encontrar proceso usando puerto 5174
netstat -ano | findstr :5174

# Terminar proceso
taskkill /PID <PID> /F
```

### Dependencias
```bash
# Limpiar cache
npm cache clean --force

# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
```

## 📞 Soporte

Para soporte técnico, contactar al equipo de desarrollo.


