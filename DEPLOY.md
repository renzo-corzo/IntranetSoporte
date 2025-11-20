# 🚀 Guía de Deploy - Flujo Híbrido

## 📋 Procedimiento de Deploy

Este proyecto utiliza un **flujo híbrido** que combina:
- ✅ **Git** para historial y backup
- ✅ **Deploy directo** para velocidad

## 🔄 Flujo de Trabajo

### 1. Desarrollo Local
- Realiza los cambios en tu máquina local
- Prueba los cambios localmente si es posible

### 2. Commit y Push (Opcional pero Recomendado)
```bash
# Agregar cambios
git add .

# Commit con mensaje descriptivo
git commit -m "feat: agregar funcionalidad X"

# Push a GitHub
git push origin main
```

### 3. Deploy a Producción

#### Opción A: Script Automatizado (Recomendado)

**Windows (PowerShell):**
```powershell
.\deploy-produccion.ps1
```

**Windows (CMD):**
```cmd
deploy-produccion.bat
```

#### Opción B: Manual

```bash
# 1. Copiar archivos modificados
scp -P 22 backend/src/index.ts intranet@192.168.123.147:/opt/infra-caja/backend/src/
scp -P 22 frontend/src/pages/Stock.tsx intranet@192.168.123.147:/opt/infra-caja/frontend/src/pages/

# 2. Compilar y reiniciar
ssh -p 22 intranet@192.168.123.147 "cd /opt/infra-caja/backend && npm run build && pm2 restart infra-backend-prod && cd /opt/infra-caja/frontend && npm run build"
```

## 📝 Convenciones de Commits

Usa mensajes descriptivos siguiendo el formato:

- `feat:` Nueva funcionalidad
- `fix:` Corrección de bug
- `refactor:` Refactorización de código
- `docs:` Cambios en documentación
- `style:` Cambios de formato (sin afectar lógica)
- `perf:` Mejoras de rendimiento
- `test:` Agregar o modificar tests

**Ejemplos:**
```
feat: agregar modal para crear ubicaciones
fix: corregir URLs de imágenes en producción
refactor: mejorar cálculo de días de vacaciones
```

## ⚠️ Notas Importantes

1. **Siempre haz commit antes de deploy**: Esto te permite hacer rollback si algo sale mal
2. **Verifica los cambios**: Revisa `git status` antes de hacer commit
3. **Mensajes descriptivos**: Facilita el seguimiento de cambios
4. **Backup automático**: GitHub actúa como backup de tu código

## 🔧 Configuración del Script

Los scripts `deploy-produccion.bat` y `deploy-produccion.ps1` están configurados para:
- Servidor: `192.168.123.147`
- Usuario: `intranet`
- Puerto SSH: `22`
- Ruta Backend: `/opt/infra-caja/backend`
- Ruta Frontend: `/opt/infra-caja/frontend`

Si necesitas cambiar estas configuraciones, edita los scripts.

## 🆘 Troubleshooting

### Error: "No se pudo hacer push a GitHub"
- Verifica tu conexión a internet
- Verifica tus credenciales de Git
- Asegúrate de tener permisos en el repositorio

### Error: "No se pudo copiar archivo"
- Verifica la conexión SSH al servidor
- Verifica que el archivo existe localmente
- Verifica permisos en el servidor

### Error: "No se pudo compilar"
- Revisa los logs en el servidor: `ssh intranet@192.168.123.147 "pm2 logs infra-backend-prod"`
- Verifica que las dependencias estén instaladas: `npm install`

