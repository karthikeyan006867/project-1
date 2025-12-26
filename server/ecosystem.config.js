// PM2 Configuration for 24/7 Server Operation
module.exports = {
  apps: [{
    name: 'event-manager-server',
    script: './server.js',
    
    // 24/7 Configuration
    instances: 2, // Run 2 instances for load balancing
    exec_mode: 'cluster', // Cluster mode for better performance
    
    // Auto-restart configuration
    autorestart: true, // Auto-restart if the app crashes
    watch: false, // Set to true in development
    max_memory_restart: '1G', // Restart if memory usage exceeds 1GB
    
    // Logging
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true, // Prefix logs with timestamp
    
    // Environment variables
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    env_development: {
      NODE_ENV: 'development',
      PORT: 5000
    },
    
    // Advanced PM2 Features
    min_uptime: '10s', // Minimum uptime before restart
    max_restarts: 10, // Max restarts within 1 minute
    restart_delay: 4000, // Delay between restarts (ms)
    
    // Monitoring
    exp_backoff_restart_delay: 100, // Exponential backoff restart delay
    
    // Graceful shutdown
    kill_timeout: 5000, // Timeout for graceful shutdown
    wait_ready: true, // Wait for ready signal
    listen_timeout: 10000, // Max time to wait for listen event
    
    // Health monitoring
    cron_restart: '0 0 * * *', // Restart daily at midnight
  }]
};
