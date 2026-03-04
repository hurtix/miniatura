#!/bin/bash
# Deploy usando GitHub - MUCH más simple
set -e

echo "🚀 Empujando código a GitHub..."
git add .
git commit -m "deploy: $(date '+%Y-%m-%d %H:%M')" || echo "No hay cambios para commit"
git push origin master

echo "📋 Haciendo deploy en servidor via GitHub..."
ssh -p 2022 root@209.126.4.141 << 'ENDSSH'
    cd /www/wwwroot/unicauca/miniatura
    
    echo "📥 Descargando última versión..."
    git pull origin master
    
    echo "📦 Instalando dependencias..."
    npm install --production
    
    echo "🏗️ Construyendo proyecto..."
    npm run build
    
    echo "🔄 Reiniciando servicio..."
    pm2 restart miniatura || pm2 start npm --name "miniatura" -- start
    
    echo "✅ Deploy completado!"
ENDSSH

echo "🎉 ¡Listo! App funcionando en http://209.126.4.141:3002"