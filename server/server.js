const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/event-manager', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Event Schema
const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  startDate: { type: Date, required: true },
  endDate: Date,
  category: String,
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  reminders: [{
    time: Date,
    message: String,
    sent: { type: Boolean, default: false }
  }],
  attachments: [{
    url: String,
    publicId: String,
    type: String
  }],
  wakatimeProject: String,
  hackatimeProject: String,
  timeTracked: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Event = mongoose.model('Event', eventSchema);

// Time Tracking Schema
const timeTrackingSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
  source: { type: String, enum: ['wakatime', 'hackatime', 'manual'] },
  duration: Number,
  timestamp: { type: Date, default: Date.now },
  activity: String,
  project: String
});

const TimeTracking = mongoose.model('TimeTracking', timeTrackingSchema);

// Routes

// Get all events
app.get('/api/events', async (req, res) => {
  try {
    const events = await Event.find().sort({ startDate: -1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single event
app.get('/api/events/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create event
app.post('/api/events', async (req, res) => {
  try {
    const event = new Event(req.body);
    const savedEvent = await event.save();
    res.status(201).json(savedEvent);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update event
app.put('/api/events/:id', async (req, res) => {
  try {
    req.body.updatedAt = Date.now();
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.json(event);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete event
app.delete('/api/events/:id', async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get upcoming events
app.get('/api/events/upcoming/list', async (req, res) => {
  try {
    const now = new Date();
    const events = await Event.find({ startDate: { $gte: now } })
      .sort({ startDate: 1 })
      .limit(10);
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get events by category
app.get('/api/events/category/:category', async (req, res) => {
  try {
    const events = await Event.find({ category: req.params.category });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// WakaTime Integration
app.get('/api/wakatime/stats', async (req, res) => {
  try {
    const apiKey = process.env.WAKATIME_API_KEY;
    if (!apiKey) {
      return res.status(400).json({ message: 'WakaTime API key not configured' });
    }

    const response = await axios.get('https://wakatime.com/api/v1/users/current/stats/last_7_days', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// HackaTime Integration
app.get('/api/hackatime/stats', async (req, res) => {
  try {
    const apiKey = process.env.HACKATIME_API_KEY;
    const baseUrl = process.env.HACKATIME_URL || 'https://hackatime.hackclub.com';
    
    if (!apiKey) {
      return res.status(400).json({ message: 'HackaTime API key not configured' });
    }

    const response = await axios.get(`${baseUrl}/api/v1/users/current/stats/last_7_days`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Sync time tracking data
app.post('/api/time-tracking/sync', async (req, res) => {
  try {
    const { eventId, source } = req.body;
    
    let stats;
    if (source === 'wakatime') {
      const apiKey = process.env.WAKATIME_API_KEY;
      const response = await axios.get('https://wakatime.com/api/v1/users/current/stats/last_7_days', {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      stats = response.data;
    } else if (source === 'hackatime') {
      const apiKey = process.env.HACKATIME_API_KEY;
      const baseUrl = process.env.HACKATIME_URL || 'https://hackatime.hackclub.com';
      const response = await axios.get(`${baseUrl}/api/v1/users/current/stats/last_7_days`, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      stats = response.data;
    }

    // Save time tracking data
    const timeTracking = new TimeTracking({
      eventId,
      source,
      duration: stats.data?.total_seconds || 0,
      activity: 'coding',
      project: stats.data?.projects?.[0]?.name || 'unknown'
    });

    await timeTracking.save();

    // Update event's total time tracked
    await Event.findByIdAndUpdate(eventId, {
      $inc: { timeTracked: stats.data?.total_seconds || 0 }
    });

    res.json({ message: 'Time tracking synced successfully', data: timeTracking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get time tracking for an event
app.get('/api/time-tracking/:eventId', async (req, res) => {
  try {
    const tracking = await TimeTracking.find({ eventId: req.params.eventId })
      .sort({ timestamp: -1 });
    res.json(tracking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Upload endpoint for Cloudinary (will be configured later)
app.post('/api/upload', async (req, res) => {
  try {
    // Cloudinary upload logic will be added when credentials are provided
    res.status(501).json({ message: 'Cloudinary integration pending - awaiting credentials' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get reminders that need to be sent
app.get('/api/reminders/pending', async (req, res) => {
  try {
    const now = new Date();
    const events = await Event.find({
      'reminders.time': { $lte: now },
      'reminders.sent': false
    });

    const pendingReminders = [];
    events.forEach(event => {
      event.reminders.forEach(reminder => {
        if (!reminder.sent && new Date(reminder.time) <= now) {
          pendingReminders.push({
            eventId: event._id,
            eventTitle: event.title,
            reminderTime: reminder.time,
            message: reminder.message
          });
        }
      });
    });

    res.json(pendingReminders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark reminder as sent
app.put('/api/reminders/:eventId/:reminderTime/mark-sent', async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const reminder = event.reminders.find(r => 
      new Date(r.time).getTime() === new Date(req.params.reminderTime).getTime()
    );

    if (reminder) {
      reminder.sent = true;
      await event.save();
      res.json({ message: 'Reminder marked as sent' });
    } else {
      res.status(404).json({ message: 'Reminder not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
