const express = require('express');
const router = express.Router();
const Event = require('../models/Event');

// Advanced search with multiple criteria
router.post('/search', async (req, res) => {
  try {
    const {
      query,
      category,
      priority,
      status,
      dateFrom,
      dateTo,
      tags,
      minTimeTracked,
      maxTimeTracked,
      sortBy = 'startDate',
      sortOrder = 'desc',
      limit = 50,
      page = 1
    } = req.body;

    const filter = {};

    // Text search
    if (query) {
      filter.$text = { $search: query };
    }

    // Category filter
    if (category && category !== 'all') {
      filter.category = category;
    }

    // Priority filter
    if (priority && priority !== 'all') {
      filter.priority = priority;
    }

    // Status filter
    if (status && status !== 'all') {
      filter.status = status;
    }

    // Date range filter
    if (dateFrom || dateTo) {
      filter.startDate = {};
      if (dateFrom) filter.startDate.$gte = new Date(dateFrom);
      if (dateTo) filter.startDate.$lte = new Date(dateTo);
    }

    // Tags filter
    if (tags && tags.length > 0) {
      filter.tags = { $in: tags };
    }

    // Time tracked filter
    if (minTimeTracked !== undefined || maxTimeTracked !== undefined) {
      filter.timeTracked = {};
      if (minTimeTracked !== undefined) {
        filter.timeTracked.$gte = minTimeTracked * 3600; // Convert hours to seconds
      }
      if (maxTimeTracked !== undefined) {
        filter.timeTracked.$lte = maxTimeTracked * 3600;
      }
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute search
    const events = await Event.find(filter)
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
      .limit(limit)
      .skip(skip);

    const total = await Event.countDocuments(filter);

    res.json({
      events,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get filter options (for UI dropdowns)
router.get('/filter-options', async (req, res) => {
  try {
    const categories = await Event.distinct('category');
    const priorities = ['low', 'medium', 'high'];
    const statuses = ['planned', 'in-progress', 'completed', 'cancelled'];
    const tags = await Event.distinct('tags');

    res.json({
      categories,
      priorities,
      statuses,
      tags: tags.filter(t => t) // Remove null/empty tags
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Autocomplete suggestions
router.get('/autocomplete', async (req, res) => {
  try {
    const { field, query } = req.query;
    
    if (!field || !query) {
      return res.status(400).json({ message: 'Field and query required' });
    }

    let suggestions = [];

    switch (field) {
      case 'title':
        const titleEvents = await Event.find({
          title: { $regex: query, $options: 'i' }
        }).select('title').limit(10);
        suggestions = titleEvents.map(e => e.title);
        break;

      case 'tags':
        const allTags = await Event.distinct('tags');
        suggestions = allTags.filter(tag => 
          tag && tag.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 10);
        break;

      case 'location':
        const locations = await Event.distinct('location');
        suggestions = locations.filter(loc => 
          loc && loc.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 10);
        break;

      default:
        return res.status(400).json({ message: 'Invalid field' });
    }

    res.json(suggestions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Bulk operations
router.post('/bulk', async (req, res) => {
  try {
    const { operation, eventIds, data } = req.body;
    
    if (!operation || !eventIds || !Array.isArray(eventIds)) {
      return res.status(400).json({ message: 'Invalid bulk operation request' });
    }

    let result;

    switch (operation) {
      case 'delete':
        result = await Event.deleteMany({ _id: { $in: eventIds } });
        break;

      case 'update':
        result = await Event.updateMany(
          { _id: { $in: eventIds } },
          { $set: data }
        );
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

      case 'updateStatus':
        result = await Event.updateMany(
          { _id: { $in: eventIds } },
          { $set: { status: data.status } }
        );
        break;

      case 'addTags':
        result = await Event.updateMany(
          { _id: { $in: eventIds } },
          { $addToSet: { tags: { $each: data.tags } } }
        );
        break;

      default:
        return res.status(400).json({ message: 'Invalid operation' });
    }

    res.json({
      message: 'Bulk operation completed',
      affected: result.modifiedCount || result.deletedCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get similar events (based on title/description/tags)
router.get('/similar/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Find similar events based on category and tags
    const similar = await Event.find({
      _id: { $ne: event._id },
      $or: [
        { category: event.category },
        { tags: { $in: event.tags } },
        { priority: event.priority }
      ]
    }).limit(5);

    res.json(similar);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
