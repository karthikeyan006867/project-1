# 🎯 Quick Start - Run Your 24/7 Server in 5 Minutes

## Option 1: Automated Setup (Recommended)

### Windows:
```bash
# Run the setup script
setup-247.bat
```

### Linux/Mac:
```bash
# Make script executable
chmod +x setup-247.sh

# Run setup
./setup-247.sh
```

## Option 2: Manual Setup

### Step 1: Install Dependencies
```bash
cd server
npm install
```

### Step 2: Install PM2
```bash
npm install -g pm2
```

### Step 3: Configure Environment
```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your settings
# At minimum, set:
# - MONGODB_URI (or use MongoDB Atlas)
# - JWT_SECRET (any random string)
```

### Step 4: Start the Server

**For Development:**
```bash
npm run dev
```

**For Production (24/7):**
```bash
npm run pm2:start
```

## Verify It's Running

1. **Check PM2 Status:**
   ```bash
   npm run pm2:status
   ```

2. **Check Health:**
   ```bash
   curl http://localhost:5000/api/health
   ```

3. **View Logs:**
   ```bash
   npm run pm2:logs
   ```

## Common PM2 Commands

```bash
# Start server
npm run pm2:start

# Stop server
npm run pm2:stop

# Restart server
npm run pm2:restart

# View logs
npm run pm2:logs

# Monitor in real-time
npm run pm2:monit

# Check status
npm run pm2:status
```

## Testing the Features

### 1. Health Check
```bash
curl http://localhost:5000/api/health
```

### 2. Detailed Metrics
```bash
curl http://localhost:5000/api/health/detailed
```

### 3. Register a User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User",
    "username": "testuser"
  }'
```

### 4. Create an Event (with auth token)
```bash
curl -X POST http://localhost:5000/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Test Event",
    "description": "Testing the API",
    "category": "work",
    "startDate": "2024-01-01T10:00:00Z"
  }'
```

## Troubleshooting

### Server won't start:
```bash
# Check if port 5000 is in use
netstat -ano | findstr :5000  # Windows
lsof -i :5000                 # Linux/Mac

# Check logs
npm run pm2:logs
```

### MongoDB connection error:
1. Make sure MongoDB is running
2. Or use MongoDB Atlas (free tier)
3. Update MONGODB_URI in .env

### Module not found errors:
```bash
cd server
npm install
```

## Next Steps

1. ✅ Server running? Great!
2. 📝 Configure additional services in `.env`:
   - Redis (for caching)
   - Email (for notifications)
   - OpenAI (for AI features)
   - Pusher (for real-time)

3. 🚀 Deploy to production:
   - DigitalOcean
   - AWS
   - Azure
   - Your own VPS

## Success Indicators

✅ PM2 shows "online" status
✅ `/api/health` returns 200
✅ No errors in logs
✅ Server auto-restarts on crash

---

**🎉 That's it! Your 24/7 server with 90+ features is running!**
