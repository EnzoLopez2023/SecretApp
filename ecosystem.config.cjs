module.exports = {
  apps: [{
    name: 'secretapp-backend',
    script: './server.js',
    cwd: 'C:\\inetpub\\wwwroot\\secretapp',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: 'C:\\inetpub\\wwwroot\\secretapp\\logs\\error.log',
    out_file: 'C:\\inetpub\\wwwroot\\secretapp\\logs\\out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
}
