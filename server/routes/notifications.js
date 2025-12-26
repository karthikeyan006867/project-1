// Notification and Reminder System
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Event = require('../models/Event');

// In-memory notification queue (in production, use Redis or RabbitMQ)
const notificationQueue = [];

// Get all upcoming reminders
router.get('/upcoming', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json([]);
    }

    const now = new Date();
    const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const events = await Event.find({
      startDate: { $gte: now, $lte: next24Hours },
      'reminders.0': { $exists: true }
    }).sort({ startDate: 1 });

    const upcomingReminders = [];
    
    for (const event of events) {
      for (const reminder of event.reminders) {
        const reminderTime = new Date(event.startDate.getTime() - reminder.minutesBefore * 60 * 1000);
        
        if (reminderTime >= now && reminderTime <= next24Hours) {
          upcomingReminders.push({
            eventId: event._id,
            eventTitle: event.title,
            eventStartDate: event.startDate,
            reminderTime: reminderTime,
            type: reminder.type,
            message: reminder.message || `${event.title} starts in ${reminder.minutesBefore} minutes`
          });
        }
      }
    }

    res.json(upcomingReminders.sort((a, b) => a.reminderTime - b.reminderTime));
  } catch (error) {
    console.error('Error getting upcoming reminders:', error);
    res.status(500).json({ message: error.message });
  }
});

// Send notification
router.post('/send', async (req, res) => {
  try {
    const { eventId, type, message, channel } = req.body;
    
    const notification = {
      id: Date.now().toString(),
      eventId,
      type,
      message,
      channel: channel || 'browser',
      sentAt: new Date(),
      status: 'sent'
    };
    
    notificationQueue.push(notification);
    
    // In production, integrate with:
    // - Web Push API
    // - Email service (SendGrid, AWS SES)
    // - SMS service (Twilio)
    // - Slack/Discord webhooks
    
    res.json({ success: true, notification });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get notification history
router.get('/history', (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    
    const history = notificationQueue
      .slice(-limit - offset, -offset || undefined)
      .reverse();
    
    res.json({
      notifications: history,
      total: notificationQueue.length
    });
  } catch (error) {
    console.error('Error getting notification history:', error);
    res.status(500).json({ message: error.message });
  }
});

// Configure notification preferences
router.post('/preferences', async (req, res) => {
  try {
    const { userId, preferences } = req.body;
    
    // Store in UserSettings model
    const settings = {
      userId,
      notifications: {
        email: preferences.email || false,
        browser: preferences.browser !== false,
        sms: preferences.sms || false,
        slack: preferences.slack || false,
        discord: preferences.discord || false,
        defaultReminderMinutes: preferences.defaultReminderMinutes || [30, 60],
        quiet: {
          enabled: preferences.quietHours?.enabled || false,
          start: preferences.quietHours?.start || '22:00',
          end: preferences.quietHours?.end || '08:00'
        }
      },
      updatedAt: new Date()
    };
    
    res.json({ success: true, settings });
  } catch (error) {
    console.error('Error saving notification preferences:', error);
    res.status(500).json({ message: error.message });
  }
});

// Snooze notification
router.post('/snooze', async (req, res) => {
  try {
    const { notificationId, snoozeMinutes } = req.body;
    
    const notification = notificationQueue.find(n => n.id === notificationId);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    const snoozedNotification = {
      ...notification,
      id: Date.now().toString(),
      snoozedUntil: new Date(Date.now() + snoozeMinutes * 60 * 1000),
      status: 'snoozed'
    };
    
    notificationQueue.push(snoozedNotification);
    
    res.json({ success: true, notification: snoozedNotification });
  } catch (error) {
    console.error('Error snoozing notification:', error);
    res.status(500).json({ message: error.message });
  }
});

// Dismiss notification
router.delete('/:id', (req, res) => {
  try {
    const index = notificationQueue.findIndex(n => n.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    notificationQueue[index].status = 'dismissed';
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error dismissing notification:', error);
    res.status(500).json({ message: error.message });
  }
});

// Check for due notifications (polling endpoint)
router.get('/check', async (req, res) => {
  try {
    const now = new Date();
    
    const dueNotifications = notificationQueue.filter(n => 
      n.status === 'snoozed' && 
      n.snoozedUntil && 
      new Date(n.snoozedUntil) <= now
    );
    
    dueNotifications.forEach(n => n.status = 'pending');
    
    res.json({ notifications: dueNotifications });
  } catch (error) {
    console.error('Error checking notifications:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
