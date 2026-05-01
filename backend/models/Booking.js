const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider',
    required: true,
  },
  service: {
    type: String,
    required: true,
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
  },
  date: {
    type: Date,
    required: true,
  },
  time: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'confirmed', 'in_progress', 'completed', 'cancelled'],
    default: 'pending',
  },
  address: {
    type: String,
    default: '',
  },
  notes: {
    type: String,
    default: '',
  },
  price: {
    type: Number,
    required: true,
  },
  clientSeen: {
    type: Boolean,
    default: false,
  },
  providerSeen: {
    type: Boolean,
    default: false,
  },
  rejectReason: {
    type: String,
    default: '',
  },
  rescheduleRequest: {
    requestedDate: Date,
    requestedTime: String,
    reason: String,
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: null },
  },
  chatRoomId: {
    type: String,
    default: () => new mongoose.Types.ObjectId().toString(),
  },
  startedAt: Date,
  completedAt: Date,
  cancelledAt: Date,
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending',
  },
  paymentId: String,
  ratingGiven: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ provider: 1, createdAt: -1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ chatRoomId: 1 });

module.exports = mongoose.model('Booking', bookingSchema);