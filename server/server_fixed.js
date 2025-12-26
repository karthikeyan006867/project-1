const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const axios = require('axios');
const compression = require('compression');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Import middleware and configs
const { connectRedis, redisClient } = require('./config/redis');
const { 
  apiLimiter, 
  securityHeaders, 
  sanitizeRequest 
} = require('./middleware/auth');
const {
  initSentry,
  sentryErrorHandler,
  requestLogger,
  performanceMonitor,
  monitorDatabaseConnection,
  trackMetrics
} = require('./middleware/monitoring');

// Initialize Sentry
initSentry(app);

// Security middleware
app.use(securityHeaders);
app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
  credentials: true
}));

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request sanitization
app.use(sanitizeRequest);

// Logging and monitoring
app.use(requestLogger);
app.use(performanceMonitor);
app.use(trackMetrics);

// API Rate limiting
app.use('/api/', apiLimiter);

// MongoDB Connection with retry logic
const connectDB = async (retries = 5) => {
  for (let i = 0; i < retries; i++) {
    try {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/event-manager', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
      console.log('✅ MongoDB connected successfully');
      monitorDatabaseConnection(mongoose);
      return;
    } catch (err) {
      console.warn(`⚠️ MongoDB connection attempt ${i + 1} failed:`, err.message);
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }
  console.warn('⚠️ MongoDB not connected - running without database');
};

connectDB();

// Connect Redis for caching
connectRedis().catch(err => console.warn('Redis connection failed:', err.message));

// Import Models
const Event = require('./models/Event');
const TimeTracking = require('./models/TimeTracking');
const UserSettings = require('./models/UserSettings');

// Import Routes
const analyticsRouter = require('./routes/analytics');
const dataManagementRouter = require('./routes/dataManagement');
const searchRouter = require('./routes/search');
const settingsRouter = require('./routes/settings');
const calendarRouter = require('./routes/calendar');
const hackatimeRouter = require('./routes/hackatime');
const schedulingRouter = require('./routes/scheduling');
const notificationsRouter = require('./routes/notifications');
const collaborationRouter = require('./routes/collaboration');
const templatesRouter = require('./routes/templates');
const integrationsRouter = require('./routes/integrations');
const timeTrackingRouter = require('./routes/timeTracking');

// NEW: Enhanced feature routes
const authRouter = require('./routes/auth');
const notificationsEnhancedRouter = require('./routes/notifications_enhanced');
const aiRouter = require('./routes/ai');
const realtimeRouter = require('./routes/realtime');
const bulkRouter = require('./routes/bulk');
const webhooksRouter = require('./routes/webhooks');

// Use Routes
app.use('/api/analytics', analyticsRouter);
app.use('/api/data', dataManagementRouter);
app.use('/api/search', searchRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/calendar', calendarRouter);
app.use('/api/hackatime', hackatimeRouter);
app.use('/api/scheduling', schedulingRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/collaboration', collaborationRouter);
app.use('/api/templates', templatesRouter);
app.use('/api/integrations', integrationsRouter);
app.use('/api/time-tracking', timeTrackingRouter);

// NEW: Enhanced feature routes
app.use('/api/auth', authRouter);
app.use('/api/notifications-v2', notificationsEnhancedRouter);
app.use('/api/ai', aiRouter);
app.use('/api/realtime', realtimeRouter);
app.use('/api/bulk', bulkRouter);
app.use('/api/webhooks', webhooksRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date(),
    uptime: process.uptime(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    redis: redisClient && redisClient.isOpen ? 'connected' : 'disconnected'
  });
});

// Enhanced metrics endpoint
app.get('/api/metrics', (req, res) => {
  try {
    const { getMetrics, getHealthMetrics } = require('./middleware/monitoring');
    res.json({
      metrics: getMetrics(),
      health: getHealthMetrics()
    });
  } catch (error) {
    res.json({ message: 'Metrics not available' });
  }
});

// API documentation endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    version: '2.0.0',
    features: [
      'Authentication & Authorization',
      'AI-Powered Features',
      'Real-time Collaboration',
      'Bulk Operations',
      'Webhook Management',
      'Enhanced Notifications',
      'Analytics & Reporting',
      'Event Management',
      'Time Tracking',
      'Calendar Integration',
      'WakaTime/HackaTime Integration'
    ],
    endpoints: {
      auth: '/api/auth/*',
      ai: '/api/ai/*',
      realtime: '/api/realtime/*',
      bulk: '/api/bulk/*',
      webhooks: '/api/webhooks/*',
      notifications: '/api/notifications-v2/*',
      analytics: '/api/analytics/*',
      events: '/api/events/*',
      timeTracking: '/api/time-tracking/*'
    }
  });
});

// Legacy events endpoints
app.get('/api/events', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json([]);
    }
    const events = await Event.find().sort({ startDate: -1 });
    res.json(events);
  } catch (error) {
    console.error('Error in /api/events:', error);
    res.json([]);
  }
});

