const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const axios = require('axios');

// AI-powered event suggestion
router.post('/suggest-events', authenticateToken, async (req, res) => {
  try {
    const { userPreferences, pastEvents, timeframe } = req.body;

    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ message: 'AI service not configured' });
    }

    const prompt = `Based on the following user preferences and past events, suggest 5 relevant events for the next ${timeframe}:
    
    Preferences: ${JSON.stringify(userPreferences)}
    Past Events: ${JSON.stringify(pastEvents)}
    
    Respond with JSON array of suggested events with title, category, suggested date, and reasoning.`;

    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const suggestions = JSON.parse(response.data.choices[0].message.content);
    res.json(suggestions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Auto-categorize event
router.post('/categorize', authenticateToken, async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!process.env.OPENAI_API_KEY) {
      // Fallback to rule-based categorization
      const category = simpleCategorize(title, description);
      return res.json({ category, confidence: 0.6, method: 'rule-based' });
    }

    const prompt = `Categorize this event into one of these categories: work, personal, meeting, deadline, social, health, learning, other.
    
    Title: ${title}
    Description: ${description}
    
    Respond with only the category name.`;

    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const category = response.data.choices[0].message.content.trim().toLowerCase();
    res.json({ category, confidence: 0.9, method: 'ai' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Smart scheduling - find best time slot
router.post('/smart-schedule', authenticateToken, async (req, res) => {
  try {
    const { duration, preferredTimeRanges, existingEvents, constraints } = req.body;
    const Event = require('../models/Event');

    // Get user's events
    const events = await Event.find({
      userId: req.user.userId,
      startDate: { $gte: new Date() }
    }).sort({ startDate: 1 });

    // Find free slots
    const freeSlots = findFreeSlots(events, duration, preferredTimeRanges, constraints);

    // Score slots based on preferences
    const scoredSlots = scoreTimeSlots(freeSlots, preferredTimeRanges);

    res.json({
      recommendedSlots: scoredSlots.slice(0, 5),
      totalSlotsFound: scoredSlots.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Conflict detection
router.post('/detect-conflicts', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate, eventId } = req.body;
    const Event = require('../models/Event');

    const conflicts = await Event.find({
      userId: req.user.userId,
      _id: { $ne: eventId },
      $or: [
        { startDate: { $lte: new Date(startDate), $gte: new Date(endDate) } },
        { endDate: { $gte: new Date(startDate), $lte: new Date(endDate) } },
        { startDate: { $gte: new Date(startDate), $lte: new Date(endDate) } }
      ]
    });

    res.json({
      hasConflicts: conflicts.length > 0,
      conflicts: conflicts.map(e => ({
        id: e._id,
        title: e.title,
        startDate: e.startDate,
        endDate: e.endDate,
        priority: e.priority
      }))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Priority scoring based on multiple factors
router.post('/calculate-priority', authenticateToken, async (req, res) => {
  try {
    const { event } = req.body;
    
    let score = 50; // Base score

    // Deadline proximity
    const daysUntil = (new Date(event.startDate) - new Date()) / (1000 * 60 * 60 * 24);
    if (daysUntil < 1) score += 30;
    else if (daysUntil < 3) score += 20;
    else if (daysUntil < 7) score += 10;

    // Category impact
    const categoryScores = {
      deadline: 25,
      meeting: 15,
      work: 15,
      health: 20,
      personal: 5
    };
    score += categoryScores[event.category] || 0;

    // User-defined priority
    if (event.priority === 'high') score += 15;
    else if (event.priority === 'medium') score += 5;

    // Attendees count
    if (event.attendees && event.attendees.length > 5) score += 10;

    // Normalize to 0-100
    score = Math.min(100, Math.max(0, score));

    res.json({
      score,
      level: score >= 80 ? 'urgent' : score >= 60 ? 'high' : score >= 40 ? 'medium' : 'low',
      factors: {
        deadline: daysUntil,
        category: event.category,
        userPriority: event.priority
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Generate smart reminders
router.post('/smart-reminders', authenticateToken, async (req, res) => {
  try {
    const { eventId } = req.body;
    const Event = require('../models/Event');

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const reminders = [];
    const eventDate = new Date(event.startDate);

    // Different reminder strategies based on event type
    if (event.category === 'deadline') {
      reminders.push(
        { time: new Date(eventDate.getTime() - 7 * 24 * 60 * 60 * 1000), message: '1 week before deadline' },
        { time: new Date(eventDate.getTime() - 3 * 24 * 60 * 60 * 1000), message: '3 days before deadline' },
        { time: new Date(eventDate.getTime() - 24 * 60 * 60 * 1000), message: '1 day before deadline' },
        { time: new Date(eventDate.getTime() - 2 * 60 * 60 * 1000), message: '2 hours before deadline' }
      );
    } else if (event.category === 'meeting') {
      reminders.push(
        { time: new Date(eventDate.getTime() - 24 * 60 * 60 * 1000), message: '1 day before meeting' },
        { time: new Date(eventDate.getTime() - 60 * 60 * 1000), message: '1 hour before meeting' },
        { time: new Date(eventDate.getTime() - 15 * 60 * 1000), message: '15 minutes before meeting' }
      );
    } else {
      reminders.push(
        { time: new Date(eventDate.getTime() - 24 * 60 * 60 * 1000), message: '1 day before event' },
        { time: new Date(eventDate.getTime() - 60 * 60 * 1000), message: '1 hour before event' }
      );
    }

    res.json({ reminders: reminders.filter(r => r.time > new Date()) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Helper functions
function simpleCategorize(title, description) {
  const text = `${title} ${description}`.toLowerCase();
  
  if (text.match(/meeting|call|conference|zoom|teams/)) return 'meeting';
  if (text.match(/deadline|due|submit|delivery/)) return 'deadline';
  if (text.match(/work|project|task|job/)) return 'work';
  if (text.match(/doctor|gym|exercise|health|medical/)) return 'health';
  if (text.match(/party|dinner|hangout|friend/)) return 'social';
  if (text.match(/learn|course|study|training/)) return 'learning';
  
  return 'other';
}

function findFreeSlots(events, duration, preferredTimeRanges, constraints) {
  const slots = [];
  const now = new Date();
  const endSearch = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

  // Implementation of slot finding algorithm
  // This is a simplified version
  
  return slots;
}

function scoreTimeSlots(slots, preferences) {
  return slots.map(slot => ({
    ...slot,
    score: calculateSlotScore(slot, preferences)
  })).sort((a, b) => b.score - a.score);
}

function calculateSlotScore(slot, preferences) {
  let score = 50;
  // Add scoring logic based on preferences
  return score;
}

module.exports = router;
