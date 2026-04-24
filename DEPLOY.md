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

## 🔌 Conectar por PuTTY (SSH)

Datos de conexión al servidor de producción:

| Campo   | Valor            |
|---------|------------------|
| Host    | `192.168.123.147` |
| Puerto  | `22`             |
| Usuario | `intranet`       |

**En PuTTY:**
1. Session → Host Name: `192.168.123.147`
2. Session → Port: `22`
3. Connection type: SSH
4. Open → cuando pida login, usuario: `intranet` y luego la contraseña.

Si usas **clave SSH** en lugar de contraseña: Connection → SSH → Auth → Private key file for authentication: selecciona tu `.ppk` (clave convertida con PuTTYgen si la tienes en formato OpenSSH).

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

### Error: 404 NOT FOUND al abrir `/dashboard/relevamientos` (o "Check flash:/http.zip")

Puede deberse a dos cosas:

1. **La URL no llega al servidor correcto**  
   El mensaje "Check flash:/http.zip" suele aparecer en **routers o dispositivos embebidos**, no en el servidor de la app. Si el nombre `intranet.caja-abogados.org.ar` apunta a otro equipo (ej. el router), verás ese 404.
   - **Qué hacer:** Probar entrando por IP: `http://192.168.123.147/` (y luego `http://192.168.123.147/dashboard/relevamientos`). Si así funciona, hay que corregir DNS o el equipo al que apunta el nombre para que sea `192.168.123.147`.

2. **Nginx sin fallback para la SPA**  
   La app es una SPA: rutas como `/dashboard/relevamientos` no son archivos en disco; el servidor debe devolver siempre `index.html` para que React Router funcione.
   - **Qué hacer:** En el servidor, revisar que Nginx tenga algo como:
     ```nginx
     location / {
         try_files $uri $uri/ /index.html;
     }
     ```
   - Ejemplo completo: ver `docs/nginx-infra-caja.conf.example`. Después: `sudo nginx -t` y `sudo systemctl reload nginx`.

### No puedo conectarme por PuTTY al servidor

Comprueba en este orden:

1. **Red**  
   El servidor `192.168.123.147` está en una red interna. Tu PC debe estar en la **misma red** (oficina, misma VLAN) o tener **VPN** que te dé acceso a esa red. Si trabajas desde casa sin VPN, es normal que no conecte.

2. **Ping**  
   En CMD o PowerShell: `ping 192.168.123.147`  
   - Si no hay respuesta: problema de red (firewall, VPN, o no estás en la red correcta).  
   - Si responde: la red llega; el fallo puede ser el puerto 22 o SSH.

3. **Puerto 22 abierto**  
   En PowerShell: `Test-NetConnection -ComputerName 192.168.123.147 -Port 22`  
   - Si `TcpTestSucceeded : False`: un firewall (tu PC, la red o el servidor) está bloqueando SSH. Que alguien con acceso al servidor o a la red revise reglas de firewall y que el servicio `sshd` esté activo.  
   - Si `TcpTestSucceeded : True`: el puerto está abierto; el problema suele ser usuario/contraseña o clave SSH.

4. **Usuario y contraseña**  
   Usuario correcto: `intranet`. Si usas clave SSH, en PuTTY configura la clave en Connection → SSH → Auth (y que en el servidor esté tu clave pública en `~/.ssh/authorized_keys` del usuario `intranet`).

5. **Mensaje concreto de PuTTY**  
   - "Connection timed out" → red o firewall (pasos 1–3).  
   - "Connection refused" → en el servidor no hay nada escuchando en el 22 (SSH apagado o otro puerto).  
   - "Access denied" o "Authentication failed" → usuario, contraseña o clave incorrectos (paso 4).

