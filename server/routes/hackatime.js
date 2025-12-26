// HackaTime API Integration Routes
const express = require('express');
const axios = require('axios');
const mongoose = require('mongoose');
const router = express.Router();
const TimeTracking = require('../models/TimeTracking');

const HACKATIME_API_KEY = process.env.HACKATIME_API_KEY || '1882521f-5422-498b-a22d-85ac59259506';
const HACKATIME_BASE_URL = process.env.HACKATIME_URL || 'https://hackatime.hackclub.com/api/hackatime/v1';

// Send heartbeat to HackaTime
router.post('/heartbeat', async (req, res) => {
  try {
    const heartbeat = req.body;
    
    // Send to HackaTime API
    const response = await axios.post(
      `${HACKATIME_BASE_URL}/users/current/heartbeats`,
      heartbeat,
      {
        headers: {
          'Authorization': `Bearer ${HACKATIME_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Also save to our database (if connected)
    if (heartbeat.project && mongoose.connection.readyState === 1) {
      try {
        await TimeTracking.create({
          eventId: heartbeat.eventId || null,
          source: 'hackatime',
          duration: 120, // Default heartbeat interval
          startTime: new Date(heartbeat.time * 1000),
          endTime: new Date(heartbeat.time * 1000 + 120000),
          metadata: {
            project: heartbeat.project,
            branch: heartbeat.branch,
            language: heartbeat.language,
            entity: heartbeat.entity,
            category: heartbeat.category
          }
        });
      } catch (dbError) {
        console.warn('Failed to save to database:', dbError.message);
      }
    }

    res.json({ success: true, data: response.data });
  } catch (error) {
    console.error('HackaTime heartbeat error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to send heartbeat',
      details: error.response?.data || error.message 
    });
  }
});

// Send bulk heartbeats to HackaTime
router.post('/heartbeats', async (req, res) => {
  try {
    const heartbeats = req.body;
    
    // Send to HackaTime API
    const response = await axios.post(
      `${HACKATIME_BASE_URL}/users/current/heartbeats.bulk`,
      heartbeats,
      {
        headers: {
          'Authorization': `Bearer ${HACKATIME_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Save to database (if connected)
    if (mongoose.connection.readyState === 1) {
      try {
        const trackingRecords = heartbeats.map(hb => ({
          eventId: hb.eventId || null,
          source: 'hackatime',
          duration: 120,
          startTime: new Date(hb.time * 1000),
          endTime: new Date(hb.time * 1000 + 120000),
          metadata: {
            project: hb.project,
            branch: hb.branch,
            language: hb.language,
            entity: hb.entity,
            category: hb.category
          }
        }));

        await TimeTracking.insertMany(trackingRecords);
        res.json({ success: true, data: response.data, saved: trackingRecords.length });
      } catch (dbError) {
        console.warn('Failed to save to database:', dbError.message);
        res.json({ success: true, data: response.data, saved: 0 });
      }
    } else {
      res.json({ success: true, data: response.data, saved: 0 });
    }
  } catch (error) {
    console.error('HackaTime bulk heartbeats error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to send bulk heartbeats',
      details: error.response?.data || error.message 
    });
  }
});

// Get today's stats from HackaTime
router.get('/today', async (req, res) => {
  try {
    const response = await axios.get(
      `${HACKATIME_BASE_URL}/users/current/summaries`,
      {
        params: {
          start: new Date().toISOString().split('T')[0],
          end: new Date().toISOString().split('T')[0]
        },
        headers: {
          'Authorization': `Bearer ${HACKATIME_API_KEY}`
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('HackaTime today stats error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to get today stats',
      details: error.response?.data || error.message 
    });
  }
});

// Get stats for date range from HackaTime
router.get('/stats', async (req, res) => {
  try {
    const { range = 'last_7_days' } = req.query;
    
    const response = await axios.get(
      `${HACKATIME_BASE_URL}/users/current/stats/${range}`,
      {
        headers: {
          'Authorization': `Bearer ${HACKATIME_API_KEY}`
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('HackaTime stats error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to get stats',
      details: error.response?.data || error.message 
    });
  }
});

// Get user info from HackaTime
router.get('/user', async (req, res) => {
  try {
    const response = await axios.get(
      `${HACKATIME_BASE_URL}/users/current`,
      {
        headers: {
          'Authorization': `Bearer ${HACKATIME_API_KEY}`
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('HackaTime user info error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to get user info',
      details: error.response?.data || error.message 
    });
  }
});

// Get leaderboard from HackaTime
router.get('/leaderboard', async (req, res) => {
  try {
    const response = await axios.get(
      `${HACKATIME_BASE_URL}/leaders`,
      {
        headers: {
          'Authorization': `Bearer ${HACKATIME_API_KEY}`
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('HackaTime leaderboard error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to get leaderboard',
      details: error.response?.data || error.message 
    });
  }
});

module.exports = router;
