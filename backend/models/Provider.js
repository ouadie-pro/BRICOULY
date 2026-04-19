const mongoose = require('mongoose');

const providerSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  profession: {
    type: String,
    required: [true, 'Profession is required'],
    trim: true,
  },
  bio: {
    type: String,
    default: '',
  },
  hourlyRate: {
    type: Number,
    required: [true, 'Hourly rate is required'],
    min: 0,
  },
  responseTime: {
    type: String,
    default: '< 1h',
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  reviewCount: {
    type: Number,
    default: 0,
  },
  jobsDone: {
    type: Number,
    default: 0,
  },
  successRate: {
    type: Number,
    default: 95,
  },
  experience: {
    type: String,
    default: '1 Year Exp.',
  },
  verified: {
    type: Boolean,
    default: false,
  },
  distance: {
    type: Number,
    default: 1.0,
  },
  serviceArea: {
    type: String,
    default: '10km radius',
  },
  city: {
    type: String,
    default: '',
  },
  location: {
    type: String,
    default: 'Maroc',
  },
  services: [{
    type: String,
  }],
  portfolio: [{
    type: String,
  }],
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
  },
  available: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Provider', providerSchema);
