const User = require('../models/User');
const Provider = require('../models/Provider');
const Service = require('../models/Service');
const Portfolio = require('../models/Portfolio');
const Review = require('../models/Review');
const Booking = require('../models/Booking');
const Category = require('../models/Category');

const calculateDistance = (lat1, lng1, lat2, lng2) => {
  if (!lat1 || !lng1 || !lat2 || !lng2) return null;
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return Math.round(R * c * 10) / 10;
};

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
    console.log('[getProviders] Request received', { query: req.query, headers: req.headers });
    const { profession, search, sort, page = 1, limit = 20, lat, lng } = req.query;
    
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const skip = (pageNum - 1) * limitNum;
    
    console.log('[getProviders] page:', pageNum, 'limit:', limitNum);
    
    let query = Provider.find().populate('user', 'name avatar phone location').populate('category');
    
    let providers = await query.skip(skip).limit(limitNum);
    const total = await Provider.countDocuments();
    console.log('[getProviders] Found providers:', providers.length, 'total:', total);
    
    let providersList = await Promise.all(providers.map(async p => {
      const stats = await calculateProviderStats(p._id);
      const userLat = p.user.location?.lat;
      const userLng = p.user.location?.lng;
      let distance = p.distance || 1.0;
      
      if (lat && lng && userLat && userLng) {
        distance = calculateDistance(parseFloat(lat), parseFloat(lng), userLat, userLng) || distance;
      }
      
      return {
        id: p.user._id.toString(),
        providerDbId: p._id.toString(),
        name: p.user.name,
        email: p.user.email,
        avatar: p.user.avatar,
        phone: p.user.phone,
        location: p.user.location,
        role: 'provider',
        professionId: p.category?._id?.toString(),
        profession: p.profession,
        bio: p.bio,
        hourlyRate: p.hourlyRate,
        distance: distance,
        experience: p.experience,
        verified: p.verified,
        rating: stats.rating,
        reviewCount: stats.reviewCount,
        jobsDone: stats.jobsDone,
        serviceArea: p.serviceArea,
      };
    }));
    
    // FIXED: #20 - Apply filters after pagination
    if (profession) {
      providersList = providersList.filter(p => p.profession?.toLowerCase() === profession.toLowerCase());
    }
    
    if (search) {
      providersList = providersList.filter(p => 
        p.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.profession?.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    if (lat && lng) {
      providersList.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    } else if (sort === 'rating') {
      providersList.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sort === 'price_low') {
      providersList.sort((a, b) => (a.hourlyRate || 0) - (b.hourlyRate || 0));
    } else if (sort === 'price_high') {
      providersList.sort((a, b) => (b.hourlyRate || 0) - (a.hourlyRate || 0));
    }
    
    for (let p of providersList) {
      const services = await Service.find({ provider: p.providerDbId });
      const portfolio = await Portfolio.find({ provider: p.providerDbId });
      const reviews = await Review.find({ provider: p.providerDbId });
      p.services = services || [];
      p.portfolio = portfolio || [];
      p.reviews = reviews || [];
    }
    
    res.json({
      // FIXED: #20 - Add pagination to response
      data: providersList,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('[getProviders] Error:', error.message, error.stack);
    res.status(500).json({ error: error.message });
  }
};

exports.getProviderById = async (req, res) => {
  try {
    const { id } = req.params;
    const mongoose = require('mongoose');
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid provider ID format', id });
    }
    
    let provider = await Provider.findOne({ user: id }).populate('user', 'name avatar phone location email').populate('category');
    
    // Also check if id is directly a provider _id
    if (!provider) {
      provider = await Provider.findById(id).populate('user', 'name avatar phone location email').populate('category');
    }
    
    // FIXED: Return default response for non-providers instead of 404
    if (!provider) {
      console.log('[getProviderById] User is not a provider, returning default');
      return res.json({
        id: id,
        name: '',
        email: '',
        avatar: '',
        phone: '',
        location: '',
        role: 'user',
        professionId: null,
        profession: '',
        bio: '',
        hourlyRate: 0,
        distance: 0,
        experience: '',
        verified: false,
        rating: 0,
        reviewCount: 0,
        jobsDone: 0,
        serviceArea: '',
        services: [],
        portfolio: [],
        reviews: [],
      });
    }
    
    const stats = await calculateProviderStats(provider._id);
    const services = await Service.find({ provider: provider._id });
    const portfolio = await Portfolio.find({ provider: provider._id });
    const reviews = await Review.find({ provider: provider._id }).populate('user', 'name avatar');
    
    res.json({
      id: provider.user._id.toString(),
      name: provider.user.name,
      email: provider.user.email,
      avatar: provider.user.avatar,
      phone: provider.user.phone,
      location: provider.user.location,
      role: 'provider',
      professionId: provider.category?._id?.toString(),
      profession: provider.profession,
      bio: provider.bio,
      hourlyRate: provider.hourlyRate,
      distance: provider.distance,
      experience: provider.experience,
      verified: provider.verified,
      rating: stats.rating,
      reviewCount: stats.reviewCount,
      jobsDone: stats.jobsDone,
      serviceArea: provider.serviceArea,
      services,
      portfolio,
      reviews,
    });
  } catch (error) {
    console.error('[getProviders] Error:', error.message, error.stack);
    res.status(500).json({ error: error.message });
  }
};

exports.getProviderReviews = async (req, res) => {
  try {
    console.log('[getProviderReviews] Request received', { params: req.params });
    const { id } = req.params;
    
    let provider = await Provider.findOne({ user: id });
    if (!provider) {
      provider = await Provider.findById(id);
    }
    
    // FIXED: Return empty array instead of 404 if user is not a provider
    if (!provider) {
      console.log('[getProviderReviews] User is not a provider, returning empty array');
      return res.json([]);
    }
    
    console.log('[getProviderReviews] Found provider:', provider._id);
    const reviews = await Review.find({ provider: provider._id }).populate('user', 'name avatar');
    console.log('[getProviderReviews] Found reviews:', reviews.length);
    
    const reviewsData = reviews.map(r => ({
      id: r._id.toString(),
      providerId: provider._id.toString(),
      clientId: r.user._id.toString(),
      clientName: r.user.name,
      clientAvatar: r.user.avatar,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
    }));
    res.json(reviewsData);
  } catch (error) {
    console.error('[getProviderReviews] Error:', error.message, error.stack);
    res.status(500).json({ error: error.message });
  }
};

exports.searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.json([]);
    }
    
    const query = q.toLowerCase();
    const users = await User.find({ name: { $regex: query, $options: 'i' } });
    const providers = await Provider.find({ profession: { $regex: query, $options: 'i' } }).populate('user', 'name avatar location');
    
    const matchingUsers = [
      ...users.map(u => ({
        id: u._id.toString(),
        name: u.name,
        avatar: u.avatar,
        role: u.role,
        profession: '',
        location: u.location || '',
        rating: 0,
      })),
      ...providers.map(p => ({
        id: p.user._id.toString(),
        name: p.user.name,
        avatar: p.user.avatar,
        role: 'provider',
        profession: p.profession || '',
        location: p.location || '',
        rating: p.rating || 0,
      })),
    ];
    
    res.json(matchingUsers);
  } catch (error) {
    console.error('[getProviders] Error:', error.message, error.stack);
    res.status(500).json({ error: error.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const mongoose = require('mongoose');
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid user ID format', id });
    }
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const { password, ...userWithoutPassword } = user.toObject();
    res.json({ ...userWithoutPassword, id: user._id.toString() });
  } catch (error) {
    console.error('[getProviders] Error:', error.message, error.stack);
    res.status(500).json({ error: error.message });
  }
};

exports.getProfessions = async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (error) {
    console.error('getProfessions error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.createProfession = async (req, res) => {
  try {
    const { name, icon, color } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, error: 'Name is required' });
    }
    const category = await Category.create({ name, icon: icon || 'work', color: color || '#64748b' });
    res.json({ success: true, profession: category });
  } catch (error) {
    console.error('[getProviders] Error:', error.message, error.stack);
    res.status(500).json({ error: error.message });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (error) {
    console.error('[getProviders] Error:', error.message, error.stack);
    res.status(500).json({ error: error.message });
  }
};

exports.getProviderServices = async (req, res) => {
  try {
    const provider = await Provider.findOne({ user: req.params.id });
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    const services = await Service.find({ provider: provider._id });
    res.json(services);
  } catch (error) {
    console.error('[getProviders] Error:', error.message, error.stack);
    res.status(500).json({ error: error.message });
  }
};

exports.getProviderPortfolioById = async (req, res) => {
  try {
    const provider = await Provider.findOne({ user: req.params.id });
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    const portfolio = await Portfolio.find({ provider: provider._id });
    res.json(portfolio);
  } catch (error) {
    console.error('[getProviders] Error:', error.message, error.stack);
    res.status(500).json({ error: error.message });
  }
};