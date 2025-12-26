// Advanced Event Scheduling System
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Event = require('../models/Event');

// Get recurring event instances
router.get('/recurring/:id/instances', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json([]);
    }

    const event = await Event.findById(req.params.id);
    if (!event || !event.recurring.enabled) {
      return res.status(404).json({ message: 'Recurring event not found' });
    }

    const { startDate, endDate } = req.query;
    const instances = generateRecurringInstances(
      event,
      new Date(startDate),
      new Date(endDate)
    );

    res.json(instances);
  } catch (error) {
    console.error('Error getting recurring instances:', error);
    res.status(500).json({ message: error.message });
  }
});

// Detect scheduling conflicts
router.post('/conflicts', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({ hasConflicts: false, conflicts: [] });
    }

    const { startDate, endDate, excludeEventId } = req.body;
    
    const query = {
      $or: [
        {
          startDate: { $lte: new Date(endDate) },
          endDate: { $gte: new Date(startDate) }
        }
      ]
    };

    if (excludeEventId) {
      query._id = { $ne: excludeEventId };
    }

    const conflicts = await Event.find(query);
    
    res.json({
      hasConflicts: conflicts.length > 0,
      conflicts: conflicts.map(e => ({
        id: e._id,
        title: e.title,
        startDate: e.startDate,
        endDate: e.endDate,
        category: e.category
      }))
    });
  } catch (error) {
    console.error('Error detecting conflicts:', error);
    res.status(500).json({ message: error.message });
  }
});

// Smart scheduling suggestions
router.post('/suggest-time', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({ suggestions: [] });
    }

    const { duration, preferredDays, preferredHours, category } = req.body;
    
    // Find busy times
    const busyEvents = await Event.find({
      startDate: { $gte: new Date() },
      endDate: { $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }
    }).sort({ startDate: 1 });

    const suggestions = findAvailableSlots(
      busyEvents,
      duration,
      preferredDays,
      preferredHours
    );

    res.json({ suggestions: suggestions.slice(0, 5) });
  } catch (error) {
    console.error('Error suggesting time:', error);
    res.status(500).json({ message: error.message });
  }
});

// Batch event operations
router.post('/batch', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Database not connected' });
    }

    const { operation, eventIds, data } = req.body;
    let result;

    switch (operation) {
      case 'delete':
        result = await Event.deleteMany({ _id: { $in: eventIds } });
        break;
      case 'updateCategory':
        result = await Event.updateMany(
          { _id: { $in: eventIds } },
          { $set: { category: data.category } }
        );
        break;
      case 'updatePriority':
        result = await Event.updateMany(
          { _id: { $in: eventIds } },
          { $set: { priority: data.priority } }
        );
        break;
      case 'archive':
        result = await Event.updateMany(
          { _id: { $in: eventIds } },
          { $set: { status: 'archived' } }
        );
        break;
      default:
        return res.status(400).json({ message: 'Invalid operation' });
    }

    res.json({ success: true, modified: result.modifiedCount || result.deletedCount });
  } catch (error) {
    console.error('Error in batch operation:', error);
    res.status(500).json({ message: error.message });
  }
});

// Helper: Generate recurring instances
function generateRecurringInstances(event, startRange, endRange) {
  const instances = [];
  const { frequency, interval, endDate } = event.recurring;
  
  let currentDate = new Date(event.startDate);
  const maxDate = endDate ? new Date(endDate) : endRange;
  
  while (currentDate <= maxDate && currentDate <= endRange) {
    if (currentDate >= startRange) {
      instances.push({
        title: event.title,
        startDate: new Date(currentDate),
        endDate: new Date(currentDate.getTime() + (event.endDate - event.startDate)),
        originalEventId: event._id,
        isRecurring: true
      });
    }
    
    // Calculate next occurrence
    switch (frequency) {
      case 'daily':
        currentDate.setDate(currentDate.getDate() + interval);
        break;
      case 'weekly':
        currentDate.setDate(currentDate.getDate() + (7 * interval));
        break;
      case 'monthly':
        currentDate.setMonth(currentDate.getMonth() + interval);
        break;
      case 'yearly':
        currentDate.setFullYear(currentDate.getFullYear() + interval);
        break;
    }
  }
  
  return instances;
}

// Helper: Find available time slots
function findAvailableSlots(busyEvents, duration, preferredDays, preferredHours) {
  const slots = [];
  const now = new Date();
  const durationMs = duration * 60 * 1000;
  
  for (let day = 0; day < 30; day++) {
    const checkDate = new Date(now);
    checkDate.setDate(checkDate.getDate() + day);
    
    const dayOfWeek = checkDate.getDay();
    if (preferredDays && !preferredDays.includes(dayOfWeek)) {
      continue;
    }
    
    for (let hour of (preferredHours || [9, 10, 11, 13, 14, 15, 16])) {
      const slotStart = new Date(checkDate);
      slotStart.setHours(hour, 0, 0, 0);
      const slotEnd = new Date(slotStart.getTime() + durationMs);
      
      const hasConflict = busyEvents.some(event => 
        (slotStart < new Date(event.endDate) && slotEnd > new Date(event.startDate))
      );
      
      if (!hasConflict && slotStart > now) {
        slots.push({
          startDate: slotStart,
          endDate: slotEnd,
          score: calculateSlotScore(slotStart, preferredHours)
        });
      }
    }
  }
  
  return slots.sort((a, b) => b.score - a.score);
}

// Helper: Score time slots
function calculateSlotScore(date, preferredHours) {
  let score = 100;
  const hour = date.getHours();
  const dayOfWeek = date.getDay();
  
  if (preferredHours && preferredHours.includes(hour)) {
    score += 50;
  }
  
  if (dayOfWeek >= 1 && dayOfWeek <= 5) {
    score += 30;
  }
  
  if (hour >= 9 && hour <= 17) {
    score += 20;
  }
  
  return score;
}

module.exports = router;
