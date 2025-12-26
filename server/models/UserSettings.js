const mongoose = require('mongoose');

const userSettingsSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    default: 'default-user'
  },
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'light'
    },
    defaultView: {
      type: String,
      enum: ['calendar', 'list', 'kanban'],
      default: 'list'
    },
    dateFormat: {
      type: String,
      default: 'MM/DD/YYYY'
    },
    timeFormat: {
      type: String,
      enum: ['12h', '24h'],
      default: '12h'
    },
    defaultEventDuration: {
      type: Number,
      default: 60 // minutes
    },
    defaultReminder: {
      type: Number,
      default: 60 // minutes before event
    }
  },
  notifications: {
    enabled: {
      type: Boolean,
      default: true
    },
    email: {
      enabled: { type: Boolean, default: false },
      address: String
    },
    desktop: {
      enabled: { type: Boolean, default: true },
      sound: { type: Boolean, default: true }
    },
    reminderTimes: [{
      type: Number // minutes before event
    }]
  },
  integrations: {
    wakatime: {
      enabled: { type: Boolean, default: false },
      apiKey: String,
      syncInterval: { type: Number, default: 30 }, // minutes
      lastSync: Date
    },
    hackatime: {
      enabled: { type: Boolean, default: false },
      apiKey: String,
      apiUrl: { type: String, default: 'https://hackatime.hackclub.com' },
      syncInterval: { type: Number, default: 30 },
      lastSync: Date
    },
    cloudinary: {
      enabled: { type: Boolean, default: false },
      cloudName: String,
      apiKey: String,
      apiSecret: String
    }
  },
  goals: {
    dailyHours: { type: Number, default: 4 },
    weeklyHours: { type: Number, default: 25 },
    monthlyHours: { type: Number, default: 100 },
    yearlyEvents: { type: Number, default: 50 }
  },
  display: {
    compactMode: { type: Boolean, default: false },
    showCompletedEvents: { type: Boolean, default: true },
    showTimeTracking: { type: Boolean, default: true },
    showAnalytics: { type: Boolean, default: true },
    eventsPerPage: { type: Number, default: 10 }
  },
  privacy: {
    shareStats: { type: Boolean, default: false },
    publicProfile: { type: Boolean, default: false },
    showActivity: { type: Boolean, default: true }
  },
  backup: {
    autoBackup: { type: Boolean, default: true },
    backupInterval: { type: Number, default: 7 }, // days
    lastBackup: Date,
    retentionDays: { type: Number, default: 30 }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save hook
userSettingsSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Static method to get or create settings
userSettingsSchema.statics.getOrCreate = async function(userId = 'default-user') {
  let settings = await this.findOne({ userId });
  if (!settings) {
    settings = await this.create({ userId });
  }
  return settings;
};

module.exports = mongoose.model('UserSettings', userSettingsSchema);
