const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const Event = require('../models/Event');
const { clearCache } = require('../config/redis');

// Bulk create events
router.post('/bulk-create', 
  authenticateToken,
  body('events').isArray({ min: 1, max: 100 }),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { events } = req.body;
      
      // Add userId to all events
      const eventsWithUser = events.map(event => ({
        ...event,
        userId: req.user.userId,
        createdAt: new Date()
      }));

      const created = await Event.insertMany(eventsWithUser);
      await clearCache('cache:*events*');

      res.status(201).json({
        message: `Successfully created ${created.length} events`,
        count: created.length,
        events: created
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Bulk update events
router.put('/bulk-update',
  authenticateToken,
  body('ids').isArray({ min: 1 }),
  body('updates').isObject(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { ids, updates } = req.body;

      const result = await Event.updateMany(
        { 
          _id: { $in: ids },
          userId: req.user.userId 
        },
        {
          ...updates,
          updatedAt: new Date()
        }
      );

      await clearCache('cache:*events*');

      res.json({
        message: `Updated ${result.modifiedCount} events`,
        modifiedCount: result.modifiedCount,
        matchedCount: result.matchedCount
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Bulk delete events
router.delete('/bulk-delete',
  authenticateToken,
  body('ids').isArray({ min: 1 }),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { ids } = req.body;

      const result = await Event.deleteMany({
        _id: { $in: ids },
        userId: req.user.userId
      });

      await clearCache('cache:*events*');

      res.json({
        message: `Deleted ${result.deletedCount} events`,
        deletedCount: result.deletedCount
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Export events (JSON, CSV)
router.get('/export',
  authenticateToken,
  async (req, res) => {
    try {
      const { format = 'json', startDate, endDate, category } = req.query;

      const query = { userId: req.user.userId };
      if (startDate || endDate) {
        query.startDate = {};
        if (startDate) query.startDate.$gte = new Date(startDate);
        if (endDate) query.startDate.$lte = new Date(endDate);
      }
      if (category) query.category = category;

      const events = await Event.find(query).lean();

      if (format === 'csv') {
        const csv = convertToCSV(events);
        res.header('Content-Type', 'text/csv');
        res.attachment('events.csv');
        return res.send(csv);
      }

      res.header('Content-Type', 'application/json');
      res.attachment('events.json');
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Import events
router.post('/import',
  authenticateToken,
  async (req, res) => {
    try {
      const { events, skipDuplicates = true } = req.body;

      if (!Array.isArray(events)) {
        return res.status(400).json({ message: 'Events must be an array' });
      }

      let imported = 0;
      let skipped = 0;
      const errors = [];

      for (const eventData of events) {
        try {
          if (skipDuplicates) {
            const exists = await Event.findOne({
              userId: req.user.userId,
              title: eventData.title,
              startDate: eventData.startDate
            });

            if (exists) {
              skipped++;
              continue;
            }
          }

          await Event.create({
            ...eventData,
            userId: req.user.userId
          });
          imported++;
        } catch (err) {
          errors.push({ event: eventData.title, error: err.message });
        }
      }

      await clearCache('cache:*events*');

      res.json({
        message: 'Import completed',
        imported,
        skipped,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Batch operations with transactions
router.post('/batch-operations',
  authenticateToken,
  async (req, res) => {
    const session = await Event.startSession();
    session.startTransaction();

    try {
      const { operations } = req.body; // Array of { type, data }
      const results = [];

      for (const op of operations) {
        switch (op.type) {
          case 'create':
            const created = await Event.create([{ ...op.data, userId: req.user.userId }], { session });
            results.push({ type: 'create', id: created[0]._id });
            break;
          
          case 'update':
            await Event.findByIdAndUpdate(op.id, op.data, { session });
            results.push({ type: 'update', id: op.id });
            break;
          
          case 'delete':
            await Event.findByIdAndDelete(op.id, { session });
            results.push({ type: 'delete', id: op.id });
            break;
        }
      }

      await session.commitTransaction();
      await clearCache('cache:*events*');

      res.json({
        message: 'Batch operations completed successfully',
        results
      });
    } catch (error) {
      await session.abortTransaction();
      res.status(500).json({ message: error.message });
    } finally {
      session.endSession();
    }
  }
);

// Advanced filtering and pagination
router.get('/advanced-filter',
  authenticateToken,
  async (req, res) => {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = 'startDate',
        sortOrder = 'asc',
        search,
        categories,
        priorities,
        tags,
        startDate,
        endDate,
        hasReminders,
        isCompleted
      } = req.query;

      const query = { userId: req.user.userId };

      // Search
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      // Categories filter
      if (categories) {
        query.category = { $in: categories.split(',') };
      }

      // Priorities filter
      if (priorities) {
        query.priority = { $in: priorities.split(',') };
      }

      // Tags filter
      if (tags) {
        query.tags = { $in: tags.split(',') };
      }

      // Date range
      if (startDate || endDate) {
        query.startDate = {};
        if (startDate) query.startDate.$gte = new Date(startDate);
        if (endDate) query.startDate.$lte = new Date(endDate);
      }

      // Has reminders
      if (hasReminders !== undefined) {
        query['reminders.0'] = { $exists: hasReminders === 'true' };
      }

      // Completion status
      if (isCompleted !== undefined) {
        query.completed = isCompleted === 'true';
      }

      const total = await Event.countDocuments(query);
      const events = await Event.find(query)
        .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean();

      res.json({
        events,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit),
          limit: parseInt(limit)
        }
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Helper function to convert to CSV
function convertToCSV(events) {
  const headers = ['Title', 'Description', 'Category', 'Priority', 'Start Date', 'End Date', 'Status'];
  const rows = events.map(event => [
    event.title,
    event.description || '',
    event.category || '',
    event.priority || '',
    event.startDate || '',
    event.endDate || '',
    event.completed ? 'Completed' : 'Pending'
  ]);

  return [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
}

module.exports = router;
