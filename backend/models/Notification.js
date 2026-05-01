const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['message', 'follow_request', 'follow_accepted', 'new_follower', 'request', 'request_update', 'like', 'comment', 'new_booking', 'new_review', 'application_accepted', 'application_rejected', 'booking_cancelled', 'booking_confirmed', 'booking_completed'],
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
  read: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Notification', notificationSchema);

// FIXED: #18 - Add database index on user field
notificationSchema.index({ user: 1, createdAt: -1 });
