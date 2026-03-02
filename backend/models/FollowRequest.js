const mongoose = require('mongoose');

const followRequestSchema = new mongoose.Schema({
  fromUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  toUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined'],
    default: 'pending',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

followRequestSchema.index({ fromUser: 1, toUser: 1 }, { unique: true });

module.exports = mongoose.model('FollowRequest', followRequestSchema);
