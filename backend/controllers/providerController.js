const Provider = require('../models/Provider');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Review = require('../models/Review');

const calculateProviderStats = async (providerId) => {
  try {
    const [completedBookings, reviews] = await Promise.all([
      Booking.countDocuments({ provider: providerId, status: 'completed' }),
      Review.find({ provider: providerId })
    ]);
    
    const jobsDone = completedBookings;
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
    
    let query = { available: true };

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
