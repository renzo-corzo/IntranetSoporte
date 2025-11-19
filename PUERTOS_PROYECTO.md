# 🚀 Puertos Fijos - Infraestructura Caja de Abogados

## 📋 Configuración de Puertos

Este proyecto utiliza puertos específicos para evitar conflictos con otros proyectos:

### 🔧 Backend
- **Puerto:** `4001`
- **URL:** `http://localhost:4001`
- **API:** `http://localhost:4001/api`
- **Configuración:** `backend/src/server.ts` y `backend/.env`

### 🌐 Frontend
- **Puerto:** `5174`
- **URL:** `http://localhost:5174`
- **Configuración:** `frontend/vite.config.ts`

## 🚨 Importante

- **NO usar puerto 4000** - Reservado para otros proyectos
- **NO usar puerto 3000** - Reservado para otros proyectos
- **NO usar puerto 5173** - Reservado para otros proyectos

## 🛠️ Inicio Rápido

```bash
# Opción 1: Script automático
powershell -ExecutionPolicy Bypass -File .\start-services.ps1

# Opción 2: Manual
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## 📊 Verificación

```bash
# Verificar puertos en uso
netstat -ano | findstr ":4001\|:5174"

# Probar endpoints
curl http://localhost:4001/api
curl http://localhost:5174
```

## 🔄 Cambio de Puertos

Si necesitas cambiar los puertos:

1. **Backend:** Modificar `backend/src/server.ts` línea 6
2. **Frontend:** Modificar `frontend/vite.config.ts` línea 9
3. **Script:** Modificar `start-services.ps1` líneas 39-40





