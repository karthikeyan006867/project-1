# WakaTime Integration

Complete WakaTime VS Code extension integration for the Event Manager application.

## Features

- **Automatic Time Tracking**: Tracks coding time automatically in VS Code
- **Heartbeat System**: Sends activity heartbeats to WakaTime API
- **Project Detection**: Automatically detects projects and git branches
- **Language Detection**: Identifies programming languages
- **Dependency Analysis**: Extracts dependencies from code
- **Status Bar Integration**: Shows coding time in VS Code status bar
- **Dashboard Integration**: Quick access to WakaTime dashboard
- **Bulk Heartbeat Support**: Efficient batch processing of heartbeats

## Installation

1. Install dependencies:
```bash
cd wakatime-integration
npm install
```

2. Compile TypeScript:
```bash
npm run compile
```

3. Set up your API key:
   - Open VS Code settings
   - Search for "WakaTime"
   - Enter your API key from https://wakatime.com/settings/account

## Configuration

Available settings in VS Code:

- `wakatime.apiKey`: Your WakaTime API key
- `wakatime.debug`: Enable debug logging
- `wakatime.disabled`: Disable time tracking
- `wakatime.statusBarEnabled`: Show/hide status bar item
- `wakatime.heartbeatInterval`: Time between heartbeats (seconds)
- `wakatime.proxy`: Optional proxy server URL

## Commands

- `WakaTime: Open Dashboard` - Opens WakaTime web dashboard
- `WakaTime: Show Today's Coding Time` - Displays today's stats
- `WakaTime: Enter API Key` - Set or update API key
- `WakaTime: Show Log` - View debug logs

## Architecture

### Core Components

1. **Extension.ts** - Main extension entry point
2. **WakaTimeAPI.ts** - API client for WakaTime
3. **ActivityTracker.ts** - Manages heartbeat queue
4. **ConfigManager.ts** - Configuration management
5. **StatusBar.ts** - Status bar UI component
6. **Logger.ts** - Logging utility
7. **Dependencies.ts** - WakaTime CLI manager

### Event Flow

```
Document Change → Extension → ActivityTracker → API Client → WakaTime Server
      ↓
   Heartbeat Queue
      ↓
  Bulk Flush (1 min)
```

## API Integration

The integration communicates with:

- `https://api.wakatime.com/api/v1/users/current/heartbeats` - Send heartbeats
- `https://api.wakatime.com/api/v1/users/current/summaries` - Get time stats
- `https://api.wakatime.com/api/v1/users/current/stats` - Get detailed stats
- `https://api.wakatime.com/api/v1/users/current/projects` - Get projects

## Development

```bash
# Watch mode for development
npm run watch

# Run linter
npm run lint

# Compile
npm run compile
```

## Integration with Event Manager

This WakaTime integration works seamlessly with the Event Manager:

1. Automatically tracks coding time for events
2. Links projects to events via project name
3. Syncs tracked time to event database
4. Provides analytics for time-tracked events

## License

MIT

## Credits

Based on the official WakaTime VS Code extension:
https://github.com/wakatime/vscode-wakatime
