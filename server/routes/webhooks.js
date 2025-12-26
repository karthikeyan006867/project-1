const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { authenticateToken } = require('../middleware/auth');
const Webhook = require('../models/Webhook');

// Create webhook
router.post('/webhooks', authenticateToken, async (req, res) => {
  try {
    const { url, events, description, secret } = req.body;

    const webhook = new Webhook({
      userId: req.user.userId,
      url,
      events: events || ['event.created', 'event.updated', 'event.deleted'],
      description,
      secret: secret || crypto.randomBytes(32).toString('hex'),
      active: true
    });

    await webhook.save();

    res.status(201).json(webhook);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get webhooks
router.get('/webhooks', authenticateToken, async (req, res) => {
  try {
    const webhooks = await Webhook.find({ userId: req.user.userId });
    res.json(webhooks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update webhook
router.put('/webhooks/:id', authenticateToken, async (req, res) => {
  try {
    const webhook = await Webhook.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      req.body,
      { new: true }
    );

    if (!webhook) {
      return res.status(404).json({ message: 'Webhook not found' });
    }

    res.json(webhook);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete webhook
router.delete('/webhooks/:id', authenticateToken, async (req, res) => {
  try {
    const webhook = await Webhook.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!webhook) {
      return res.status(404).json({ message: 'Webhook not found' });
    }

    res.json({ message: 'Webhook deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Test webhook
router.post('/webhooks/:id/test', authenticateToken, async (req, res) => {
  try {
    const webhook = await Webhook.findOne({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!webhook) {
      return res.status(404).json({ message: 'Webhook not found' });
    }

    const testPayload = {
      event: 'webhook.test',
      timestamp: new Date().toISOString(),
      data: {
        message: 'This is a test webhook'
      }
    };

    const axios = require('axios');
    const signature = generateSignature(testPayload, webhook.secret);

    const response = await axios.post(webhook.url, testPayload, {
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature
      },
      timeout: 5000
    });

    res.json({
      message: 'Webhook test successful',
      status: response.status,
      response: response.data
    });
  } catch (error) {
    res.status(500).json({
      message: 'Webhook test failed',
      error: error.message
    });
  }
});

// Get webhook delivery logs
router.get('/webhooks/:id/deliveries', authenticateToken, async (req, res) => {
  try {
    const webhook = await Webhook.findOne({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!webhook) {
      return res.status(404).json({ message: 'Webhook not found' });
    }

    res.json({
      deliveries: webhook.deliveries.slice(0, 50) // Last 50 deliveries
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Trigger webhook (internal use)
async function triggerWebhook(userId, eventType, data) {
  try {
    const webhooks = await Webhook.find({
      userId,
      active: true,
      events: eventType
    });

    const axios = require('axios');

    for (const webhook of webhooks) {
      const payload = {
        event: eventType,
        timestamp: new Date().toISOString(),
        data
      };

      const signature = generateSignature(payload, webhook.secret);

      try {
        const response = await axios.post(webhook.url, payload, {
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Signature': signature
          },
          timeout: 5000
        });

        // Log successful delivery
        webhook.deliveries.unshift({
          status: 'success',
          statusCode: response.status,
          timestamp: new Date(),
          event: eventType
        });

        // Keep only last 100 deliveries
        webhook.deliveries = webhook.deliveries.slice(0, 100);
        await webhook.save();

      } catch (error) {
        // Log failed delivery
        webhook.deliveries.unshift({
          status: 'failed',
          statusCode: error.response?.status || 0,
          error: error.message,
          timestamp: new Date(),
          event: eventType
        });

        webhook.failureCount += 1;

        // Deactivate webhook after 5 consecutive failures
        if (webhook.failureCount >= 5) {
          webhook.active = false;
        }

        webhook.deliveries = webhook.deliveries.slice(0, 100);
        await webhook.save();
      }
    }
  } catch (error) {
    console.error('Webhook trigger error:', error);
  }
}

// Generate HMAC signature
function generateSignature(payload, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
}

module.exports = router;
module.exports.triggerWebhook = triggerWebhook;
