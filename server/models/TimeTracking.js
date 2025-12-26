const mongoose = require('mongoose');

const timeTrackingSchema = new mongoose.Schema({
  eventId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Event',
    required: true
  },
  source: { 
    type: String, 
    enum: ['wakatime', 'hackatime', 'manual'],
    required: true
  },
  duration: {
    type: Number,
    required: true,
    min: 0
  },
  timestamp: { 
    type: Date, 
    default: Date.now,
    index: true
  },
  activity: {
    type: String,
    default: 'coding'
  },
  project: String,
  language: String,
  editor: String,
  branch: String,
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }
});

// Indexes for efficient queries
timeTrackingSchema.index({ eventId: 1, timestamp: -1 });
timeTrackingSchema.index({ source: 1, timestamp: -1 });
timeTrackingSchema.index({ project: 1 });

// Virtual for hours
timeTrackingSchema.virtual('hours').get(function() {
  return (this.duration / 3600).toFixed(2);
});

// Static method to get total time by event
timeTrackingSchema.statics.getTotalByEvent = async function(eventId) {
  const result = await this.aggregate([
    { $match: { eventId: mongoose.Types.ObjectId(eventId) } },
    { $group: { _id: null, total: { $sum: '$duration' } } }
  ]);
  return result.length > 0 ? result[0].total : 0;
};

// Static method to get time by source
timeTrackingSchema.statics.getBySource = async function(source, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.find({
    source,
    timestamp: { $gte: startDate }
  }).sort({ timestamp: -1 });
};

// Static method to get daily breakdown
timeTrackingSchema.statics.getDailyBreakdown = async function(days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    { $match: { timestamp: { $gte: startDate } } },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          source: '$source'
        },
        totalDuration: { $sum: '$duration' },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.date': 1 } }
  ]);
};

module.exports = mongoose.model('TimeTracking', timeTrackingSchema);
