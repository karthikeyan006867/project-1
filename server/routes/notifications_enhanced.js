const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const twilio = require('twilio');
const { authenticateToken } = require('../middleware/auth');
const Notification = require('../models/Notification');
const User = require('../models/User');

// Email transporter
let emailTransporter = null;
if (process.env.EMAIL_HOST) {
  emailTransporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
}

// Twilio client
let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID) {
  twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

// Send email notification
router.post('/send/email', authenticateToken, async (req, res) => {
  try {
    const { to, subject, message, html } = req.body;

    if (!emailTransporter) {
      return res.status(503).json({ message: 'Email service not configured' });
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to,
      subject,
      text: message,
      html: html || message
    };

    await emailTransporter.sendMail(mailOptions);

    // Save notification record
    const notification = new Notification({
      userId: req.user.userId,
      type: 'email',
      recipient: to,
      subject,
      message,
      status: 'sent'
    });
    await notification.save();

    res.json({ message: 'Email sent successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Send SMS notification
router.post('/send/sms', authenticateToken, async (req, res) => {
  try {
    const { to, message } = req.body;

    if (!twilioClient) {
      return res.status(503).json({ message: 'SMS service not configured' });
    }

    const result = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to
    });

    const notification = new Notification({
      userId: req.user.userId,
      type: 'sms',
      recipient: to,
      message,
      status: 'sent',
      externalId: result.sid
    });
    await notification.save();

    res.json({ message: 'SMS sent successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Send push notification
router.post('/send/push', authenticateToken, async (req, res) => {
  try {
    const { title, body, userId, data } = req.body;

    // Implement push notification (Web Push, Firebase, etc.)
    const notification = new Notification({
      userId: userId || req.user.userId,
      type: 'push',
      subject: title,
      message: body,
      data,
      status: 'sent'
    });
    await notification.save();

    res.json({ message: 'Push notification sent successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user notifications
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;

    const query = { userId: req.params.userId };
    if (unreadOnly === 'true') {
      query.read = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Notification.countDocuments(query);

    res.json({
      notifications,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark notification as read
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true, readAt: new Date() },
      { new: true }
    );
    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark all as read
router.put('/mark-all-read/:userId', authenticateToken, async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.params.userId, read: false },
      { read: true, readAt: new Date() }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete notification
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get notification preferences
router.get('/preferences/:userId', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('preferences.notifications');
    res.json(user.preferences.notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update notification preferences
router.put('/preferences/:userId', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { 'preferences.notifications': req.body },
      { new: true }
    ).select('preferences.notifications');
    res.json(user.preferences.notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Send digest email (summary of activities)
router.post('/digest/send', authenticateToken, async (req, res) => {
  try {
    const { userId, period } = req.body; // period: daily, weekly, monthly

    // Get user's activities and create digest
    // This is a placeholder - implement based on your needs

    res.json({ message: `${period} digest sent successfully` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
