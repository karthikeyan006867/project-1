const mongoose = require('mongoose');

const webhookSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  url: {
    type: String,
    required: true
  },
  events: [{
    type: String,
    enum: [
      'event.created',
      'event.updated',
      'event.deleted',
      'event.completed',
      'reminder.triggered',
      'team.member.added',
      'team.member.removed',
      'comment.created'
    ]
  }],
  description: String,
  secret: {
    type: String,
    required: true
  },
  active: {
    type: Boolean,
    default: true
  },
  deliveries: [{
    status: {
      type: String,
      enum: ['success', 'failed']
    },
    statusCode: Number,
    error: String,
    timestamp: Date,
    event: String
  }],
  failureCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

webhookSchema.index({ userId: 1, active: 1 });
webhookSchema.index({ events: 1 });

module.exports = mongoose.model('Webhook', webhookSchema);
