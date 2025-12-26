# 🚀 Server Deployment - Always Online

## ✅ Dedicated API Server Deployed!

Your Event Manager API is now running 24/7 on Vercel as a separate deployment.

### 🌐 API Server URLs

**Production API**: https://server-5i1vk5gn3-karthikeyan006867s-projects.vercel.app

**All Endpoints**: 
```
GET  /api/events
POST /api/events
GET  /api/events/upcoming/list
POST /api/hackatime/heartbeat
GET  /api/analytics/stats
...and 40+ more endpoints
```

**Dashboard**: https://vercel.com/karthikeyan006867s-projects/server

### 📊 Deployment Details

- **Type**: Serverless Node.js API
- **Status**: Always Online ✅
- **Auto-scaling**: Yes
- **Environment**: Production
- **Region**: Global Edge Network

### 🔧 Configuration

The API server is configured with:
- ✅ HackaTime API Key: `1882521f-5422-498b-a22d-85ac59259506`
- ✅ HackaTime URL: `https://hackatime.hackclub.com/api/hackatime/v1`
- ✅ MongoDB: Optional (works without it)
- ✅ CORS: Enabled for all origins

### 🖥️ Local Server

Your local server is also running:
- **URL**: http://localhost:5000
- **Status**: Running on your machine
- **Use Case**: Development and testing

### 📱 Client Configuration

All clients are now configured to use the dedicated API:

**Web Client** (`client/*.js`):
```javascript
const API_URL = 'https://server-5i1vk5gn3-karthikeyan006867s-projects.vercel.app/api';
```

**Chrome Extension**:
```javascript
const API_URL = 'https://server-5i1vk5gn3-karthikeyan006867s-projects.vercel.app/api';
```

### 🔍 Test the API

**Test Endpoint**:
```bash
curl https://server-5i1vk5gn3-karthikeyan006867s-projects.vercel.app/api/events/upcoming/list
```

**Send Heartbeat**:
```bash
curl -X POST https://server-5i1vk5gn3-karthikeyan006867s-projects.vercel.app/api/hackatime/heartbeat \
  -H "Content-Type: application/json" \
  -d '{"entity":"test.js","type":"file","time":1735200000}'
```

### 📈 Benefits of Separate API Deployment

✅ **Always Available**: API runs 24/7, independent of frontend
✅ **Scalable**: Auto-scales based on traffic
✅ **Fast**: Deployed on Vercel's global edge network
✅ **Reliable**: No single point of failure
✅ **Secure**: Environment variables encrypted
✅ **Monitored**: Real-time logs and analytics

### 🎯 Architecture

```
┌─────────────────┐
│   Web Client    │ ──┐
│  (Vercel)       │   │
└─────────────────┘   │
                      │
┌─────────────────┐   │    ┌──────────────────┐
│ Chrome Extension│ ──┼───▶│  API Server      │
│  (Local)        │   │    │  (Vercel)        │
└─────────────────┘   │    │  Always Online   │
                      │    └──────────────────┘
┌─────────────────┐   │            │
│  Local Testing  │ ──┘            │
│  (localhost)    │                ▼
└─────────────────┘       ┌──────────────────┐
                          │  HackaTime API   │
                          │  (Hack Club)     │
                          └──────────────────┘
```

### 📝 Manage Your Deployment

**Vercel Dashboard**: 
- View logs: https://vercel.com/karthikeyan006867s-projects/server
- Check analytics
- Monitor performance
- Update environment variables

**Redeploy**:
```bash
cd server
npx vercel --token ol5jsDX1rgLp5VAhBpJ5cyE1 --prod
```

### 🔄 Auto-Deployment

Connected to GitHub: https://github.com/karthikeyan006867/project-1

Every push to `main` branch will auto-deploy both:
- Frontend: event-manager-hackatime
- API: server

### ✅ What's Working

- ✅ Local server running on port 5000
- ✅ Production API deployed and always online
- ✅ All clients updated to use production API
- ✅ Chrome extension configured
- ✅ HackaTime integration active
- ✅ Time tracking to Hack Club enabled

---

**API Status**: 🟢 Online
**Local Server**: 🟢 Running
**HackaTime**: 🟢 Connected
**Ready to Track**: ✅ Yes!
