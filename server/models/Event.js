const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    maxlength: 2000
  },
  startDate: { 
    type: Date, 
    required: true 
  },
  endDate: Date,
  category: {
    type: String,
    enum: ['hackathon', 'workshop', 'meeting', 'project', 'deadline', 'other'],
    default: 'other'
  },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high'], 
    default: 'medium' 
  },
  reminders: [{
    time: Date,
    message: String,
    sent: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }],
  attachments: [{
    url: String,
    publicId: String,
    type: String,
    filename: String,
    size: Number,
    uploadedAt: { type: Date, default: Date.now }
  }],
  wakatimeProject: String,
  hackatimeProject: String,
  timeTracked: { 
    type: Number, 
    default: 0,
    min: 0
  },
  tags: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    enum: ['planned', 'in-progress', 'completed', 'cancelled'],
    default: 'planned'
  },
  location: String,
  attendees: [{
    name: String,
    email: String
  }],
  notes: String,
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Indexes for better query performance
eventSchema.index({ startDate: 1 });
eventSchema.index({ category: 1 });
eventSchema.index({ priority: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ tags: 1 });
eventSchema.index({ title: 'text', description: 'text', notes: 'text' });

// Virtual for event duration
eventSchema.virtual('duration').get(function() {
  if (this.endDate && this.startDate) {
    return this.endDate - this.startDate;
  }
  return null;
});

// Virtual for hours tracked
eventSchema.virtual('hoursTracked').get(function() {
  return (this.timeTracked / 3600).toFixed(2);
});

// Pre-save hook to update timestamp
eventSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Static method to find upcoming events
eventSchema.statics.findUpcoming = function(limit = 10) {
  return this.find({ 
    startDate: { $gte: new Date() },
    status: { $ne: 'cancelled' }
  })
  .sort({ startDate: 1 })
  .limit(limit);
};

// Static method to find events by date range
eventSchema.statics.findByDateRange = function(startDate, endDate) {
  return this.find({
    $or: [
      { startDate: { $gte: startDate, $lte: endDate } },
      { endDate: { $gte: startDate, $lte: endDate } },
      { 
        startDate: { $lte: startDate },
        endDate: { $gte: endDate }
      }
    ]
  }).sort({ startDate: 1 });
};

// Instance method to add time tracking
eventSchema.methods.addTimeTracking = function(seconds) {
  this.timeTracked += seconds;
  return this.save();
};

// Instance method to complete event
eventSchema.methods.markComplete = function() {
  this.status = 'completed';
  if (!this.endDate) {
    this.endDate = new Date();
  }
  return this.save();
};

module.exports = mongoose.model('Event', eventSchema);
