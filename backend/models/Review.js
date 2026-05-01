const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider',
    required: true,
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
  },
  serviceRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceRequest',
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: 1,
    max: 5,
  },
  punctuality: {
    type: Number,
    min: 1,
    max: 5,
    default: 5,
  },
  professionalism: {
    type: Number,
    min: 1,
    max: 5,
    default: 5,
  },
  quality: {
    type: Number,
    min: 1,
    max: 5,
    default: 5,
  },
  comment: {
    type: String,
    default: '',
    maxlength: 1000,
  },
  serviceName: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

reviewSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

reviewSchema.index({ clientId: 1, provider: 1 });
reviewSchema.index({ bookingId: 1 }, { unique: true, sparse: true });
reviewSchema.index({ serviceRequestId: 1 }, { unique: true, sparse: true });
reviewSchema.index({ provider: 1, rating: 1 });

module.exports = mongoose.model('Review', reviewSchema);