#!/bin/bash
# Deploy SUPER simple - solo el .next build
npm run build && rsync -avz --delete -e "ssh -p 2022" .next/ root@209.126.4.141:/www/wwwroot/unicauca/miniatura/.next/ && ssh -p 2022 root@209.126.4.141 "pm2 restart miniatura || (cd /www/wwwroot/unicauca/miniatura && npm start &)"
echo "🎉 Deploy completado en http://209.126.4.141:3002"