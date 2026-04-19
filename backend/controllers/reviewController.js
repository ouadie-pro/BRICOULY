const User = require('../models/User');
const Provider = require('../models/Provider');
const Review = require('../models/Review');
const ServiceRequest = require('../models/ServiceRequest');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const getUserFromRequest = async (req) => {
  const authHeader = req.headers.authorization;
  const userIdHeader = req.headers['x-user-id'];
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const jwt = require('jsonwebtoken');
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      return await User.findById(decoded.id);
    } catch (e) {
      return null;
    }
  }
  
  if (userIdHeader) {
    return await User.findById(userIdHeader);
  }
  
  return null;
};

const updateProviderStats = async (providerUserId) => {
  try {
    const provider = await Provider.findOne({ user: providerUserId });
    if (!provider) return;
    
    const reviews = await Review.find({ provider: provider._id });
    const reviewCount = reviews.length;
    let rating = 0;
    
    if (reviews.length > 0) {
      const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
      rating = Math.round((sum / reviews.length) * 10) / 10;
    }
    
    await Provider.findByIdAndUpdate(provider._id, {
      rating,
      reviewCount,
    });
  } catch (error) {
    console.error('Error updating provider stats:', error);
  }
};

exports.getReviews = async (req, res) => {
  try {
    const { providerId } = req.params;
    
    const provider = await Provider.findOne({ user: providerId });
    if (!provider) {
      return res.json({
        success: true,
        reviews: [],
        averageRating: 0,
        reviewCount: 0
      });
    }
    
    const reviews = await Review.find({ provider: provider._id })
      .populate('clientId', 'name avatar')
      .sort({ createdAt: -1 });
    
    const reviewsData = reviews.map(r => ({
      id: r._id.toString(),
      clientId: r.clientId._id.toString(),
      clientName: r.clientId.name,
      clientAvatar: r.clientId.avatar,
      rating: r.rating,
      punctuality: r.punctuality,
      professionalism: r.professionalism,
      comment: r.comment,
      createdAt: r.createdAt,
    }));
    
    res.json({
      success: true,
      reviews: reviewsData,
      averageRating: provider.rating || 0,
      reviewCount: provider.reviewCount || 0
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createReview = async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    
    if (user.role !== 'client') {
      return res.status(403).json({ 
        success: false, 
        error: 'Only clients can leave reviews' 
      });
    }
    
    const { providerId, serviceRequestId, rating, comment, punctuality, professionalism } = req.body;
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ 
        success: false, 
        error: 'Rating is required and must be between 1 and 5' 
      });
    }
    
    if (!providerId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Provider ID is required' 
      });
    }
    
    const provider = await Provider.findOne({ user: providerId });
    if (!provider) {
      return res.status(404).json({ success: false, error: 'Provider not found' });
    }
    
    if (user.id === providerId || user._id.toString() === providerId) {
      return res.status(400).json({ 
        success: false, 
        error: 'You cannot review yourself' 
      });
    }
    
    if (serviceRequestId) {
      const serviceRequest = await ServiceRequest.findById(serviceRequestId);
      
      if (!serviceRequest) {
        return res.status(404).json({ 
          success: false, 
          error: 'Service request not found' 
        });
      }
      
      if (serviceRequest.clientId.toString() !== user._id.toString()) {
        return res.status(403).json({ 
          success: false, 
          error: 'You can only review services you requested' 
        });
      }
      
      if (serviceRequest.status !== 'completed') {
        return res.status(400).json({ 
          success: false, 
          error: 'You can only review completed services' 
        });
      }
      
      if (serviceRequest.acceptedProviderId?.toString() !== providerId) {
        return res.status(400).json({ 
          success: false, 
          error: 'This provider did not complete this service' 
        });
      }
      
      const existingForJob = await Review.findOne({ 
        serviceRequestId: serviceRequestId 
      });
      
      if (existingForJob) {
        return res.status(409).json({ 
          success: false, 
          error: 'You have already reviewed this service' 
        });
      }
    }
    
    const existingReview = await Review.findOne({ 
      clientId: user._id, 
      provider: provider._id 
    });
    
    if (existingReview && !serviceRequestId) {
      return res.status(409).json({ 
        success: false, 
        error: 'You have already reviewed this provider. Use PUT to update your review.' 
      });
    }
    
    const reviewData = {
      clientId: user._id,
      provider: provider._id,
      serviceRequestId: serviceRequestId || null,
      rating: parseInt(rating),
      comment: comment || '',
    };
    
    if (punctuality) reviewData.punctuality = parseInt(punctuality);
    if (professionalism) reviewData.professionalism = parseInt(professionalism);
    
    const review = await Review.create(reviewData);
    
    await updateProviderStats(providerId);
    
    const updatedProvider = await Provider.findOne({ user: providerId });
    
    res.status(201).json({ 
      success: true, 
      message: 'Review created successfully',
      review: {
        id: review._id.toString(),
        clientId: review.clientId.toString(),
        rating: review.rating,
        punctuality: review.punctuality,
        professionalism: review.professionalism,
        comment: review.comment,
        createdAt: review.createdAt
      },
      providerStats: {
        rating: updatedProvider?.rating || 0,
        reviewCount: updatedProvider?.reviewCount || 0
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ 
        success: false, 
        error: 'You have already reviewed this provider for this service' 
      });
    }
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateReview = async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    
    const { reviewId } = req.params;
    const { rating, comment, punctuality, professionalism } = req.body;
    
    const review = await Review.findById(reviewId);
    
    if (!review) {
      return res.status(404).json({ success: false, error: 'Review not found' });
    }
    
    if (review.clientId.toString() !== user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        error: 'Not authorized to update this review' 
      });
    }
    
    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({ 
          success: false, 
          error: 'Rating must be between 1 and 5' 
        });
      }
      review.rating = parseInt(rating);
    }
    
    if (comment !== undefined) review.comment = comment;
    if (punctuality !== undefined) review.punctuality = parseInt(punctuality);
    if (professionalism !== undefined) review.professionalism = parseInt(professionalism);
    
    await review.save();
    
    const provider = await Provider.findById(review.provider);
    if (provider) {
      await updateProviderStats(provider.user.toString());
    }
    
    res.json({
      success: true,
      message: 'Review updated successfully',
      review: {
        id: review._id.toString(),
        clientId: review.clientId.toString(),
        rating: review.rating,
        punctuality: review.punctuality,
        professionalism: review.professionalism,
        comment: review.comment,
        updatedAt: review.updatedAt
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    
    const { reviewId } = req.params;
    
    const review = await Review.findById(reviewId);
    
    if (!review) {
      return res.status(404).json({ success: false, error: 'Review not found' });
    }
    
    if (review.clientId.toString() !== user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        error: 'Not authorized to delete this review' 
      });
    }
    
    const providerUserId = (await Provider.findById(review.provider))?.user?.toString();
    
    await review.deleteOne();
    
    if (providerUserId) {
      await updateProviderStats(providerUserId);
    }
    
    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.checkCanReview = async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    
    const { providerId } = req.params;
    
    // Check if there are any completed service requests with this provider
    const completedRequest = await ServiceRequest.findOne({
      clientId: user._id,
      acceptedProviderId: providerId,
      status: 'completed'
    });
    
    if (!completedRequest) {
      return res.json({
        success: true,
        canReview: false,
        reason: 'You can only rate a provider who completed a job for you.'
      });
    }
    
    // Check for existing review on this specific service request
    const provider = await Provider.findOne({ user: providerId });
    if (!provider) {
      return res.status(404).json({ success: false, error: 'Provider not found' });
    }
    
    const existingReview = await Review.findOne({ 
      clientId: user._id, 
      provider: provider._id,
      serviceRequestId: completedRequest._id
    });
    
    if (existingReview) {
      return res.json({
        success: true,
        canReview: false,
        reason: 'You have already reviewed this provider for this job.'
      });
    }
    
    res.json({
      success: true,
      canReview: true,
      serviceRequestId: completedRequest._id
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
