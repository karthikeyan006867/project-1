const redis = require('redis');

let redisClient = null;

const connectRedis = async () => {
  try {
    if (process.env.REDIS_HOST) {
      redisClient = redis.createClient({
        socket: {
          host: process.env.REDIS_HOST || 'localhost',
          port: process.env.REDIS_PORT || 6379
        },
        password: process.env.REDIS_PASSWORD || undefined
      });

      redisClient.on('error', (err) => console.error('Redis Client Error:', err));
      redisClient.on('connect', () => console.log('✅ Redis connected successfully'));
      
      await redisClient.connect();
    } else {
      console.warn('⚠️ Redis not configured - caching disabled');
    }
  } catch (error) {
    console.warn('⚠️ Redis connection failed:', error.message);
  }
};

const getRedisClient = () => redisClient;

// Cache middleware
const cache = (duration = 300) => {
  return async (req, res, next) => {
    if (!redisClient?.isOpen) {
      return next();
    }

    const key = `cache:${req.originalUrl}`;

    try {
      const cachedData = await redisClient.get(key);
      
      if (cachedData) {
        return res.json(JSON.parse(cachedData));
      }

      // Store original res.json
      const originalJson = res.json.bind(res);
      
      // Override res.json
      res.json = (data) => {
        redisClient.setEx(key, duration, JSON.stringify(data)).catch(err => {
          console.error('Cache set error:', err);
        });
        return originalJson(data);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
};

// Clear cache by pattern
const clearCache = async (pattern = '*') => {
  if (!redisClient?.isOpen) return;
  
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch (error) {
    console.error('Clear cache error:', error);
  }
};

module.exports = {
  connectRedis,
  getRedisClient,
  cache,
  clearCache
};
