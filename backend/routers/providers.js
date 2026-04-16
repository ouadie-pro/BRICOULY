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
    const { id } = req.params;
    
    // For providers, we need to find requests where they are the accepted provider
    const requests = await ServiceRequest.find({ acceptedProviderId: id });
    const reviews = await Review.find({ provider: id });
    const user = await User.findById(id);
    
    // Count completed jobs
    const completedJobs = requests.filter(r => r.status === 'completed').length;
    
    // Count unread messages for this provider
    const unreadMessages = await Message.countDocuments({
      receiver: id,
      read: false
    });
    
    // Calculate average rating
    const avgRating = reviews.length > 0 
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
      : 0;
    
    res.json({
      jobsDone: completedJobs,
      profileViews: user?.profileViews || 0,
      rating: avgRating,
      unreadMessages: unreadMessages
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.json({ jobsDone: 0, profileViews: 0, rating: 0, unreadMessages: 0 });
  }
});

router.get('/:id/activity', async (req, res) => {
  try {
    const ServiceRequest = require('../models/ServiceRequest');
    const Message = require('../models/Message');
    const { id } = req.params;
    
    const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    const today = new Date();
    const activity = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      // Count service requests where this provider has applied/been accepted
      const requestsCount = await ServiceRequest.countDocuments({
        acceptedProviderId: id,
        createdAt: { $gte: date, $lt: nextDate }
      });
      
      // Count messages involving this provider
      const messagesCount = await Message.countDocuments({
        $or: [{ sender: id }, { receiver: id }],
        createdAt: { $gte: date, $lt: nextDate }
      });
      
      activity.push({
        day: days[date.getDay() === 0 ? 6 : date.getDay() - 1],
        views: requestsCount,
        messages: messagesCount
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
