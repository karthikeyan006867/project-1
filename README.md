# 🎯 Event Manager - Hack Club Edition

A comprehensive event management application with WakaTime and HackaTime integration, designed for Hack Club Summer Events. Track your events, get reminders, and automatically sync coding time across your projects!

## 🚀 Features

- **Event Management**: Create, edit, and track events with categories, priorities, and descriptions
- **Smart Reminders**: Get Chrome notifications for upcoming events
- **Time Tracking Integration**: 
  - WakaTime API integration for automatic coding time tracking
  - HackaTime integration for Hack Club events
  - Real-time sync of project hours
- **Chrome Extension**: Quick access to events, reminders, and time stats
- **Continuous Tracking**: Background monitoring and automatic time sync
- **Cloudinary Integration**: Upload and attach files to your events
- **Beautiful Dashboard**: Visual stats and insights about your events and time

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- WakaTime account and API key
- HackaTime account and API key (Hack Club)
- Cloudinary account (optional, for file uploads)

## 🛠️ Installation

### 1. Clone or Download

```bash
cd "c:\Users\kaart\.vscode\projects\New folder"
```

### 2. Install Backend Dependencies

```bash
cd server
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the `server` directory:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/event-manager

# WakaTime Configuration
WAKATIME_API_KEY=your_wakatime_api_key_here

# HackaTime Configuration (Hack Club)
HACKATIME_API_KEY=your_hackatime_api_key_here
HACKATIME_URL=https://hackatime.hackclub.com

# Cloudinary Configuration (optional)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 4. Get Your API Keys

#### WakaTime:
1. Go to https://wakatime.com/settings/account
2. Copy your "Secret API Key"
3. Make sure you have WakaTime extension installed in VS Code

#### HackaTime (Hack Club):
1. Go to https://hackatime.hackclub.com/settings/account
2. Copy your API key
3. Install HackaTime extension in VS Code

#### Cloudinary (Optional):
1. Sign up at https://cloudinary.com
2. Get your credentials from the dashboard

### 5. Start MongoDB

Make sure MongoDB is running:

```bash
# Windows
mongod

# Or use MongoDB Compass / Atlas
```

### 6. Start the Backend Server

```bash
cd server
npm start
```

The server will run on http://localhost:5000

### 7. Open the Frontend

Open `client/index.html` in your browser or use a local server:

```bash
# Using Python
cd client
python -m http.server 8000

# Then visit http://localhost:8000
```

### 8. Install Chrome Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the `chrome-extension` folder
5. Click on the extension icon and configure your API keys in settings

## 📱 Usage

### Creating Events

1. Open the web app
2. Fill in event details:
   - Title (required)
   - Description
   - Start/End dates
   - Category (hackathon, workshop, project, etc.)
   - Priority (low, medium, high)
   - WakaTime project name (optional)
3. Add reminders if needed
4. Click "Create Event"

### Chrome Extension

- Click the extension icon to see upcoming events
- View your WakaTime and HackaTime stats
- Click "Sync Now" to manually sync time tracking
- Configure API keys in extension settings

### Time Tracking

The app automatically syncs time from:
- **WakaTime**: Every 30 minutes (configurable)
- **HackaTime**: Every 30 minutes (configurable)

You can also manually sync by clicking "Sync Time Tracking" button.

### Reminders

- Chrome extension checks for reminders every 5 minutes
- Get desktop notifications for upcoming events
- Reminders are marked as sent automatically

## 🎨 Project Structure

```
event-manager/
├── server/                 # Backend (Node.js/Express)
│   ├── config/            # Configuration files
│   │   ├── cloudinary.js  # Cloudinary setup
│   │   └── database.js    # MongoDB connection
│   ├── server.js          # Main server file
│   ├── package.json       # Dependencies
│   └── .env.example       # Environment template
│
├── client/                # Frontend (HTML/CSS/JS)
│   ├── index.html         # Main page
│   ├── app.js             # Frontend logic
│   └── styles.css         # Styling
│
└── chrome-extension/      # Chrome Extension
    ├── manifest.json      # Extension config
    ├── popup.html         # Extension popup
    ├── popup.js           # Popup logic
    ├── background.js      # Background service worker
    ├── options.html       # Settings page
    ├── options.js         # Settings logic
    └── icons/             # Extension icons
```

## 🔧 API Endpoints

### Events
- `GET /api/events` - Get all events
- `GET /api/events/:id` - Get single event
- `POST /api/events` - Create event
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event
- `GET /api/events/upcoming/list` - Get upcoming events

### Time Tracking
- `GET /api/wakatime/stats` - Get WakaTime stats
- `GET /api/hackatime/stats` - Get HackaTime stats
- `POST /api/time-tracking/sync` - Sync time tracking
- `GET /api/time-tracking/:eventId` - Get event time tracking

### Reminders
- `GET /api/reminders/pending` - Get pending reminders
- `PUT /api/reminders/:eventId/:reminderTime/mark-sent` - Mark reminder as sent

## 🎯 Hack Club Integration

This app is designed for Hack Club Summer Events:

1. **HackaTime Integration**: Automatically track your coding time for Hack Club projects
2. **Event Categories**: Pre-configured for hackathons, workshops, and Hack Club events
3. **Summer Flavor Event**: Perfect for tracking your participation in Hack Club Summer of Making

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

## 📝 License

MIT License - feel free to use this for your own projects!

## 🎉 Acknowledgments

- Hack Club for the amazing community
- WakaTime for time tracking
- HackaTime for Hack Club-specific tracking

## 📧 Support

If you need help:
1. Check the console for errors
2. Make sure all API keys are correct
3. Verify MongoDB is running
4. Check that WakaTime/HackaTime extensions are installed

---

**Happy Hacking! 🚀**

Made with ❤️ for Hack Club Summer Events
