# 🚀 Quick Start Guide

## Step 1: Install Dependencies

```bash
cd server
npm install
```

## Step 2: Set Up MongoDB

### Option A: Local MongoDB
```bash
# Install MongoDB from https://www.mongodb.com/try/download/community
# Start MongoDB
mongod
```

### Option B: MongoDB Atlas (Cloud)
1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Get your connection string
4. Update `MONGODB_URI` in `.env`

## Step 3: Get API Keys

### WakaTime
1. Visit https://wakatime.com/settings/account
2. Copy your Secret API Key
3. Install WakaTime extension in VS Code:
   ```
   code --install-extension WakaTime.vscode-wakatime
   ```
4. Configure WakaTime in VS Code

### HackaTime (Hack Club)
1. Visit https://hackatime.hackclub.com
2. Sign up or log in
3. Go to settings/account
4. Copy your API key
5. Install HackaTime extension (if available)

## Step 4: Configure Environment

Create `server/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/event-manager

WAKATIME_API_KEY=waka_xxxxxxxxxxxxxxxxxxxxx
HACKATIME_API_KEY=hack_xxxxxxxxxxxxxxxxxxxxx
HACKATIME_URL=https://hackatime.hackclub.com

# Optional: Cloudinary for file uploads
CLOUDINARY_CLOUD_NAME=your_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
```

## Step 5: Start the Application

### Terminal 1: Start Backend
```bash
cd server
npm start
```

### Terminal 2: Start Frontend (Optional - use live server)
```bash
cd client
# Open index.html in browser or use:
python -m http.server 8000
# Then visit http://localhost:8000
```

## Step 6: Install Chrome Extension

1. Open Chrome
2. Go to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right)
4. Click "Load unpacked"
5. Select the `chrome-extension` folder
6. Click the extension icon
7. Click the gear icon to configure settings
8. Enter your API keys

## Step 7: Verify Everything Works

1. ✅ Backend running on http://localhost:5000
2. ✅ Frontend accessible in browser
3. ✅ MongoDB connected (check server console)
4. ✅ Chrome extension installed
5. ✅ Create a test event
6. ✅ Check if WakaTime stats appear

## 🎯 Next Steps

1. **Create your first event** for a Hack Club project
2. **Add WakaTime project name** to track coding time
3. **Set reminders** for important deadlines
4. **Enable auto-sync** in Chrome extension settings
5. **Start coding** and watch your time get tracked!

## 🐛 Troubleshooting

### MongoDB Connection Failed
- Check if MongoDB is running
- Verify connection string in `.env`
- Try: `mongodb://127.0.0.1:27017/event-manager`

### WakaTime Not Working
- Verify API key is correct
- Check WakaTime extension is active in VS Code
- Look at VS Code output panel for WakaTime logs

### Chrome Extension Not Loading
- Make sure manifest.json is valid
- Check browser console for errors
- Verify API URL matches your backend (localhost:5000)

### CORS Errors
- Backend includes CORS middleware
- Make sure server is running
- Check browser console for specific errors

## 📚 Resources

- [WakaTime Documentation](https://wakatime.com/plugins)
- [HackaTime Setup](https://hackatime.hackclub.com)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Chrome Extension Docs](https://developer.chrome.com/docs/extensions/)
- [Hack Club](https://hackclub.com/)

## 💡 Tips

- Keep VS Code WakaTime extension running while coding
- Use meaningful project names in WakaTime that match your events
- Set reminders 1 day and 1 hour before important events
- Sync time tracking regularly to keep stats updated
- Join Hack Club Slack for community support!

---

Need help? Check the main README.md or create an issue!
