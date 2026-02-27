const Review = require('../models/Review');
const Booking = require('../models/Booking');

exports.getReviews = async (req, res) => {
  try {
    const { providerId } = req.params;

    const reviews = await Review.find({ provider: providerId })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: reviews.length,
      reviews,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

exports.createReview = async (req, res) => {
  try {
    const { providerId, bookingId, rating, comment, punctuality, professionalism } = req.body;

    const booking = await Booking.findById(bookingId);
    if (booking && booking.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to review this booking',
      });
    }

    const review = await Review.create({
      user: req.user.id,
      provider: providerId,
      booking: bookingId,
      rating,
      comment,
      punctuality,
      professionalism,
    });

    await Booking.findByIdAndUpdate(bookingId, { status: 'completed', completedAt: new Date() });

    const populatedReview = await Review.findById(review._id)
      .populate('user', 'name avatar');

    res.status(201).json({
      success: true,
      review: populatedReview,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
