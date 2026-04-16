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
  comment: {
    type: String,
    default: '',
    maxlength: 500,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

reviewSchema.index({ clientId: 1, provider: 1 });
reviewSchema.index({ serviceRequestId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Review', reviewSchema);
