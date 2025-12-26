const express = require('express');
const router = express.Router();
const Event = require('../models/Event');

// Get calendar view data
router.get('/calendar', async (req, res) => {
  try {
    const { month, year } = req.query;
    
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const events = await Event.find({
      $or: [
        {
          startDate: { $gte: startDate, $lte: endDate }
        },
        {
          endDate: { $gte: startDate, $lte: endDate }
        },
        {
          startDate: { $lte: startDate },
          endDate: { $gte: endDate }
        }
      ]
    }).sort({ startDate: 1 });

    // Group events by date
    const eventsByDate = {};
    events.forEach(event => {
      const date = event.startDate.toISOString().split('T')[0];
      if (!eventsByDate[date]) {
        eventsByDate[date] = [];
      }
      eventsByDate[date].push(event);
    });

    res.json({
      month,
      year,
      eventsByDate,
      totalEvents: events.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get week view data
router.get('/week', async (req, res) => {
  try {
    const { startDate } = req.query;
    
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);

    const events = await Event.find({
      startDate: { $gte: start, $lt: end }
    }).sort({ startDate: 1 });

    // Group events by day
    const eventsByDay = {};
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      eventsByDay[dateStr] = events.filter(e => 
        e.startDate.toISOString().split('T')[0] === dateStr
      );
    }

    res.json({
      startDate: start,
      endDate: end,
      eventsByDay,
      totalEvents: events.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get day view data
router.get('/day', async (req, res) => {
  try {
    const { date } = req.query;
    
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const events = await Event.find({
      startDate: { $gte: start, $lte: end }
    }).sort({ startDate: 1 });

    // Group events by hour
    const eventsByHour = {};
    for (let i = 0; i < 24; i++) {
      eventsByHour[i] = [];
    }

    events.forEach(event => {
      const hour = event.startDate.getHours();
      eventsByHour[hour].push(event);
    });

    res.json({
      date: start,
      eventsByHour,
      totalEvents: events.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get conflicts (overlapping events)
router.get('/conflicts', async (req, res) => {
  try {
    const events = await Event.find({
      status: { $ne: 'cancelled' }
    }).sort({ startDate: 1 });

    const conflicts = [];

    for (let i = 0; i < events.length; i++) {
      for (let j = i + 1; j < events.length; j++) {
        const event1 = events[i];
        const event2 = events[j];

        if (event1.endDate && event2.startDate) {
          // Check if events overlap
          if (
            event1.startDate < event2.endDate &&
            event1.endDate > event2.startDate
          ) {
            conflicts.push({
              event1: {
                id: event1._id,
                title: event1.title,
                startDate: event1.startDate,
                endDate: event1.endDate
              },
              event2: {
                id: event2._id,
                title: event2.title,
                startDate: event2.startDate,
                endDate: event2.endDate
              }
            });
          }
        }
      }
    }

    res.json(conflicts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
