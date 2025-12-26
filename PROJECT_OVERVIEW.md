# 📊 Event Manager - Complete Project Overview

## 🎯 What You Have

A **full-stack event management application** with these components:

### 1. **Backend Server** (Node.js/Express)
- **Location**: `server/`
- **Port**: 5000
- **Features**:
  - RESTful API for events CRUD operations
  - MongoDB database integration
  - WakaTime API integration
  - HackaTime (Hack Club) API integration
  - Time tracking sync functionality
  - Reminder management system
  - Cloudinary file upload support (when configured)

### 2. **Web Frontend** (HTML/CSS/JavaScript)
- **Location**: `client/`
- **Features**:
  - Beautiful gradient UI with Hack Club colors
  - Event creation, editing, deletion
  - Dashboard with real-time stats
  - Category filtering
  - Priority-based event cards
  - WakaTime/HackaTime stats display
  - Responsive design

### 3. **Chrome Extension**
- **Location**: `chrome-extension/`
- **Features**:
  - Quick view of upcoming events
  - Desktop notifications for reminders
  - Background time tracking sync (every 30 min)
  - Reminder checking (every 5 min)
  - Settings page for API key configuration
  - Beautiful popup with stats

## 📁 Complete File Structure

```
event-manager/
│
├── 📄 README.md                    # Main documentation
├── 📄 QUICKSTART.md                # Quick setup guide
├── 📄 CLOUDINARY_SETUP.md          # Cloudinary integration guide
├── 📄 package.json                 # Root package file
├── 📄 .gitignore                   # Git ignore rules
├── 🔧 setup.bat                    # Windows setup script
├── 🔧 setup.sh                     # Linux/Mac setup script
│
├── 📂 server/                      # Backend application
│   ├── 📄 server.js                # Main Express server
│   ├── 📄 package.json             # Backend dependencies
│   ├── 📄 .env.example             # Environment template
│   │
│   └── 📂 config/                  # Configuration files
│       ├── 📄 cloudinary.js        # Cloudinary setup
│       └── 📄 database.js          # MongoDB connection
│
├── 📂 client/                      # Frontend application
│   ├── 📄 index.html               # Main HTML page
│   ├── 📄 app.js                   # Frontend JavaScript
│   └── 📄 styles.css               # Styling
│
└── 📂 chrome-extension/            # Browser extension
    ├── 📄 manifest.json            # Extension configuration
    ├── 📄 popup.html               # Extension popup UI
    ├── 📄 popup.js                 # Popup logic
    ├── 📄 background.js            # Background service worker
    ├── 📄 options.html             # Settings page
    ├── 📄 options.js               # Settings logic
    │
    └── 📂 icons/                   # Extension icons
        └── 📄 README.md            # Icon creation guide
```

## 🔌 API Endpoints Reference

### Events
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/events` | Get all events |
| GET | `/api/events/:id` | Get specific event |
| POST | `/api/events` | Create new event |
| PUT | `/api/events/:id` | Update event |
| DELETE | `/api/events/:id` | Delete event |
| GET | `/api/events/upcoming/list` | Get upcoming events |
| GET | `/api/events/category/:category` | Get events by category |

### Time Tracking
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/wakatime/stats` | Get WakaTime statistics |
| GET | `/api/hackatime/stats` | Get HackaTime statistics |
| POST | `/api/time-tracking/sync` | Sync time tracking data |
| GET | `/api/time-tracking/:eventId` | Get event time tracking |

### Reminders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reminders/pending` | Get pending reminders |
| PUT | `/api/reminders/:eventId/:reminderTime/mark-sent` | Mark reminder as sent |

