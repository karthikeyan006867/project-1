// Collaboration and Team Features
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Event = require('../models/Event');

// Share event with team members
router.post('/events/:id/share', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Database not connected' });
    }

    const { userIds, permissions } = req.body;
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const sharedWith = userIds.map(userId => ({
      userId,
      permissions: permissions || ['view'],
      sharedAt: new Date()
    }));

    event.collaborators = [...(event.collaborators || []), ...sharedWith];
    await event.save();

    res.json({ success: true, event });
  } catch (error) {
    console.error('Error sharing event:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get team calendar (aggregate all team events)
router.get('/team/calendar', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({ events: [] });
    }

    const { teamId, startDate, endDate } = req.query;
    
    // In production, query by team membership
    const events = await Event.find({
      startDate: { $gte: new Date(startDate) },
      endDate: { $lte: new Date(endDate) },
      // 'collaborators.userId': { $in: teamMembers }
    }).sort({ startDate: 1 });

    const teamCalendar = events.map(event => ({
      ...event.toObject(),
      isShared: (event.collaborators || []).length > 0,
      collaboratorCount: (event.collaborators || []).length
    }));

    res.json({ events: teamCalendar });
  } catch (error) {
    console.error('Error getting team calendar:', error);
    res.status(500).json({ message: error.message });
  }
});

// Add comment to event
router.post('/events/:id/comments', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Database not connected' });
    }

    const { userId, userName, text } = req.body;
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const comment = {
      id: Date.now().toString(),
      userId,
      userName,
      text,
      createdAt: new Date(),
      reactions: []
    };

    event.comments = [...(event.comments || []), comment];
    await event.save();

    res.json({ success: true, comment });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update event attendance
router.post('/events/:id/attendance', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Database not connected' });
    }

    const { userId, userName, status } = req.body;
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    event.attendees = event.attendees || [];
    const existingIndex = event.attendees.findIndex(a => a.userId === userId);
    
    if (existingIndex >= 0) {
      event.attendees[existingIndex].status = status;
    } else {
      event.attendees.push({
        userId,
        userName,
        status,
        respondedAt: new Date()
      });
    }

    await event.save();

    res.json({ 
      success: true, 
      attendees: event.attendees,
      stats: {
        going: event.attendees.filter(a => a.status === 'going').length,
        maybe: event.attendees.filter(a => a.status === 'maybe').length,
        declined: event.attendees.filter(a => a.status === 'declined').length
      }
    });
  } catch (error) {
    console.error('Error updating attendance:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get collaboration activity feed
router.get('/activity', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({ activities: [] });
    }

    const { teamId, limit = 50 } = req.query;
    
    // In production, track all collaboration activities
    const activities = [
      {
        id: '1',
        type: 'comment',
        userId: 'user1',
        userName: 'John Doe',
        eventId: 'evt1',
        eventTitle: 'Team Meeting',
        message: 'Added a comment',
        timestamp: new Date()
      },
      {
        id: '2',
        type: 'share',
        userId: 'user2',
        userName: 'Jane Smith',
        eventId: 'evt2',
        eventTitle: 'Project Launch',
        message: 'Shared event with team',
        timestamp: new Date()
      }
    ];

    res.json({ activities: activities.slice(0, limit) });
  } catch (error) {
    console.error('Error getting activity feed:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
