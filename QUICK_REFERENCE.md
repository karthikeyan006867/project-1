# 🚀 QUICK REFERENCE CARD

## Start Server (Choose One)

### 🎯 Automated (Recommended)
```bash
# Windows
setup-247.bat

# Linux/Mac
chmod +x setup-247.sh && ./setup-247.sh
```

### 🔧 Manual
```bash
cd server
npm install
npm install -g pm2
cp .env.example .env
# Edit .env
npm run pm2:start
```

---

## Essential Commands

```bash
# Start 24/7 server
npm run pm2:start

# Check status
npm run pm2:status

# View logs
npm run pm2:logs

# Restart
npm run pm2:restart

# Stop
npm run pm2:stop

# Monitor
npm run pm2:monit
```

---

## Health Checks

```bash
# Basic health
curl http://localhost:5000/api/health

# Detailed metrics
curl http://localhost:5000/api/health/detailed

# Metrics
curl http://localhost:5000/api/metrics
```

---

## Key Endpoints

### Auth
- `POST /api/auth/register` - Register
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get user

### Events
- `GET /api/events` - List events
- `POST /api/events` - Create event
- `PUT /api/events/:id` - Update
- `DELETE /api/events/:id` - Delete

### AI
- `POST /api/ai/suggest-events` - AI suggestions
- `POST /api/ai/categorize` - Auto-categorize
- `POST /api/ai/smart-schedule` - Smart schedule

### Bulk
- `POST /api/bulk/bulk-create` - Bulk create
- `GET /api/bulk/export` - Export
- `POST /api/bulk/import` - Import

---

## Configuration (server/.env)

### Required
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_secret_key
```

### Optional
```env
REDIS_HOST=localhost
EMAIL_HOST=smtp.gmail.com
OPENAI_API_KEY=your_key
PUSHER_APP_ID=your_id
```

---

## Troubleshooting

### Server won't start
```bash
pm2 logs --err
pm2 restart event-manager
```

### Port in use
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5000 | xargs kill
```

### Reset everything
```bash
pm2 delete event-manager
pm2 start ecosystem.config.js
```

---

## Success Indicators

✅ `pm2 status` shows "online"
✅ `/api/health` returns 200
✅ No errors in logs
✅ Uptime > 24 hours

---

## Features Implemented: 95+

- Authentication (10)
- Database (15)
- Notifications (8)
- AI & Automation (10)
- Collaboration (10)
- API Features (8)
- Infrastructure (15+)
- Analytics (10)
- Event Management (9+)

---

## Documentation

- [QUICKSTART_247.md](QUICKSTART_247.md) - 5-min start
- [247_DEPLOYMENT_GUIDE.md](247_DEPLOYMENT_GUIDE.md) - Full guide
- [FEATURE_LIST_90+.md](FEATURE_LIST_90+.md) - All features
- [README_V2.md](README_V2.md) - Main README

---

## Support

Issues? Check:
1. Logs: `pm2 logs`
2. Health: `curl http://localhost:5000/api/health`
3. Status: `pm2 status`
4. Docs: Read guides above

---

**🎉 Your 24/7 Server is Ready!**
