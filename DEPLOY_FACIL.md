# 🚀 Deploy Commands - Alternativas Simples

## 1. Deploy Rápido (recomendado)
```bash
chmod +x deploy.sh && ./deploy.sh
```

## 2. Deploy Manual Básico
```bash
# Build local
npm run build

# Subir solo el build (más rápido)
rsync -avz --delete .next/ root@209.126.4.141:/www/wwwroot/unicauca/miniatura/.next/
ssh root@209.126.4.141 "cd /www/wwwroot/unicauca/miniatura && pm2 restart miniatura"
```

## 3. Deploy Completo Manual
```bash
npm run build
rsync -avz --exclude node_modules --exclude .git . root@209.126.4.141:/www/wwwroot/unicauca/miniatura/
ssh root@209.126.4.141 "cd /www/wwwroot/unicauca/miniatura && npm install --production && pm2 restart miniatura"
```

## 4. Deploy de Emergencia (una línea)
```bash
npm run build && rsync -avz .next/ root@209.126.4.141:/www/wwwroot/unicauca/miniatura/.next/ && ssh root@209.126.4.141 "pm2 restart miniatura"
```

## 5. Solo Reiniciar Servicio
```bash
ssh root@209.126.4.141 "pm2 restart miniatura"
```

## 6. Ver Logs del Servidor
```bash
ssh root@209.126.4.141 "pm2 logs miniatura"
```

## 把 Configuración Inicial del Servidor (hacer una sola vez)
```bash
# En el servidor
npm install -g pm2
cd /www/wwwroot/unicauca/miniatura
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## ❌ ¡Eliminar Jenkins!
Si Jenkins te está dando problemas, puedes:
1. Pausar/detener el pipeline de Jenkins
2. Usar GitHub Actions (más confiable) - opcional
3. O simplemente usar los comandos de arriba manualmente

## 🔧 Troubleshooting VPS
```bash
# Verificar estado del servicio
ssh root@209.126.4.141 "pm2 status"

# Revisar puertos
ssh root@209.126.4.141 "netstat -tulpn | grep 3002"

# Verificar espacio en disco
ssh root@209.126.4.141 "df -h"
```