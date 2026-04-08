const User = require('../models/User');
const Provider = require('../models/Provider');
const Review = require('../models/Review');
const Booking = require('../models/Booking');

const updateProviderStats = async (providerId) => {
  try {
    const reviews = await Review.find({ provider: providerId });
    const reviewCount = reviews.length;
    let rating = 0;
    
    if (reviews.length > 0) {
      const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
      rating = Math.round((sum / reviews.length) * 10) / 10;
    }
    
    await Provider.findByIdAndUpdate(providerId, {
      rating,
      reviewCount,
    });
  } catch (error) {
    console.error('Error updating provider stats:', error);
  }
};

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
    const userId = req.headers['x-user-id'];
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(403).json({ error: 'Utilisateur non trouvé' });
    }
    
    const { providerId, bookingId, rating, comment, punctuality, professionalism } = req.body;
    
    // Find the provider
    const provider = await Provider.findOne({ user: providerId });
    if (!provider) {
      return res.status(404).json({ error: 'Prestataire non trouvé' });
    }
    
    // If bookingId is provided, validate that:
    // 1. Booking exists and belongs to this user
    // 2. Booking is completed
    // 3. User hasn't already reviewed this booking
    if (bookingId) {
      const booking = await Booking.findOne({ 
        _id: bookingId, 
        user: userId,
        status: 'completed'
      });
      
      if (!booking) {
        return res.status(403).json({ 
          error: 'Vous devez compléter un service avant de noter' 
        });
      }
      
      // Check if already reviewed this booking
      const existingForBooking = await Review.findOne({ 
        booking: bookingId, 
        user: userId 
      });
      if (existingForBooking) {
        return res.status(400).json({ 
          error: 'Vous avez déjà noté ce service' 
        });
      }
    }
    
    // Check for duplicate review (general)
    const existingReview = await Review.findOne({ user: userId, provider: provider._id });
    if (existingReview && !bookingId) {
      return res.status(409).json({ 
        error: 'Vous avez déjà noté ce prestataire. Utilisez PUT pour mettre à jour votre avis.' 
      });
    }
    
    // Create the review
    const reviewData = {
      user: userId,
      provider: provider._id,
      rating: parseInt(rating),
      comment: comment || '',
    };
    
    // Add booking reference if provided
    if (bookingId) {
      reviewData.booking = bookingId;
    }
    
    // Add sub-ratings if provided
    if (punctuality) {
      reviewData.punctuality = parseInt(punctuality);
    }
    if (professionalism) {
      reviewData.professionalism = parseInt(professionalism);
    }
    
    const review = await Review.create(reviewData);
    
    // Update provider stats
    await updateProviderStats(provider._id);
    
    // Get updated provider
    const updatedProvider = await Provider.findById(provider._id);
    
    res.json({ 
      success: true, 
      review: {
        id: review._id.toString(),
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt
      },
      newRating: updatedProvider.rating,
      reviewCount: updatedProvider.reviewCount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};