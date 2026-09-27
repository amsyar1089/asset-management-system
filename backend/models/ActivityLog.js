const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  action: {
    type: String,
    enum: ['created', 'updated', 'deleted', 'imported'],
    required: true,
  },
  user: {
    _id:  { type: mongoose.Schema.Types.ObjectId },
    name: { type: String },
    role: { type: String },
  },
  asset: {
    _id:          { type: mongoose.Schema.Types.ObjectId },
    serialNumber: { type: String },
    assetType:    { type: String },
    location:     { type: String },
  },
  // For updates: human-readable summary of what changed
  details: { type: String, default: '' },
  // For bulk imports
  count: { type: Number, default: 1 },
}, {
  timestamps: true,
});

// TTL: keep logs for 2 years
activityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 63072000 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
