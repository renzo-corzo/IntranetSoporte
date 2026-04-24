# Solucionar 404 "Check flash:/http.zip" en intranet.caja-abogados.org.ar

Cuando al abrir **intranet.caja-abogados.org.ar** o **intranet.caja-abogados.org.ar/login** aparece:

- **HTTP/1.1 404 NOT FOUND!**
- **Check flash:/http.zip, please.**

suele deberse a una de estas dos cosas.

---

## 1. El nombre no apunta al servidor correcto (muy frecuente)

Ese mensaje "Check flash:/http.zip" es típico de **routers o firewalls**, no del servidor donde está la aplicación. Si el nombre **intranet.caja-abogados.org.ar** está apuntando a otro equipo (por ejemplo el router o el firewall), ese equipo responde con su 404.

### Qué hacer

- **Probar por IP:** Abrir en el navegador:
  - `http://192.168.123.147/`
  - `http://192.168.123.147/login`
  - Si **con la IP sí carga** la aplicación → el problema es DNS o el equipo al que apunta el nombre. Hay que configurar **DNS** (o el registro que use la red) para que **intranet.caja-abogados.org.ar** resuelva a **192.168.123.147**, o cambiar la configuración del equipo (router/firewall) para que ese nombre apunte al servidor correcto.

- Quien tenga acceso a la red/DNS debe:
  - Asegurarse de que el registro de **intranet.caja-abogados.org.ar** apunte a **192.168.123.147**.
  - O revisar si hay un proxy/redirección que envíe ese tráfico al servidor 192.168.123.147 en lugar de al router/firewall.

---

## 2. Nginx en el servidor sin fallback para la SPA

Si **con la IP** (`http://192.168.123.147/login`) **también** sale 404, entonces el tráfico sí llega al servidor pero Nginx no está devolviendo `index.html` para rutas como `/login` o `/dashboard/...`.

### Qué hacer (en el servidor, por SSH)

1. Conectar por SSH al servidor (usuario `intranet`, host `192.168.123.147`, puerto 22).

2. Revisar la configuración de Nginx para esta aplicación, por ejemplo:
   ```bash
   sudo cat /etc/nginx/sites-available/infra-caja
   ```
   (o el archivo que use vuestro sitio para intranet.)

3. Dentro del `server` que sirve la aplicación, debe existir algo así para la ruta `/`:
   ```nginx
   root /opt/infra-caja/frontend/dist;
   index index.html;

   location / {
       try_files $uri $uri/ /index.html;
   }
   ```
   Si falta `try_files $uri $uri/ /index.html;`, hay que añadirlo (o reemplazar la configuración por la del ejemplo del proyecto).

4. Ejemplo completo de configuración está en el repositorio en:
   - **docs/nginx-infra-caja.conf.example**

5. Después de editar:
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

---

## Resumen

| Si al probar… | Conclusión | Acción |
|---------------|------------|--------|
| `http://192.168.123.147/login` **sí carga** | El problema es el nombre de dominio / redirección | Corregir DNS o redirección para que **intranet.caja-abogados.org.ar** apunte a **192.168.123.147** |
| `http://192.168.123.147/login` **también da 404** | El problema es Nginx en el servidor | Añadir/ajustar `try_files $uri $uri/ /index.html;` en Nginx y recargar (ver arriba) |

Mientras se corrige, se puede usar directamente: **http://192.168.123.147/** para acceder a la intranet.
