# Configuración de Git y Subida a Repositorio Remoto

## ✅ Estado Actual

- ✅ Repositorio Git inicializado
- ✅ `.gitignore` configurado
- ✅ Backup completo creado: `backup_sistema_20251119_110140.zip` (329.81 MB)
- ✅ Commit inicial realizado

## 📤 Subir a un Repositorio Remoto

### Opción 1: GitHub

1. **Crear un repositorio en GitHub:**
   - Ve a https://github.com/new
   - Crea un repositorio privado (recomendado) o público
   - **NO** inicialices con README, .gitignore o licencia (ya los tenemos)

2. **Conectar y subir:**
   ```bash
   git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git
   git branch -M main
   git push -u origin main
   ```

### Opción 2: GitLab

1. **Crear un repositorio en GitLab:**
   - Ve a tu instancia de GitLab
   - Crea un nuevo proyecto
   - **NO** inicialices con README

2. **Conectar y subir:**
   ```bash
   git remote add origin https://gitlab.com/TU_USUARIO/TU_REPOSITORIO.git
   git branch -M main
   git push -u origin main
   ```

### Opción 3: Bitbucket

1. **Crear un repositorio en Bitbucket:**
   - Ve a tu cuenta de Bitbucket
   - Crea un nuevo repositorio
   - **NO** inicialices con README

2. **Conectar y subir:**
   ```bash
   git remote add origin https://bitbucket.org/TU_USUARIO/TU_REPOSITORIO.git
   git branch -M main
   git push -u origin main
   ```

## 🔐 Autenticación

Si usas HTTPS, Git te pedirá credenciales. Para evitar esto:

### Usar SSH (Recomendado)

1. **Generar clave SSH (si no tienes):**
   ```bash
   ssh-keygen -t ed25519 -C "infra@cajaabogados.org.ar"
   ```

2. **Agregar clave al agente SSH:**
   ```bash
   eval "$(ssh-agent -s)"
   ssh-add ~/.ssh/id_ed25519
   ```

3. **Agregar clave pública a GitHub/GitLab:**
   - Copia el contenido de `~/.ssh/id_ed25519.pub`
   - Agrega la clave en la configuración de tu cuenta

4. **Usar URL SSH:**
   ```bash
   git remote set-url origin git@github.com:TU_USUARIO/TU_REPOSITORIO.git
   ```

### Usar Personal Access Token (HTTPS)

1. **Crear token en GitHub/GitLab:**
   - GitHub: Settings > Developer settings > Personal access tokens
   - GitLab: Preferences > Access Tokens

2. **Usar token como contraseña:**
   - Usuario: tu usuario
   - Contraseña: el token generado

## 📝 Comandos Útiles

### Ver estado
```bash
git status
```

### Ver commits
```bash
git log --oneline
```

### Agregar cambios
```bash
git add .
git commit -m "Descripción de los cambios"
git push
```

### Ver remotos configurados
```bash
git remote -v
```

### Cambiar URL del remoto
```bash
git remote set-url origin NUEVA_URL
```

## ⚠️ Notas Importantes

1. **Archivos sensibles**: Los archivos `.env` están en `.gitignore` y NO se subirán
2. **Backups**: Los backups están excluidos del repositorio
3. **node_modules**: No se suben (instalar con `npm install` después de clonar)
4. **Base de datos**: El esquema está en `backend/prisma/schema.prisma`, pero los datos NO

## 🔄 Workflow Recomendado

1. **Hacer cambios localmente**
2. **Revisar cambios:**
   ```bash
   git status
   git diff
   ```
3. **Agregar y commitear:**
   ```bash
   git add .
   git commit -m "Descripción clara de los cambios"
   ```
4. **Subir cambios:**
   ```bash
   git push
   ```

## 📦 Backup Completo

El backup completo está en: `backup_sistema_20251119_110140.zip`

Este backup incluye:
- Código fuente completo
- Configuraciones (sin datos sensibles)
- Scripts de utilidad

**IMPORTANTE**: Guarda este backup en un lugar seguro además del repositorio Git.

