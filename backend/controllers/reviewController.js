const mongoose = require('mongoose');
const User = require('../models/User');
const Provider = require('../models/Provider');
const Review = require('../models/Review');
const ServiceRequest = require('../models/ServiceRequest');
const Booking = require('../models/Booking');
const Notification = require('../models/Notification');

const updateProviderStats = async (providerUserId) => {
  try {
    const provider = await Provider.findOne({ user: providerUserId });
    if (!provider) return;
    
    const [reviews, completedBookings] = await Promise.all([
      Review.find({ provider: provider._id }),
      Booking.countDocuments({ provider: provider._id, status: 'completed' })
    ]);
    
    const reviewCount = reviews.length;
    let rating = 0;
    let avgPunctuality = 0;
    let avgProfessionalism = 0;
    let avgQuality = 0;
    
    if (reviews.length > 0) {
      rating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;
      avgPunctuality = reviews.reduce((acc, r) => acc + (r.punctuality || 0), 0) / reviews.length;
      avgProfessionalism = reviews.reduce((acc, r) => acc + (r.professionalism || 0), 0) / reviews.length;
      avgQuality = reviews.reduce((acc, r) => acc + (r.quality || 0), 0) / reviews.length;
    }
    
    await Provider.findByIdAndUpdate(provider._id, {
      rating: Math.round(rating * 10) / 10,
      reviewCount,
      avgPunctuality: Math.round(avgPunctuality * 10) / 10,
      avgProfessionalism: Math.round(avgProfessionalism * 10) / 10,
      avgQuality: Math.round(avgQuality * 10) / 10,
      jobsDone: completedBookings,
    });
  } catch (error) {
    console.error('Error updating provider stats:', error);
  }
};

