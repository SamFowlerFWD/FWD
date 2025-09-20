module.exports = {
  apps: [{
    name: 'fwd-agency',
    script: './dist/server/entry.mjs',
    instances: 'max', // Use all available CPU cores
    exec_mode: 'cluster', // Enable cluster mode for load balancing
    watch: false, // Don't watch files in production
    max_memory_restart: '1G', // Restart if memory usage exceeds 1GB
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      HOST: '0.0.0.0'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    merge_logs: true,
    
    // Auto restart configuration
    autorestart: true,
    min_uptime: '10s',
    max_restarts: 10,
    
    // Graceful shutdown
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 3000,
    
    // Environment specific settings
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
      HOST: '0.0.0.0'
    },
    env_development: {
      NODE_ENV: 'development',
      PORT: 3000,
      HOST: 'localhost',
      watch: true,
      ignore_watch: ['node_modules', 'logs', '.git', 'dist']
    }
  }],
  
  // Deployment configuration
  deploy: {
    production: {
      user: 'deploy',
      host: 'YOUR_HOSTINGER_VPS_IP',
      ref: 'origin/main',
      repo: 'git@github.com:SamFowlerFWD/FWD.git',
      path: '/var/www/fwd-agency',
      'post-deploy': 'cd fwd-site && npm ci && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-deploy-local': 'echo "Deploying to Hostinger VPS..."',
      'ssh_options': 'ForwardAgent=yes'
    }
  }
};