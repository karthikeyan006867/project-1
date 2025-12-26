# 🎯 Event Manager - Hack Club Edition

## ✅ What's Been Created

Your complete event management application with WakaTime & HackaTime integration is ready!

## 📦 Components

### 1. Backend Server (Node.js/Express)
- ✅ RESTful API with full CRUD operations
- ✅ MongoDB integration
- ✅ WakaTime API integration
- ✅ HackaTime (Hack Club) API integration
- ✅ Automated time tracking sync
- ✅ Reminder system
- ✅ Cloudinary upload support (ready for your credentials)

### 2. Web Frontend
- ✅ Beautiful responsive UI with Hack Club colors
- ✅ Event creation, editing, deletion
- ✅ Dashboard with real-time stats
- ✅ Time tracking visualization
- ✅ Category filtering
- ✅ Priority-based events

### 3. Chrome Extension
- ✅ Quick event view popup
- ✅ Desktop notifications for reminders
- ✅ Background time sync (every 30 min)
- ✅ Settings page for API configuration
- ✅ Continuous tracking support

## 🚀 Quick Start (3 Steps)

### Step 1: Install Dependencies
```bash
cd server
npm install
```

### Step 2: Configure API Keys
Create `server/.env` file:
```env
WAKATIME_API_KEY=your_key_here
HACKATIME_API_KEY=your_key_here
```

Get keys from:
- WakaTime: https://wakatime.com/settings/account
- HackaTime: https://hackatime.hackclub.com

### Step 3: Start Everything
```bash
# Terminal 1: Start server
cd server
npm start

# Terminal 2: Open browser
# Navigate to client/index.html

# Chrome: Load extension from chrome-extension folder
```

## 📚 Documentation Files

- **README.md** - Complete documentation
- **QUICKSTART.md** - Step-by-step setup guide
- **PROJECT_OVERVIEW.md** - Detailed project structure
- **CLOUDINARY_SETUP.md** - File upload configuration

## 🎯 Key Features

### Event Management
- Create/edit/delete events
- Categories: hackathon, workshop, project, meeting, deadline
- Priorities: low, medium, high
- Date range support
- Multiple reminders per event

### Time Tracking
- Automatic WakaTime sync
- HackaTime integration for Hack Club
- Real-time stats dashboard
- Per-event time tracking
- Manual sync button

### Reminders & Notifications
- Chrome desktop notifications
- Automatic reminder checking (every 5 min)
- Mark reminders as sent
- Customizable reminder times

### Chrome Extension Features
- Upcoming events view
- WakaTime/HackaTime stats
- One-click sync
- Background continuous tracking
- API key configuration

## 🔌 API Endpoints Summary

- `GET/POST /api/events` - Event CRUD
- `GET /api/wakatime/stats` - WakaTime data
- `GET /api/hackatime/stats` - HackaTime data
- `POST /api/time-tracking/sync` - Sync time
- `GET /api/reminders/pending` - Get reminders
- `POST /api/upload` - File upload (Cloudinary)

## 🗄️ Database (MongoDB)

Two collections:
- **events** - All event data
- **timetrackings** - Time tracking logs

## ⚙️ Environment Variables

Required in `server/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/event-manager
WAKATIME_API_KEY=your_key
HACKATIME_API_KEY=your_key
HACKATIME_URL=https://hackatime.hackclub.com

# Optional
CLOUDINARY_CLOUD_NAME=your_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
```

## 🎨 Tech Stack

- **Backend**: Node.js 14+, Express 4.18
- **Database**: MongoDB 5+
- **Frontend**: HTML5, CSS3, Vanilla JS
- **Extension**: Chrome Manifest V3
- **APIs**: WakaTime, HackaTime, Cloudinary

## 📋 Prerequisites

- ✅ Node.js (v14+)
- ✅ MongoDB (local or Atlas)
- ✅ WakaTime account + extension in VS Code
- ✅ HackaTime account (Hack Club)
- ⭕ Cloudinary account (optional)

## 🔧 Installation

### Windows:
```bash
setup.bat
```

### Linux/Mac:
```bash
chmod +x setup.sh
./setup.sh
```

### Manual:
See QUICKSTART.md

## 🎯 Perfect For

- Hack Club Summer Events
- Hackathon participation tracking
- Workshop scheduling
- Project deadline management
- Coding time analytics
- Habit building

## 🆘 Troubleshooting

### MongoDB won't connect?
- Check if MongoDB is running: `mongod`
- Try: `mongodb://127.0.0.1:27017/event-manager`

### WakaTime not working?
- Verify API key is correct
- Check WakaTime VS Code extension is active
- Look at VS Code output panel

### Chrome extension not loading?
- Make sure manifest.json is valid
- Check browser console for errors
- Verify server URL is correct

### CORS errors?
- Server already has CORS enabled
- Make sure backend is running
- Check browser console

## 📁 File Structure

```
event-manager/
├── server/           # Backend
│   ├── server.js
│   ├── config/
│   └── package.json
├── client/           # Frontend
│   ├── index.html
│   ├── app.js
│   └── styles.css
├── chrome-extension/ # Extension
│   ├── manifest.json
│   ├── popup.html/js
│   ├── background.js
│   └── options.html/js
└── docs/             # Documentation
```

## ✨ What Makes This Special?

1. **Hack Club Integration** - Built specifically for Hack Club events
2. **Dual Time Tracking** - Both WakaTime AND HackaTime
3. **Chrome Extension** - Always accessible, background sync
4. **Beautiful UI** - Modern gradient design with Hack Club colors
5. **Smart Reminders** - Never miss an event
6. **Continuous Tracking** - Automatic time sync in background
7. **Fully Documented** - Complete guides for everything

## 🚀 What to Do Now

1. **Install**: Run setup script
2. **Configure**: Add your API keys
3. **Start**: Launch server and open app
4. **Create**: Make your first event
5. **Code**: Start coding and watch time track!

## 🎉 You're Ready!

Everything is set up and ready to go. Just add your API keys and start tracking your Hack Club summer events!

For detailed instructions, see:
- **First time?** → QUICKSTART.md
- **Want details?** → PROJECT_OVERVIEW.md
- **File uploads?** → CLOUDINARY_SETUP.md
- **Full docs?** → README.md

---

**Made with ❤️ for Hack Club Summer Events**

Happy hacking! 🚀

---

## 📞 Support Resources

- [WakaTime Docs](https://wakatime.com/plugins)
- [HackaTime](https://hackatime.hackclub.com)
- [MongoDB Docs](https://docs.mongodb.com)
- [Hack Club](https://hackclub.com)
- [Chrome Extensions](https://developer.chrome.com/docs/extensions)