exports.getReviews = async (req, res) => {
  try {
    const { providerId } = req.params;
    
    let provider = await Provider.findOne({ user: providerId });
    if (!provider) {
      provider = await Provider.findById(providerId);
    }
    
    if (!provider) {
      return res.json({
        success: true,
        reviews: [],
        averageRating: 0,
        reviewCount: 0,
        stats: { punctuality: 0, professionalism: 0, quality: 0 }
      });
    }
    
    const reviews = await Review.find({ provider: provider._id })
      .populate('clientId', 'name avatar')
      .populate('bookingId')
      .sort({ createdAt: -1 });
    
    const reviewsData = reviews.map(r => ({
      id: r._id.toString(),
      clientId: r.clientId._id.toString(),
      clientName: r.clientId.name,
      clientAvatar: r.clientId.avatar,
      rating: r.rating,
      punctuality: r.punctuality || 0,
      professionalism: r.professionalism || 0,
      quality: r.quality || 0,
      comment: r.comment,
      serviceName: r.serviceName,
      createdAt: r.createdAt,
    }));
    
    const stats = {
      punctuality: provider.avgPunctuality || 0,
      professionalism: provider.avgProfessionalism || 0,
      quality: provider.avgQuality || 0,
    };
    
    res.json({
      success: true,
      reviews: reviewsData,
      averageRating: provider.rating || 0,
      reviewCount: provider.reviewCount || 0,
      stats,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createReview = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'client') {
      return res.status(403).json({ 
        success: false, 
        error: 'Only clients can leave reviews' 
      });
    }
    const userId = user._id.toString();
    
    const { providerId, bookingId, serviceRequestId, rating, comment, punctuality, professionalism, quality } = req.body;
    
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
    
    let provider = await Provider.findOne({ user: providerId });
    if (!provider) {
      provider = await Provider.findById(providerId);
    }
    
    if (!provider) {
      return res.status(404).json({ success: false, error: 'Provider not found' });
    }
    
    let booking = null;
    let serviceRequest = null;
    let canReview = false;
    let serviceName = '';
    
    if (bookingId) {
      booking = await Booking.findById(bookingId);
      if (booking && booking.user.toString() === userId && booking.status === 'completed' && !booking.ratingGiven) {
        canReview = true;
        serviceName = booking.service;
      }
    }
    
    if (!canReview && serviceRequestId) {
      serviceRequest = await ServiceRequest.findById(serviceRequestId);
      if (serviceRequest && serviceRequest.clientId.toString() === userId && 
          serviceRequest.status === 'completed' && serviceRequest.acceptedProviderId === provider.user) {
        canReview = true;
        serviceName = serviceRequest.title;
      }
    }
    
    if (!canReview) {
      return res.status(400).json({ 
        success: false, 
        error: 'You can only review completed services you have booked' 
      });
    }
    
    const existingReview = await Review.findOne({ 
      clientId: user._id, 
      provider: provider._id,
      ...(bookingId && { bookingId }),
      ...(serviceRequestId && { serviceRequestId })
    });
    
    if (existingReview) {
      return res.status(409).json({ 
        success: false, 
        error: 'You have already reviewed this provider for this service' 
      });
    }
    
    const reviewData = {
      clientId: user._id,
      provider: provider._id,
      rating: parseInt(rating),
      comment: comment || '',
      punctuality: punctuality ? parseInt(punctuality) : 5,
      professionalism: professionalism ? parseInt(professionalism) : 5,
      quality: quality ? parseInt(quality) : 5,
      serviceName,
    };
    
    if (bookingId) reviewData.bookingId = bookingId;
    if (serviceRequestId) reviewData.serviceRequestId = serviceRequestId;
    
    const review = await Review.create(reviewData);
    
    if (booking) {
      booking.ratingGiven = true;
      await booking.save();
    }
    
    await updateProviderStats(providerId);
    
    const io = req.app.get('io');
    if (io) {
      await Notification.create({
        user: provider.user,
        type: 'new_review',
        title: 'New Review',
        text: `${user.name} gave you a ${rating}-star review`,
        fromUser: new mongoose.Types.ObjectId(userId),
      });
      
      io.to(`user:${provider.user.toString()}`).emit('notification', {
        type: 'new_review',
        title: 'New Review',
        text: `${user.name} gave you a ${rating}-star review`,
        fromUserId: userId,
      });
      
      io.to(`user:${provider.user.toString()}`).emit('new_review', {
        reviewId: review._id,
        rating,
        comment,
        fromUser: user.name,
      });
    }
    
    const updatedProvider = await Provider.findById(provider._id);
    
    res.status(201).json({ 
      success: true, 
      message: 'Review created successfully',
      review: {
        id: review._id.toString(),
        clientId: review.clientId.toString(),
        rating: review.rating,
        punctuality: review.punctuality,
        professionalism: review.professionalism,
        quality: review.quality,
        comment: review.comment,
        createdAt: review.createdAt
      },
      providerStats: {
        rating: updatedProvider?.rating || 0,
        reviewCount: updatedProvider?.reviewCount || 0,
        avgPunctuality: updatedProvider?.avgPunctuality || 0,
        avgProfessionalism: updatedProvider?.avgProfessionalism || 0,
        avgQuality: updatedProvider?.avgQuality || 0,
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
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'client') {
      return res.status(403).json({ success: false, error: 'Only clients can update reviews' });
    }
    const userId = user._id.toString();
    
    const { reviewId } = req.params;
    const { rating, comment, punctuality, professionalism, quality } = req.body;
    
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
    
    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Rating must be between 1 and 5' 
      });
    }
    
    if (rating !== undefined) review.rating = parseInt(rating);
    if (comment !== undefined) review.comment = comment;
    if (punctuality !== undefined) review.punctuality = parseInt(punctuality);
    if (professionalism !== undefined) review.professionalism = parseInt(professionalism);
    if (quality !== undefined) review.quality = parseInt(quality);
    
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
        rating: review.rating,
        punctuality: review.punctuality,
        professionalism: review.professionalism,
        quality: review.quality,
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
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const userId = user._id.toString();
    
    const { reviewId } = req.params;
    
    const review = await Review.findById(reviewId);
    
    if (!review) {
      return res.status(404).json({ success: false, error: 'Review not found' });
    }
    
    if (review.clientId.toString() !== user._id.toString() && user.role !== 'admin') {
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
    if (!req.user) {
      return res.json({
        success: true,
        canReview: false,
        reason: 'Please log in to submit a review.'
      });
    }
    
    const userId = req.user.id.toString();
    const { providerId } = req.params;
    
    const completedBookings = await Booking.find({
      user: userId,
      status: 'completed',
      ratingGiven: { $ne: true }
    }).populate('provider');
    
    const validBookings = completedBookings.filter(b => 
      b.provider && (b.provider.user.toString() === providerId || b.provider._id.toString() === providerId)
    );
    
    if (validBookings.length > 0) {
      return res.json({
        success: true,
        canReview: true,
        type: 'booking',
        bookingId: validBookings[0]._id,
        serviceName: validBookings[0].service
      });
    }
    
    const completedServiceRequests = await ServiceRequest.find({
      clientId: userId,
      acceptedProviderId: providerId,
      status: 'completed'
    });
    
    if (completedServiceRequests.length > 0) {
      return res.json({
        success: true,
        canReview: true,
        type: 'service_request',
        serviceRequestId: completedServiceRequests[0]._id,
        serviceName: completedServiceRequests[0].title
      });
    }
    
    res.json({
      success: true,
      canReview: false,
      reason: 'You can only rate a provider after they complete a service for you.'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getProviderReviewStats = async (req, res) => {
  try {
    const { providerId } = req.params;
    
    let provider = await Provider.findOne({ user: providerId });
    if (!provider) {
      provider = await Provider.findById(providerId);
    }
    
    if (!provider) {
      return res.status(404).json({ success: false, error: 'Provider not found' });
    }
    
    const reviews = await Review.find({ provider: provider._id });
    
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(r => {
      ratingDistribution[r.rating] = (ratingDistribution[r.rating] || 0) + 1;
    });
    
    res.json({
      success: true,
      averageRating: provider.rating || 0,
      totalReviews: provider.reviewCount || 0,
      ratingDistribution,
      stats: {
        punctuality: provider.avgPunctuality || 0,
        professionalism: provider.avgProfessionalism || 0,
        quality: provider.avgQuality || 0,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};