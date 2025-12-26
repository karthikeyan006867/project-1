const Sentry = require('@sentry/node');
const os = require('os');

// Initialize Sentry for error tracking
const initSentry = (app) => {
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 1.0,
    });

    app.use(Sentry.Handlers.requestHandler());
    app.use(Sentry.Handlers.tracingHandler());
  }
};

// Error tracking middleware
const sentryErrorHandler = () => {
  if (process.env.SENTRY_DSN) {
    return Sentry.Handlers.errorHandler();
  }
  return (err, req, res, next) => next(err);
};

// Request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const log = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent')
    };
    
    console.log(JSON.stringify(log));
  });
  
  next();
};

// Health metrics
const getHealthMetrics = () => {
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();
  
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: {
      seconds: Math.floor(uptime),
      formatted: formatUptime(uptime)
    },
    memory: {
      rss: formatBytes(memoryUsage.rss),
      heapTotal: formatBytes(memoryUsage.heapTotal),
      heapUsed: formatBytes(memoryUsage.heapUsed),
      external: formatBytes(memoryUsage.external),
      percentage: ((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100).toFixed(2) + '%'
    },
    cpu: {
      usage: process.cpuUsage(),
      cores: os.cpus().length
    },
    system: {
      platform: os.platform(),
      arch: os.arch(),
      totalMemory: formatBytes(os.totalmem()),
      freeMemory: formatBytes(os.freemem()),
      loadAverage: os.loadavg()
    },
    node: {
      version: process.version,
      env: process.env.NODE_ENV
    }
  };
};

// Format uptime
const formatUptime = (seconds) => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  return `${days}d ${hours}h ${minutes}m ${secs}s`;
};

// Format bytes
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

// Performance monitoring middleware
const performanceMonitor = (req, res, next) => {
  const start = process.hrtime.bigint();
  
  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1000000; // Convert to milliseconds
    
    if (duration > 1000) { // Log slow requests (> 1s)
      console.warn(`⚠️ Slow request detected: ${req.method} ${req.path} - ${duration.toFixed(2)}ms`);
    }
  });
  
  next();
};

// Database connection monitor
const monitorDatabaseConnection = (mongoose) => {
  mongoose.connection.on('connected', () => {
    console.log('✅ Database connected');
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️ Database disconnected');
  });

  mongoose.connection.on('error', (err) => {
    console.error('❌ Database error:', err);
  });

  mongoose.connection.on('reconnected', () => {
    console.log('✅ Database reconnected');
  });
};

// Graceful shutdown
const gracefulShutdown = (server) => {
  const shutdown = (signal) => {
    console.log(`\n${signal} received. Starting graceful shutdown...`);
    
    server.close(() => {
      console.log('✅ HTTP server closed');
      
      // Close database connections
      const mongoose = require('mongoose');
      mongoose.connection.close(false, () => {
        console.log('✅ MongoDB connection closed');
        process.exit(0);
      });
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
      console.error('⚠️ Forcing shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

// Metrics endpoint data
let metricsData = {
  requests: 0,
  errors: 0,
  totalResponseTime: 0
};

const trackMetrics = (req, res, next) => {
  const start = Date.now();
  metricsData.requests++;
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    metricsData.totalResponseTime += duration;
    
    if (res.statusCode >= 400) {
      metricsData.errors++;
    }
  });
  
  next();
};

const getMetrics = () => {
  return {
    ...metricsData,
    averageResponseTime: metricsData.requests > 0 
      ? (metricsData.totalResponseTime / metricsData.requests).toFixed(2) + 'ms'
      : '0ms',
    errorRate: metricsData.requests > 0
      ? ((metricsData.errors / metricsData.requests) * 100).toFixed(2) + '%'
      : '0%'
  };
};

module.exports = {
  initSentry,
  sentryErrorHandler,
  requestLogger,
  getHealthMetrics,
  performanceMonitor,
  monitorDatabaseConnection,
  gracefulShutdown,
  trackMetrics,
  getMetrics
};
