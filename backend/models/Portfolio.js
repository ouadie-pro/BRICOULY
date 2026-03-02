const mongoose = require('mongoose');

const portfolioSchema = new mongoose.Schema({
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider',
    required: true,
  },
  imageUrl: {
    type: String,
    required: [true, 'Image URL is required'],
  },
  caption: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Portfolio', portfolioSchema);
