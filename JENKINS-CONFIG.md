# ⚙️ Configuración Jenkins para Miniatura

## 🔧 Configurar en Jenkins:

### 1. **Editar el Jenkinsfile:**
```groovy
VPS_HOST = 'tu-ip-vps-contabo'     // Ejemplo: '123.45.67.89' 
VPS_USER = 'root'                   // Usuario SSH (normalmente root)
SSH_CREDENTIALS = 'contabo-ssh'     // ID que le darás a las credenciales
```

### 2. **Configurar Credenciales SSH en Jenkins:**

1. **Dashboard → Manage Jenkins → Credentials**
2. **Global → Add Credentials**
3. **Kind**: SSH Username with private key
4. **ID**: `contabo-ssh` (mismo que pusiste en Jenkinsfile)
5. **Username**: `root`
6. **Private Key**: Pegar tu SSH private key

### 3. **Variables de Entorno del Job:**

En tu job de Jenkins → **Configure → Build Environment → Environment variables**:
```
MOODLE_BASE_URL=https://moodle.unicauca.edu.co
MOODLE_WS_TOKEN=tu_token_moodle
MOODLE_SEARCH_TOKEN=tu_token_busqueda  
MOODLE_GRID_TOKEN=tu_token_grid
```

### 4. **Preparar el VPS (Una sola vez):**

SSH a tu VPS y ejecutar:
```bash
# Instalar dependencias del sistema para Canvas
sudo apt-get update
sudo apt-get install -y build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev

# Crear directorio del proyecto
mkdir -p /www/wwwroot/unicauca/miniatura

# Instalar PM2 globalmente
npm install -g pm2

# Configurar firewall para puerto 3001 si es necesario
sudo ufw allow 3001
```

## 🔑 **Puntos Importantes:**

- El **VPS_HOST** es la IP o dominio de tu servidor Contabo
- Las **SSH Credentials** deben tener acceso al VPS
- El directorio `/www/wwwroot/unicauca/miniatura` se creará automáticamente
- Después del primer deploy, configurar `.env.production` en el servidor

## 🚀 **Flujo de Deploy:**

1. Push código → GitHub
2. Jenkins detecta cambio
3. Build automático  
4. Deploy al VPS via SSH
5. Reinicio automático con PM2

## ❗ **Si hay problemas:**

- ✅ Verificar SSH credentials en Jenkins
- ✅ Confirmar que VPS es accesible desde Jenkins
- ✅ Revisar que dependencias del sistema estén instaladas
- ✅ Verificar permisos en directorio `/www/wwwroot/`