const User = require('../models/User');
const Provider = require('../models/Provider');
const Review = require('../models/Review');

exports.getReviews = async (req, res) => {
  try {
    console.log('[getReviews] Request received', { params: req.params, headers: req.headers });
    const { providerId } = req.params;
    console.log('[getReviews] providerId:', providerId);
    const provider = await Provider.findOne({ user: providerId });
    
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    
    const reviews = await Review.find({ provider: provider._id })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 });
    
    const reviewsData = reviews.map(r => ({
      id: r._id.toString(),
      userId: r.user._id.toString(),
      userName: r.user.name,
      userAvatar: r.user.avatar,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
    }));
    
    res.json(reviewsData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createReview = async (req, res) => {
  try {
    const userId = req.headers['x-user-id']; // FIXED: #1 - Use x-user-id header
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(403).json({ error: 'User not found' });
    }
    
    const { providerId, rating, comment } = req.body;
    const provider = await Provider.findOne({ user: providerId });
    
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    
    // FIXED: #4 - Return 409 Conflict for duplicate review
    const existingReview = await Review.findOne({ user: userId, provider: provider._id });
    if (existingReview) {
      return res.status(409).json({ error: 'You have already reviewed this provider. Use PUT to update your existing review.' });
    }
    
    const review = await Review.create({
      user: userId,
      provider: provider._id,
      rating: parseInt(rating),
      comment: comment || '',
    });
    
    res.json({ success: true, review });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};