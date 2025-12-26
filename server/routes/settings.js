const express = require('express');
const router = express.Router();
const UserSettings = require('../models/UserSettings');

// Get user settings
router.get('/', async (req, res) => {
  try {
    const settings = await UserSettings.getOrCreate('default-user');
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update preferences
router.put('/preferences', async (req, res) => {
  try {
    const settings = await UserSettings.getOrCreate('default-user');
    settings.preferences = { ...settings.preferences, ...req.body };
    await settings.save();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update notifications
router.put('/notifications', async (req, res) => {
  try {
    const settings = await UserSettings.getOrCreate('default-user');
    settings.notifications = { ...settings.notifications, ...req.body };
    await settings.save();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update integrations
router.put('/integrations', async (req, res) => {
  try {
    const settings = await UserSettings.getOrCreate('default-user');
    const { service, config } = req.body;
    
    if (settings.integrations[service]) {
      settings.integrations[service] = { 
        ...settings.integrations[service], 
        ...config 
      };
      await settings.save();
      res.json(settings);
    } else {
      res.status(400).json({ message: 'Invalid service' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update goals
router.put('/goals', async (req, res) => {
  try {
    const settings = await UserSettings.getOrCreate('default-user');
    settings.goals = { ...settings.goals, ...req.body };
    await settings.save();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update display settings
router.put('/display', async (req, res) => {
  try {
    const settings = await UserSettings.getOrCreate('default-user');
    settings.display = { ...settings.display, ...req.body };
    await settings.save();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Reset to defaults
router.post('/reset', async (req, res) => {
  try {
    await UserSettings.deleteOne({ userId: 'default-user' });
    const settings = await UserSettings.create({ userId: 'default-user' });
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
