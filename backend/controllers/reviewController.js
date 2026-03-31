const User = require('../models/User');
const Provider = require('../models/Provider');
const Review = require('../models/Review');

exports.createReview = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(403).json({ error: 'User not found' });
    }
    
    const { providerId, rating, comment } = req.body;
    const provider = await Provider.findOne({ user: providerId });
    
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
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