const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const TimeTracking = require('../models/TimeTracking');
const UserSettings = require('../models/UserSettings');

// Export all data to JSON
router.get('/export/json', async (req, res) => {
  try {
    const events = await Event.find({});
    const timeTrackings = await TimeTracking.find({});
    const settings = await UserSettings.findOne({ userId: 'default-user' });

    const exportData = {
      exportDate: new Date().toISOString(),
      version: '1.0.0',
      data: {
        events,
        timeTrackings,
        settings
      },
      stats: {
        totalEvents: events.length,
        totalTimeTrackings: timeTrackings.length
      }
    };

    res.json(exportData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Export events to CSV
router.get('/export/csv', async (req, res) => {
  try {
    const events = await Event.find({});
    
    let csv = 'Title,Description,Start Date,End Date,Category,Priority,Status,Time Tracked (hours)\n';
    
    events.forEach(event => {
      csv += `"${event.title}",`;
      csv += `"${event.description || ''}",`;
      csv += `"${event.startDate}",`;
      csv += `"${event.endDate || ''}",`;
      csv += `"${event.category}",`;
      csv += `"${event.priority}",`;
      csv += `"${event.status}",`;
      csv += `"${(event.timeTracked / 3600).toFixed(2)}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=events-export.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Import events from JSON
router.post('/import/json', async (req, res) => {
  try {
    const { data, options = {} } = req.body;
    
    if (!data || !data.events) {
      return res.status(400).json({ message: 'Invalid import data' });
    }

    const results = {
      imported: 0,
      skipped: 0,
      errors: []
    };

    for (const eventData of data.events) {
      try {
        // Remove _id to create new documents
        delete eventData._id;
        
        // Check for duplicates if specified
        if (options.checkDuplicates) {
          const existing = await Event.findOne({
            title: eventData.title,
            startDate: eventData.startDate
          });
          
          if (existing) {
            results.skipped++;
            continue;
          }
        }

        const event = new Event(eventData);
        await event.save();
        results.imported++;
      } catch (error) {
        results.errors.push({
          event: eventData.title,
          error: error.message
        });
      }
    }

    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Backup all data
router.post('/backup/create', async (req, res) => {
  try {
    const events = await Event.find({});
    const timeTrackings = await TimeTracking.find({});
    const settings = await UserSettings.findOne({ userId: 'default-user' });

    const backup = {
      createdAt: new Date(),
      version: '1.0.0',
      dataVersion: 1,
      data: {
        events: events.map(e => e.toObject()),
        timeTrackings: timeTrackings.map(t => t.toObject()),
        settings: settings ? settings.toObject() : null
      }
    };

    // In production, you'd save this to cloud storage
    // For now, we'll just return it
    res.json({
      message: 'Backup created successfully',
      backup,
      size: JSON.stringify(backup).length
    });

    // Update last backup time in settings
    if (settings) {
      settings.backup.lastBackup = new Date();
      await settings.save();
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Restore from backup
router.post('/backup/restore', async (req, res) => {
  try {
    const { backup, options = {} } = req.body;
    
    if (!backup || !backup.data) {
      return res.status(400).json({ message: 'Invalid backup data' });
    }

    const results = {
      events: { imported: 0, skipped: 0 },
      timeTrackings: { imported: 0, skipped: 0 },
      settings: { updated: false }
    };

    // Clear existing data if requested
    if (options.clearExisting) {
      await Event.deleteMany({});
      await TimeTracking.deleteMany({});
    }

    // Restore events
    for (const eventData of backup.data.events) {
      delete eventData._id;
      const event = new Event(eventData);
      await event.save();
      results.events.imported++;
    }

    // Restore time trackings
    for (const trackingData of backup.data.timeTrackings) {
      delete trackingData._id;
      const tracking = new TimeTracking(trackingData);
      await tracking.save();
      results.timeTrackings.imported++;
    }

    // Restore settings
    if (backup.data.settings) {
      await UserSettings.findOneAndUpdate(
        { userId: 'default-user' },
        backup.data.settings,
        { upsert: true }
      );
      results.settings.updated = true;
    }

    res.json({
      message: 'Backup restored successfully',
      results
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get backup history
router.get('/backup/history', async (req, res) => {
  try {
    const settings = await UserSettings.findOne({ userId: 'default-user' });
    
    res.json({
      lastBackup: settings?.backup?.lastBackup || null,
      autoBackupEnabled: settings?.backup?.autoBackup || false,
      backupInterval: settings?.backup?.backupInterval || 7,
      retentionDays: settings?.backup?.retentionDays || 30
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
