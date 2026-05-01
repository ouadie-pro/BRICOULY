const Provider = require('../models/Provider');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Review = require('../models/Review');

const calculateProviderStats = async (providerId) => {
  try {
    const [completedBookings, completedServiceRequests, reviews] = await Promise.all([
      Booking.countDocuments({ provider: providerId, status: 'completed' }),
      require('../models/ServiceRequest').countDocuments({ acceptedProviderId: providerId, status: 'completed' }),
      Review.find({ provider: providerId })
    ]);
    
    const jobsDone = completedBookings + completedServiceRequests;
    let rating = 0;
    let reviewCount = reviews.length;
    
    if (reviews.length > 0) {
      const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
      rating = Math.round((sum / reviews.length) * 10) / 10;
    }
    
    return { jobsDone, rating, reviewCount };
  } catch (error) {
    console.error('Error calculating provider stats:', error);
    return { jobsDone: 0, rating: 0, reviewCount: 0 };
  }
};

exports.getProviders = async (req, res) => {
  try {
    const { search, profession, sort } = req.query;
    
    console.log('[getProviders] Query params:', { search, profession, sort });
    
    let query = {};

    if (profession) {
      query.profession = { $regex: new RegExp(`^${profession}$`, 'i') };
    }

    if (search) {
      const searchLower = search.toLowerCase().trim();
      query.$or = [
        { name: { $regex: searchLower, $options: 'i' } },
        { profession: { $regex: searchLower, $options: 'i' } },
        { bio: { $regex: searchLower, $options: 'i' } },
        { location: { $regex: searchLower, $options: 'i' } },
      ];
    }

    let sortOption = { rating: -1 };
    if (sort === 'price_low') {
      sortOption = { hourlyRate: 1 };
    } else if (sort === 'price_high') {
      sortOption = { hourlyRate: -1 };
    } else if (sort === 'rating') {
      sortOption = { rating: -1 };
    }

    console.log('[getProviders] MongoDB Query:', JSON.stringify(query, null, 2));

    const providers = await Provider.find(query)
      .populate('user', 'name avatar phone location')
      .sort(sortOption);

    console.log('[getProviders] Found providers:', providers.length);

    const providersList = await Promise.all(providers.map(async p => {
      if (!p.user) {
        return null;
      }
      const stats = await calculateProviderStats(p._id);
      return {
        id: p.user._id.toString(),
        providerDbId: p._id.toString(),
        name: p.user.name || 'Unknown',
        email: p.user.email || '',
        avatar: p.user.avatar,
        phone: p.user.phone,
        location: p.user.location,
        role: 'provider',
        profession: p.profession,
        bio: p.bio,
        hourlyRate: p.hourlyRate,
        responseTime: p.responseTime,
        distance: p.distance || 1.0,
        experience: p.experience,
        verified: p.verified,
        rating: stats.rating,
        reviewCount: stats.reviewCount,
        jobsDone: stats.jobsDone,
        serviceArea: p.serviceArea,
      };
    }));

    const filteredProviders = providersList.filter(p => p !== null);

    console.log('[getProviders] Returning providers:', filteredProviders.length);

    res.json(filteredProviders);
  } catch (error) {
    console.error('[getProviders] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.getProvidersByService = async (req, res) => {
  try {
    const { service } = req.query;
    
    if (!service) {
      return res.status(400).json({ 
        success: false, 
        error: 'Service parameter is required' 
      });
    }
    
    const serviceLower = service.toLowerCase().trim();
    
    const providers = await Provider.find({
      profession: { $regex: serviceLower, $options: 'i' },
      available: true
    })
      .populate('user', 'name avatar phone email location city')
      .sort({ rating: -1 });

    const providersList = await Promise.all(providers.map(async p => {
      if (!p.user) {
        return null;
      }
      const stats = await calculateProviderStats(p._id);
      return {
        id: p.user._id.toString(),
        providerDbId: p._id.toString(),
        name: p.user.name || 'Unknown',
        email: p.user.email || '',
        avatar: p.user.avatar,
        phone: p.user.phone,
        location: p.user.location,
        city: p.user.city,
        role: 'provider',
        profession: p.profession,
        bio: p.bio,
        hourlyRate: p.hourlyRate,
        experience: p.experience,
        verified: p.verified,
        rating: stats.rating,
        reviewCount: stats.reviewCount,
        jobsDone: stats.jobsDone,
        serviceArea: p.serviceArea,
      };
    }));

    const filteredProviders = providersList.filter(p => p !== null);

    res.json({
      success: true,
      service: service,
      count: filteredProviders.length,
      providers: filteredProviders
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getProvider = async (req, res) => {
  try {
    const provider = await Provider.findById(req.params.id)
      .populate('user', 'name avatar email phone')
      .populate('category');

    if (!provider) {
      return res.status(404).json({
        success: false,
        error: 'Provider not found',
      });
    }

    res.json({
      success: true,
      provider,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

exports.createProvider = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.id;
    
    const providerData = {
      ...req.body,
      user: userId,
    };

    const provider = await Provider.create(providerData);

    res.status(201).json({
      success: true,
      provider,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

exports.updateProvider = async (req, res) => {
  try {
    const provider = await Provider.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!provider) {
      return res.status(404).json({
        success: false,
        error: 'Provider not found',
      });
    }

    res.json({
      success: true,
      provider,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Get provider dashboard stats with earnings
exports.getProviderDashboardStats = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    if (req.user.role !== 'provider') {
      return res.status(403).json({ success: false, error: 'Only providers can access stats' });
    }

    const userId = req.user.id;

    const provider = await Provider.findOne({ user: userId });
    if (!provider) {
      return res.status(404).json({ success: false, error: 'Provider not found' });
    }

    const ServiceRequest = require('../models/ServiceRequest');
    const Message = require('../models/Message');

    const [completedServiceRequests, activeServiceRequests, completedBookings, pendingBookings, reviews] = await Promise.all([
      ServiceRequest.countDocuments({ acceptedProviderId: provider._id, status: 'completed' }),
      ServiceRequest.countDocuments({ acceptedProviderId: provider._id, status: 'in_progress' }),
      Booking.countDocuments({ provider: provider._id, status: 'completed' }),
      Booking.countDocuments({ provider: provider._id, status: 'pending' }),
      Review.find({ provider: provider._id })
    ]);

    const jobsDone = completedServiceRequests + completedBookings;
    const activeJobs = activeServiceRequests;
    const pendingBookingsCount = pendingBookings;

    let rating = 0;
    if (reviews.length > 0) {
      rating = Math.round((reviews.reduce((sum, r) => sum + r.rating,0) / reviews.length) * 10) / 10;
    }

    // Calculate total earnings from completed bookings
    const completedBookingsList = await Booking.find({ provider: provider._id, status: 'completed' });
    const totalEarnings = completedBookingsList.reduce((sum, b) => sum + (b.price || 0),0);

    // Get unread messages count
    const unreadMessages = await Message.countDocuments({
      receiver: userId,
      read: false
    });

    // Get profile views
    const user = await User.findById(userId);
    const profileViews = user?.profileViews || 0;

    // Get weekly activity
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const today = new Date();
    const activity = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0,0,0,0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const views = await ServiceRequest.countDocuments({
        acceptedProviderId: provider._id,
        createdAt: { $gte: date, $lt: nextDate }
      });

      activity.push({
        day: days[date.getDay() === 0 ? 6 : date.getDay() - 1],
        views,
        messages: 0
      });
    }

    res.json({
      success: true,
      stats: {
        jobsDone,
        activeJobs,
        rating,
        reviewCount: reviews.length,
        pendingBookings: pendingBookingsCount,
        unreadMessages,
        profileViews,
        totalEarnings
      },
      activity
    });
  } catch (error) {
    console.error('Error getting provider stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get weekly activity for provider
exports.getWeeklyActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const today = new Date();
    const activity = [];

    const provider = await Provider.findOne({ user: id });
    if (!provider) {
      return res.json(days.map(day => ({ day, views: 0, messages: 0 })));
    }

    const ServiceRequest = require('../models/ServiceRequest');
    const Message = require('../models/Message');

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const [views, messages] = await Promise.all([
        ServiceRequest.countDocuments({
          acceptedProviderId: provider._id,
          createdAt: { $gte: date, $lt: nextDate }
        }),
        Message.countDocuments({
          receiver: id,
          createdAt: { $gte: date, $lt: nextDate }
        })
      ]);

      activity.push({
        day: days[date.getDay() === 0 ? 6 : date.getDay() - 1],
        views,
        messages
      });
    }

    res.json(activity);
  } catch (error) {
    console.error('Error getting weekly activity:', error);
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    res.json(days.map(day => ({ day, views: 0, messages: 0 })));
  }
};
