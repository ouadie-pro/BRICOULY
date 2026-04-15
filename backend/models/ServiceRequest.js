const mongoose = require('mongoose');

const serviceRequestSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider',
    required: false,
  },
  serviceName: {
    type: String,
    required: [true, 'Service name is required'],
  },
  description: {
    type: String,
    default: '',
  },
  preferredDate: {
    type: Date,
  },
  preferredTime: {
    type: String,
    enum: ['morning', 'afternoon', 'evening', ''],
    default: '',
  },
  location: {
    type: String,
    default: '',
  },
  budget: {
    type: Number,
  },
  urgency: {
    type: String,
    enum: ['normal', 'urgent', ''],
    default: 'normal',
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'],
    default: 'pending',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('ServiceRequest', serviceRequestSchema);

// FIXED: #18 - Add database indexes
serviceRequestSchema.index({ client: 1, createdAt: -1 });
serviceRequestSchema.index({ provider: 1, createdAt: -1 });
serviceRequestSchema.index({ serviceName: 1 });
serviceRequestSchema.index({ status: 1 });
