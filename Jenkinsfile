pipeline {
    agent any
    
    environment {
        NODE_VERSION = '20'
        PROJECT_NAME = 'miniatura'
        DEPLOY_PATH = '/www/wwwroot/unicauca/miniatura'
    }
    
    stages {
        stage('Checkout') {
            steps {
                git branch: 'master', url: env.GIT_URL
            }
        }
        
        stage('Install Dependencies') {
            steps {
                sh 'npm ci --production'
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
                    // Copiar archivos al servidor de producción
                    sh """
                        rsync -avz --delete \
                        --exclude=node_modules \
                        --exclude=.git \
                        --exclude=.next/cache \
                        ./ ${DEPLOY_PATH}/
                    """
                    
                    // Instalar dependencias y build en producción
                    sh """
                        cd ${DEPLOY_PATH}
                        npm ci --production
                        npm run build
                    """
                    
                    // Reiniciar aplicación
                    sh """
                        cd ${DEPLOY_PATH}
                        if command -v pm2 >/dev/null 2>&1; then
                            pm2 restart ${PROJECT_NAME}-app || pm2 start ecosystem.config.json
                        else
                            # Reinicio manual requerido
                            echo "Reinicia la aplicación manualmente en aaPanel"
                        fi
                    """
                }
            }
        }
    }
    
    post {
        success {
            echo 'Deploy exitoso!'
        }
        failure {
            echo 'Deploy falló. Revisa los logs.'
        }
        always {
            cleanWs()
        }
    }
}