### File Upload
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload` | Upload file to Cloudinary |

## 🗄️ Database Schema

### Event Model
```javascript
{
  title: String (required),
  description: String,
  startDate: Date (required),
  endDate: Date,
  category: String,
  priority: String (low/medium/high),
  reminders: [{
    time: Date,
    message: String,
    sent: Boolean
  }],
  attachments: [{
    url: String,
    publicId: String,
    type: String
  }],
  wakatimeProject: String,
  hackatimeProject: String,
  timeTracked: Number (seconds),
  createdAt: Date,
  updatedAt: Date
}
```

### TimeTracking Model
```javascript
{
  eventId: ObjectId,
  source: String (wakatime/hackatime/manual),
  duration: Number (seconds),
  timestamp: Date,
  activity: String,
  project: String
}
```

## 🔑 Required API Keys

### 1. WakaTime
- **Get it**: https://wakatime.com/settings/account
- **Used for**: Automatic coding time tracking
- **Setup**: Install WakaTime VS Code extension

### 2. HackaTime (Hack Club)
- **Get it**: https://hackatime.hackclub.com/settings/account
- **Used for**: Hack Club specific time tracking
- **Setup**: Configure in extension settings

### 3. Cloudinary (Optional)
- **Get it**: https://cloudinary.com
- **Used for**: File uploads and media management
- **Setup**: See CLOUDINARY_SETUP.md

## 🚀 How to Run

### Quick Start (Windows)
```bash
# Run the setup script
setup.bat

# Edit server\.env with your API keys

# Start the server
cd server
npm start

# Open client\index.html in browser

# Install Chrome extension from chrome://extensions/
```

### Manual Start
```bash
# 1. Install dependencies
cd server
npm install

# 2. Configure environment
copy .env.example .env
# Edit .env with your API keys

# 3. Start MongoDB
mongod

# 4. Start server
npm start

# 5. Open frontend
# Open client/index.html in browser

# 6. Load Chrome extension
# Load unpacked from chrome-extension folder
```

## 🎨 Features Walkthrough

### Event Management
1. Create events with title, description, dates
2. Assign categories (hackathon, workshop, etc.)
3. Set priorities (low, medium, high)
4. Add multiple reminders
5. Link to WakaTime projects

### Time Tracking
1. Automatic sync every 30 minutes
2. Manual sync button
3. View total hours per event
4. See WakaTime and HackaTime stats on dashboard

### Reminders
1. Chrome extension checks every 5 minutes
2. Desktop notifications
3. Auto-mark as sent
4. Customizable reminder messages

### Chrome Extension
1. Quick view of upcoming events
2. One-click sync
3. Configure API keys in settings
4. Background continuous tracking

## 🎯 Perfect For

- ✅ Hack Club Summer Events
- ✅ Hackathon tracking
- ✅ Workshop scheduling
- ✅ Project deadline management
- ✅ Time tracking for coding projects
- ✅ Habit building with reminders

## 🔧 Customization

### Change Colors
Edit `client/styles.css` CSS variables:
```css
:root {
    --primary-color: #ec3750;
    --secondary-color: #338eda;
    /* ... more colors */
}
```

### Add New Event Categories
Edit both:
- `client/index.html` (select dropdown)
- `client/app.js` (filter dropdown)

### Modify Sync Intervals
Edit `chrome-extension/background.js`:
```javascript
chrome.alarms.create('syncTimeTracking', { 
    periodInMinutes: 30  // Change this
});
```

## 📊 Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Extension**: Chrome Extension Manifest V3
- **APIs**: WakaTime, HackaTime, Cloudinary
- **Time Tracking**: Automated sync via APIs

## 🤝 Integration with Hack Club

This app is specifically designed for:
- **Hack Club Summer Events** participation
- **HackaTime** tracking integration
- **Summer of Making** project tracking
- **Hack Club workshops** scheduling
- **Community event** management

## 📝 Next Steps

1. ✅ Run `setup.bat` (Windows) or `setup.sh` (Linux/Mac)
2. ✅ Get your WakaTime and HackaTime API keys
3. ✅ Configure `.env` file
4. ✅ Start MongoDB
5. ✅ Start the server
6. ✅ Open the web app
7. ✅ Install Chrome extension
8. ✅ Create your first event!
9. ✅ Start coding and watch time get tracked!

## 🆘 Need Help?

- Check QUICKSTART.md for detailed setup
- See CLOUDINARY_SETUP.md for file uploads
- Read README.md for full documentation
- Check browser console for errors
- Verify all API keys are correct

## 🎉 You're All Set!

Everything is ready to go. Just:
1. Install dependencies
2. Add your API keys
3. Start the server
4. Start managing events like a pro!

**Happy hacking! 🚀**

Made with ❤️ for Hack Club
