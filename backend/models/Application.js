const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true,
  },
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider',
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending',
  },
  message: {
    type: String,
    default: '',
  },
  proposedPrice: {
    type: Number,
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

applicationSchema.index({ post: 1, user: 1 }, { unique: true });
applicationSchema.index({ post: 1, provider: 1 });

applicationSchema.pre('save', async function() {
  this.updatedAt = new Date();
});

module.exports = mongoose.model('Application', applicationSchema);
