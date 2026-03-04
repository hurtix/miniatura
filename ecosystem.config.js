module.exports = {
  apps: [{
    name: 'miniatura',
    script: 'npm',
    args: 'start',
    cwd: '/www/wwwroot/unicauca/miniatura',
    env: {
      NODE_ENV: 'production',
      PORT: 3002
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    error_file: '/var/log/miniatura_error.log',
    out_file: '/var/log/miniatura_out.log',
    log_file: '/var/log/miniatura_combined.log',
    time: true
  }]
}