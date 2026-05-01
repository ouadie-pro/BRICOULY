const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['message', 'follow_request', 'follow_accepted', 'new_follower', 'request', 'request_update', 
           'like', 'comment', 'new_booking', 'booking_accepted', 'booking_rejected', 'booking_confirmed',
           'booking_completed', 'booking_cancelled', 'new_review', 'application_accepted', 'application_rejected',
           'new_application'],
    required: [true, 'Notification type is required'],
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
  },
  text: {
    type: String,
    default: '',
  },
  fromUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  requestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FollowRequest',
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
  },
  read: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, read: 1 });

module.exports = mongoose.model('Notification', notificationSchema);