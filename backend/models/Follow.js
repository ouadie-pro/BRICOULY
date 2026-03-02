const mongoose = require('mongoose');

const followSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  targetUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

followSchema.index({ user: 1, targetUser: 1 }, { unique: true });

module.exports = mongoose.model('Follow', followSchema);
