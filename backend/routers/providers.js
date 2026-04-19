const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/authMiddleware');
const { getProviders, createProvider, updateProvider, getProvidersByService } = require('../controllers/providerController');
const { getProviderById, getProviderReviews, getProviderServices, getProviderPortfolioById } = require('../controllers/userController');

router.get('/', getProviders);

router.get('/search', getProvidersByService);

router.get('/:id', getProviderById);
router.get('/:id/reviews', getProviderReviews);
router.get('/:id/services', getProviderServices);
router.get('/:id/portfolio', getProviderPortfolioById);
router.get('/:id/stats', async (req, res) => {
  try {
    const ServiceRequest = require('../models/ServiceRequest');
    const Review = require('../models/Review');
    const User = require('../models/User');
    const Message = require('../models/Message');
    const Provider = require('../models/Provider');
    const { id } = req.params;
    
    // Find provider document
    const provider = await Provider.findOne({ user: id });
    if (!provider) {
      return res.status(404).json({ success: false, error: 'Provider not found' });
    }
    
    // Count completed jobs (ServiceRequest where acceptedProviderId = provider._id AND status = 'completed')
    const jobsDone = await ServiceRequest.countDocuments({
      acceptedProviderId: provider._id,
      status: 'completed'
    });
    
    // Count active jobs (ServiceRequest where acceptedProviderId = provider._id AND status = 'in_progress')
    const activeJobs = await ServiceRequest.countDocuments({
      acceptedProviderId: provider._id,
      status: 'in_progress'
    });
    
    // Calculate average rating from Review.find({ providerId: provider._id })
    const reviews = await Review.find({ provider: provider._id });
    const rating = reviews.length > 0 
      ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10
      : 0;
    
    // Count unread messages (Message where receiverId = id AND read = false)
    const unreadMessages = await Message.countDocuments({
      receiverId: id,
      read: false
    });
    
    // Get profile views from User.findById(id).profileViews
    const user = await User.findById(id);
    const profileViews = user?.profileViews || 0;
    
    res.json({
      jobsDone,
      activeJobs,
      rating,
      unreadMessages,
      profileViews
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.json({ jobsDone: 0, activeJobs: 0, rating: 0, unreadMessages: 0, profileViews: 0 });
  }
});

router.get('/:id/activity', async (req, res) => {
  try {
    const ServiceRequest = require('../models/ServiceRequest');
    const Message = require('../models/Message');
    const Provider = require('../models/Provider');
    const { id } = req.params;
    
    // Find provider document
    const provider = await Provider.findOne({ user: id });
    if (!provider) {
      return res.status(404).json({ success: false, error: 'Provider not found' });
    }
    
    const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    const today = new Date();
    const activity = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      // Count views: ServiceRequest where acceptedProviderId = provider._id, created in that day
      const views = await ServiceRequest.countDocuments({
        acceptedProviderId: provider._id,
        createdAt: { $gte: date, $lt: nextDate }
      });
      
      // Count messages: Message where receiverId = id, created in that day
      const messages = await Message.countDocuments({
        receiverId: id,
        createdAt: { $gte: date, $lt: nextDate }
      });
      
      activity.push({
        day: days[date.getDay() === 0 ? 6 : date.getDay() - 1],
        views,
        messages
      });
    }
    
    res.json(activity);
  } catch (error) {
    console.error('Activity error:', error);
    const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    res.json(days.map(day => ({ day, views: 0, messages: 0 })));
  }
});

router.post('/', auth, createProvider);
router.put('/:id', auth, updateProvider);

module.exports = router;
