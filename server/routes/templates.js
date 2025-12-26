// Templates and Quick Event Creation
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Predefined event templates
const defaultTemplates = [
  {
    id: 'daily-standup',
    name: 'Daily Standup',
    category: 'meeting',
    duration: 15,
    priority: 'medium',
    description: 'Quick team sync to discuss progress and blockers',
    defaultReminders: [5, 15],
    tags: ['team', 'agile', 'standup'],
    recurring: { enabled: true, frequency: 'daily', interval: 1 }
  },
  {
    id: 'sprint-planning',
    name: 'Sprint Planning',
    category: 'meeting',
    duration: 120,
    priority: 'high',
    description: 'Plan tasks and goals for the upcoming sprint',
    defaultReminders: [30, 60],
    tags: ['team', 'agile', 'planning'],
    recurring: { enabled: true, frequency: 'weekly', interval: 2 }
  },
  {
    id: 'code-review',
    name: 'Code Review Session',
    category: 'work',
    duration: 60,
    priority: 'medium',
    description: 'Review pull requests and provide feedback',
    defaultReminders: [15],
    tags: ['development', 'review', 'code']
  },
  {
    id: 'hackathon',
    name: 'Hackathon Event',
    category: 'event',
    duration: 480,
    priority: 'high',
    description: 'Build amazing projects in a time-limited challenge',
    defaultReminders: [1440, 60],
    tags: ['hackclub', 'coding', 'competition']
  },
  {
    id: 'learning-session',
    name: 'Learning Session',
    category: 'personal',
    duration: 90,
    priority: 'medium',
    description: 'Dedicated time for learning new technologies',
    defaultReminders: [30],
    tags: ['learning', 'development', 'growth']
  },
  {
    id: 'deep-work',
    name: 'Deep Work Block',
    category: 'work',
    duration: 180,
    priority: 'high',
    description: 'Focused, uninterrupted time for complex tasks',
    defaultReminders: [15],
    tags: ['productivity', 'focus', 'deep-work']
  }
];

// Get all templates
router.get('/', (req, res) => {
  try {
    const { category, tags } = req.query;
    
    let templates = [...defaultTemplates];
    
    if (category) {
      templates = templates.filter(t => t.category === category);
    }
    
    if (tags) {
      const tagArray = tags.split(',');
      templates = templates.filter(t => 
        t.tags.some(tag => tagArray.includes(tag))
      );
    }
    
    res.json({ templates });
  } catch (error) {
    console.error('Error getting templates:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get single template
router.get('/:id', (req, res) => {
  try {
    const template = defaultTemplates.find(t => t.id === req.params.id);
    
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }
    
    res.json({ template });
  } catch (error) {
    console.error('Error getting template:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create event from template
router.post('/:id/create', async (req, res) => {
  try {
    const template = defaultTemplates.find(t => t.id === req.params.id);
    
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }
    
    const { startDate, customTitle, customDescription } = req.body;
    
    const event = {
      title: customTitle || template.name,
      description: customDescription || template.description,
      category: template.category,
      priority: template.priority,
      startDate: new Date(startDate),
      endDate: new Date(new Date(startDate).getTime() + template.duration * 60 * 1000),
      reminders: template.defaultReminders.map(minutes => ({
        type: 'browser',
        minutesBefore: minutes,
        enabled: true
      })),
      tags: template.tags,
      recurring: template.recurring || { enabled: false },
      templateId: template.id,
      createdAt: new Date()
    };
    
    res.status(201).json({ success: true, event });
  } catch (error) {
    console.error('Error creating event from template:', error);
    res.status(500).json({ message: error.message });
  }
});

// Save custom template
router.post('/custom', (req, res) => {
  try {
    const { name, category, duration, priority, description, tags, recurring } = req.body;
    
    const customTemplate = {
      id: `custom-${Date.now()}`,
      name,
      category,
      duration,
      priority,
      description,
      tags: tags || [],
      recurring: recurring || { enabled: false },
      isCustom: true,
      createdAt: new Date()
    };
    
    // In production, save to database
    defaultTemplates.push(customTemplate);
    
    res.status(201).json({ success: true, template: customTemplate });
  } catch (error) {
    console.error('Error saving custom template:', error);
    res.status(500).json({ message: error.message });
  }
});

// Delete custom template
router.delete('/custom/:id', (req, res) => {
  try {
    const index = defaultTemplates.findIndex(t => 
      t.id === req.params.id && t.isCustom
    );
    
    if (index === -1) {
      return res.status(404).json({ message: 'Custom template not found' });
    }
    
    defaultTemplates.splice(index, 1);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting custom template:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
