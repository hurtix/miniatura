#!/bin/bash

# 🚀 Script de deploy directo - Sin Jenkins, sin dramas
set -e

VPS_HOST="209.126.4.141"
VPS_USER="root" 
DEPLOY_PATH="/www/wwwroot/unicauca/miniatura"

echo "🏗️  Construyendo proyecto..."
npm run build

echo "📦 Empaquetando archivos..."
# Crear tarball con solo lo necesario para producción
tar -czf miniatura_build.tar.gz \
    .next \
    public \
    package.json \
    package-lock.json \
    next.config.ts \
    --exclude=node_modules

echo "🚀 Subiendo al servidor..."
scp miniatura_build.tar.gz ${VPS_USER}@${VPS_HOST}:/tmp/

echo "📋 Configurando en servidor..."
ssh ${VPS_USER}@${VPS_HOST} << 'ENDSSH'
    # Parar servicio si está corriendo
    pm2 stop miniatura || true
    
    # Ir al directorio del proyecto
    cd /www/wwwroot/unicauca/miniatura
    
    # Backup de la versión actual (por si acaso)
    cp -r .next .next_backup_$(date +%Y%m%d_%H%M%S) 2>/dev/null || true
    
    # Extraer nuevo build
    tar -xzf /tmp/miniatura_build.tar.gz
    
    # Instalar dependencias de producción
    npm install --production
    
    # Reiniciar servicio
    pm2 start ecosystem.config.js --env production || pm2 start npm --name "miniatura" -- start
    
    # Limpiar archivo temporal
    rm /tmp/miniatura_build.tar.gz
    
    echo "✅ Deploy completado!"
ENDSSH

# Limpiar archivo local
rm miniatura_build.tar.gz

echo "🎉 ¡Listo! Tu app está en funcionamiento en ${VPS_HOST}:3002"