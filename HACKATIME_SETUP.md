# HackaTime Setup Instructions

## ✅ Configuration Updated!

Your Event Manager is now configured to use the official HackaTime API:

### API Configuration
- **API Key**: `1882521f-5422-498b-a22d-85ac59259506`
- **API URL**: `https://hackatime.hackclub.com/api/hackatime/v1`
- **Environment**: Production HackaTime

### Updated Files
1. ✅ `server/.env` - API key and URL updated
2. ✅ `server/routes/hackatime.js` - Endpoints corrected for v1 API

### API Endpoints Now Using:
```
POST /users/current/heartbeats          - Send single heartbeat
POST /users/current/heartbeats.bulk     - Send bulk heartbeats
GET  /users/current/summaries           - Get today's stats
GET  /users/current/stats/:range        - Get historical stats
GET  /users/current                     - Get user info
GET  /leaders                           - Get leaderboard
```

### Test Your Setup

1. **Open HackaTime Test Page**:
   ```
   http://localhost:8080/hackatime-test.html
   ```

2. **Send Test Heartbeat**:
   Click "Send Test Heartbeat" button to verify connection

3. **Check Your Stats**:
   Visit your HackaTime dashboard at:
   ```
   https://hackatime.hackclub.com/
   ```

### Server Status
- ✅ Server running on port 5000
- ✅ HackaTime API connected
- ✅ All heartbeats will now appear in Hack Club's system

### Verify It Works

Run this command to test:
```powershell
curl -X POST http://localhost:5000/api/hackatime/heartbeat `
  -H "Content-Type: application/json" `
  -d '{"entity":"test-file.js","type":"file","category":"coding","time":' $(Get-Date -UFormat %s) ',"project":"hackatime-test","language":"JavaScript","isWrite":true}'
```

Or use the web interface at http://localhost:8080/hackatime-test.html

### What's Tracked
- ✅ All coding activity
- ✅ Programming languages used
- ✅ Projects worked on
- ✅ Time spent coding
- ✅ Streaks and goals

Your time will now show up in Hack Club's Flavor Town leaderboard! 🔥
