# 🎯 Chrome Extension - Installation Guide

## ✅ Icons Created Successfully!

Your extension now has all required icon files:
- ✅ icon16.png (16x16)
- ✅ icon48.png (48x48)
- ✅ icon128.png (128x128)

## 📦 Load the Extension in Chrome

### Step 1: Open Chrome Extensions Page
```
chrome://extensions/
```
Or: Menu → Extensions → Manage Extensions

### Step 2: Enable Developer Mode
- Toggle "Developer mode" switch (top right corner)

### Step 3: Load the Extension
1. Click **"Load unpacked"** button
2. Navigate to and select this folder:
   ```
   C:\Users\kaart\.vscode\projects\New folder\extension
   ```
3. Click **"Select Folder"**

### Step 4: Verify Installation
- ✅ Extension should appear in the list
- ✅ Name: "Event Manager - Hack Club Edition"
- ✅ Version: 1.0.0
- ✅ No errors in the card

## ⚙️ Configure the Extension

### Connect to Vercel Backend

1. **Click the extension icon** in Chrome toolbar
2. **Right-click** the icon → **Options**
3. **Enter backend URL**:
   ```
   https://event-manager-hackatime-4wjk7rvrp-karthikeyan006867s-projects.vercel.app
   ```
4. **Save settings**

## 🚀 Using the Extension

### Create Quick Event
1. Click extension icon
2. Fill in event details
3. Click "Add Event"

### View Your Stats
1. Click extension icon
2. See today's coding time
3. View upcoming events

### Get Reminders
- Automatic notifications before events
- Sync with HackaTime tracking
- Real-time updates from Vercel backend

## 🔧 Troubleshooting

### Extension Not Loading?
- ✅ Make sure you selected the `extension` folder (not `chrome-extension`)
- ✅ Check that manifest.json exists in the folder
- ✅ Verify all icon files are present

### No Popup Showing?
- Right-click extension icon
- Check for errors in popup
- Verify permissions are granted

### Not Tracking Time?
- Open extension options
- Verify backend URL is correct
- Check browser console for API errors

## 📱 Extension Features

✅ **Event Management**: Create, edit, delete events
✅ **Smart Reminders**: Get notified before events
✅ **HackaTime Integration**: Auto-track coding time
✅ **Offline Support**: Works without internet, syncs later
✅ **Real-time Sync**: Connects to Vercel backend

## 🎨 Extension Icons

The extension uses Hack Club colors:
- 🔴 Red: #ec3750
- 🔵 Blue: #338eda

Icons show a calendar design with event markers.

## 🛠️ Development

To modify the extension:

1. Edit files in `extension/` folder
2. Go to `chrome://extensions/`
3. Click reload icon on the extension card
4. Test your changes

## 📊 What Gets Tracked

All your coding activity is sent to HackaTime:
- ✅ Time spent coding
- ✅ Programming languages
- ✅ Projects worked on
- ✅ Daily streaks
- ✅ Shows up in Hack Club leaderboard

---

**Status**: Ready to install ✅
**Backend**: https://event-manager-hackatime-4wjk7rvrp-karthikeyan006867s-projects.vercel.app
**Icons**: ✅ Created
**Manifest**: ✅ Valid
