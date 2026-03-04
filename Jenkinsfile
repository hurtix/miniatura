pipeline {
    agent {
        docker {
            image 'node:20-alpine'
            args '-u root:root'
        }
    }
    
    environment {
        NODE_VERSION = '20'
        PROJECT_NAME = 'miniatura'
        
        // ⚠️ CAMBIAR ESTA RUTA para que NO sobrescriba tu otro proyecto
        DEPLOY_PATH = '/www/wwwroot/miniatura'  // Nueva ruta específica para este proyecto
        
        // ✅ Usar credenciales que ya tienes configuradas
        VPS_HOST = '209.126.4.141'  // Cambiar por tu IP real
        VPS_USER = 'root'  
        SSH_CREDENTIALS = 'vps-ssh'  // ✅ Usar el ID que ya tienes
    }
    
    stages {        
        stage('Install Dependencies') {
            steps {
                sh '''
                    # Instalar herramientas del sistema necesarias
                    apk add --no-cache \
                        rsync \
                        openssh-client \
                        python3 \
                        py3-pip \
                        make \
                        g++ \
                        pkgconfig \
                        cairo-dev \
                        jpeg-dev \
                        pango-dev \
                        giflib-dev \
                        librsvg-dev \
                        pixman-dev \
                        pangomm-dev
                    
                    # Verificar que Python está disponible
                    python3 --version
                    
                    # Instalar dependencias del proyecto
                    npm ci --production
                '''
            }
        }
        
        stage('Build') {
            steps {
                sh 'npm run build'
            }
        }
        
        stage('Test') {
            steps {
                sh 'npm run lint'
            }
        }
        
        stage('Deploy') {
            steps {
                script {
                    // Usar credenciales SSH configuradas en Jenkins
                    sshagent(credentials: [env.SSH_CREDENTIALS]) {
                        // Copiar archivos al servidor VPS
                        sh """
                            rsync -avz --delete \
                            --exclude=node_modules \
                            --exclude=.git \
                            --exclude=.next/cache \
                            --exclude=logs \
                            ./ ${VPS_USER}@${VPS_HOST}:${DEPLOY_PATH}/
                        """
                        
                        // Ejecutar comandos en el VPS remoto
                        sh """
                            ssh ${VPS_USER}@${VPS_HOST} "
                                cd ${DEPLOY_PATH}
                                
                                # Copiar variables de entorno
                                cp .env.production.example .env.production
                                echo 'Configurar .env.production con tus valores reales'
                                
                                # Instalar dependencias
                                npm ci --production
                                
                                # Build de producción
                                npm run build
                                
                                # Reiniciar aplicación
                                if command -v pm2 >/dev/null 2>&1; then
                                    pm2 restart ${PROJECT_NAME}-app || pm2 start ecosystem.config.json
                                else
                                    echo 'Reinicia manualmente en aaPanel Node.js Project'
                                fi
                                
                                # Verificar que la aplicación esté funcionando
                                sleep 5
                                curl -f http://localhost:3002/ || echo 'Aplicación no responde - verificar logs'
                            "
                        """
                    }
                }
            }
        }
    }
    
    post {
        success {
            echo '🎉 Deploy exitoso!'
            echo "✅ Aplicación desplegada en: ${VPS_HOST}:3002"
            echo "🔧 Recuerda configurar .env.production en el servidor"
        }
        failure {
            echo '💥 Deploy falló. Revisa los logs arriba.'
            echo '🔍 Verifica: SSH credentials, VPS accessible, dependencias del sistema'
        }
        always {
            cleanWs()
        }
    }
}