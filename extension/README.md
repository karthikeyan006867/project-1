# Chrome Extension - Event Manager

## 🎯 Quick Start

Your Chrome extension has been organized in the `extension/` folder!

### 📦 What's Inside

```
extension/
├── manifest.json        # Extension configuration (Manifest V3)
├── popup.html          # Extension popup interface
├── popup.js            # Popup functionality
├── background.js       # Service worker for background tasks
├── options.html        # Settings page
├── options.js          # Settings functionality
└── icons/              # Extension icons
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

### 🚀 Install the Extension

1. **Open Chrome Extensions**:
   - Go to `chrome://extensions/`
   - Enable "Developer mode" (top right)

2. **Load Extension**:
   - Click "Load unpacked"
   - Select the `extension/` folder
   - The extension will be installed!

3. **Pin the Extension**:
   - Click the puzzle icon in Chrome toolbar
   - Pin "Event Manager" for quick access

### ✨ Features

- **Quick Event Creation**: Click the extension icon to add events instantly
- **Smart Reminders**: Get notifications before events start
- **Continuous Tracking**: Automatically track your coding time
- **Real-time Sync**: Syncs with your Vercel-deployed backend
- **HackaTime Integration**: All activity tracked to Hack Club

### ⚙️ Configure the Extension

1. Right-click the extension icon
2. Click "Options"
3. Enter your backend URL:
   ```
   https://event-manager-hackatime-4wjk7rvrp-karthikeyan006867s-projects.vercel.app
   ```
4. Save settings

### 🔧 Backend Connection

The extension connects to your deployed Vercel backend:
- **API Endpoint**: https://event-manager-hackatime-4wjk7rvrp-karthikeyan006867s-projects.vercel.app/api
- **Auto-sync**: Every 5 minutes
- **Offline Support**: Works offline, syncs when online

### 📊 What Gets Tracked

- ✅ Time spent on events
- ✅ Coding sessions
- ✅ Project names
- ✅ Programming languages used
- ✅ All sent to HackaTime for Hack Club leaderboard

### 🛠️ Development

To modify the extension:

1. **Edit Files**: Make changes in `extension/` folder
2. **Reload Extension**:
   - Go to `chrome://extensions/`
   - Click the reload icon on your extension
3. **Test**: Open the popup or check background logs

### 📝 Permissions Used

The extension requests these permissions:
- `storage`: Save settings locally
- `alarms`: Schedule reminders
- `notifications`: Show event alerts
- `activeTab`: Track current tab activity
- `tabs`: Monitor coding time
- `webRequest`: Track API calls

### 🎨 Customization

Customize the extension in [manifest.json](extension/manifest.json):
- Change name, description, version
- Add/remove permissions
- Modify icon paths

### 🐛 Debugging

View extension logs:
1. Go to `chrome://extensions/`
2. Click "Inspect views: background page"
3. Check console for errors/logs

### 📱 Usage Tips

**Quick Event**:
1. Click extension icon
2. Fill in event details
3. Click "Add Event"

**Check Stats**:
1. Click extension icon
2. View today's coding time
3. See upcoming events

**Manage Reminders**:
1. Right-click extension → Options
2. Configure notification timing
3. Set quiet hours

---

**Extension Type**: Manifest V3
**Permissions**: Storage, Alarms, Notifications, Tabs
**Backend**: Vercel (https://event-manager-hackatime-4wjk7rvrp-karthikeyan006867s-projects.vercel.app)
**Tracking**: HackaTime API (Hack Club)
