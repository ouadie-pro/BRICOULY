const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
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
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
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

reviewSchema.statics.calcAverageRating = async function (providerId) {
  const stats = await this.aggregate([
    { $match: { provider: providerId } },
    {
      $group: {
        _id: '$provider',
        avgRating: { $avg: '$rating' },
        count: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    await this.model('Provider').findByIdAndUpdate(providerId, {
      rating: Math.round(stats[0].avgRating * 10) / 10,
      reviewCount: stats[0].count,
    });
  }
};

reviewSchema.post('save', function () {
  this.constructor.calcAverageRating(this.provider);
});

reviewSchema.index({ user: 1, provider: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