app.get('/api/events/:id', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(404).json({ message: 'Database not connected' });
    }
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/events', async (req, res) => {
  try {
    const event = new Event(req.body);
    const savedEvent = await event.save();
    res.status(201).json(savedEvent);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.put('/api/events/:id', async (req, res) => {
  try {
    req.body.updatedAt = Date.now();
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.json(event);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.delete('/api/events/:id', async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/events/upcoming/list', async (req, res) => {
  try {
    const now = new Date();
    const events = await Event.find({ startDate: { $gte: now } })
      .sort({ startDate: 1 })
      .limit(10);
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/events/category/:category', async (req, res) => {
  try {
    const events = await Event.find({ category: req.params.category });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// WakaTime Integration
app.get('/api/wakatime/stats', async (req, res) => {
  try {
    const apiKey = process.env.WAKATIME_API_KEY;
    if (!apiKey) {
      return res.status(400).json({ message: 'WakaTime API key not configured' });
    }

    const response = await axios.get('https://wakatime.com/api/v1/users/current/stats/last_7_days', {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/hackatime/stats', async (req, res) => {
  try {
    const apiKey = process.env.HACKATIME_API_KEY;
    const baseUrl = process.env.HACKATIME_URL || 'https://hackatime.hackclub.com';
    
    if (!apiKey) {
      return res.status(400).json({ message: 'HackaTime API key not configured' });
    }

    const response = await axios.get(`${baseUrl}/api/v1/users/current/stats/last_7_days`, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/time-tracking/sync', async (req, res) => {
  try {
    const { eventId, source } = req.body;
    
    let stats;
    if (source === 'wakatime') {
      const apiKey = process.env.WAKATIME_API_KEY;
      const response = await axios.get('https://wakatime.com/api/v1/users/current/stats/last_7_days', {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      stats = response.data;
    } else if (source === 'hackatime') {
      const apiKey = process.env.HACKATIME_API_KEY;
      const baseUrl = process.env.HACKATIME_URL || 'https://hackatime.hackclub.com';
      const response = await axios.get(`${baseUrl}/api/v1/users/current/stats/last_7_days`, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      stats = response.data;
    }

    const timeTracking = new TimeTracking({
      eventId,
      source,
      duration: stats.data?.total_seconds || 0,
      activity: 'coding',
      project: stats.data?.projects?.[0]?.name || 'unknown'
    });

    await timeTracking.save();

    await Event.findByIdAndUpdate(eventId, {
      $inc: { timeTracked: stats.data?.total_seconds || 0 }
    });

    res.json({ message: 'Time tracking synced successfully', data: timeTracking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/upload', async (req, res) => {
  try {
    res.status(501).json({ message: 'Cloudinary integration pending - awaiting credentials' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/reminders/pending', async (req, res) => {
  try {
    const now = new Date();
    const events = await Event.find({
      'reminders.time': { $lte: now },
      'reminders.sent': false
    });

    const pendingReminders = [];
    events.forEach(event => {
      event.reminders.forEach(reminder => {
        if (!reminder.sent && new Date(reminder.time) <= now) {
          pendingReminders.push({
            eventId: event._id,
            eventTitle: event.title,
            reminderTime: reminder.time,
            message: reminder.message
          });
        }
      });
    });

    res.json(pendingReminders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/reminders/:eventId/:reminderTime/mark-sent', async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const reminder = event.reminders.find(r => 
      new Date(r.time).getTime() === new Date(req.params.reminderTime).getTime()
    );

    if (reminder) {
      reminder.sent = true;
      await event.save();
      res.json({ message: 'Reminder marked as sent' });
    } else {
      res.status(404).json({ message: 'Reminder not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Error handling middleware
app.use(sentryErrorHandler());

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════════╗
  ║   🚀 Event Manager Server - RUNNING 24/7     ║
  ╠═══════════════════════════════════════════════╣
  ║   Port: ${PORT.toString().padEnd(37, ' ')}║
  ║   Environment: ${(process.env.NODE_ENV || 'development').padEnd(29, ' ')}║
  ║   PID: ${process.pid.toString().padEnd(38, ' ')}║
  ╚═══════════════════════════════════════════════╝
  
  📊 Features Enabled:
  ✅ Authentication & Authorization (JWT, OAuth)
  ✅ Advanced Analytics & Reporting
  ✅ Real-time Collaboration (Pusher)
  ✅ AI-Powered Scheduling & Suggestions
  ✅ Multi-channel Notifications (Email, SMS, Push)
  ✅ Redis Caching
  ✅ Database Connection Pooling
  ✅ Rate Limiting & Security
  ✅ Error Tracking (Sentry)
  ✅ Performance Monitoring
  ✅ Auto-restart & Health Checks
  ✅ Graceful Shutdown
  
  🌐 Endpoints:
     Health: http://localhost:${PORT}/api/health
     Metrics: http://localhost:${PORT}/api/metrics
     Docs: http://localhost:${PORT}/api/docs
  `);

  if (process.send) {
    process.send('ready');
  }
});

// Graceful shutdown
const gracefulShutdown = (server) => {
  const shutdown = async (signal) => {
    console.log(`\n${signal} signal received: closing HTTP server`);
    
    server.close(async () => {
      console.log('HTTP server closed');
      
      try {
        await mongoose.connection.close(false);
        console.log('MongoDB connection closed');
        
        if (redisClient && redisClient.isOpen) {
          await redisClient.quit();
          console.log('Redis connection closed');
        }
        
        process.exit(0);
      } catch (err) {
        console.error('Error during shutdown:', err);
        process.exit(1);
      }
    });

    setTimeout(() => {
      console.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

gracefulShutdown(server);

module.exports = app;
