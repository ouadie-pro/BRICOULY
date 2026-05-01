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

// GET ALL PROVIDERS with proper filtering
exports.getProviders = async (req, res) => {
  try {
    console.log('[getProviders] Request received', { query: req.query });
    const { profession, search, sort, page = 1, limit = 20, lat, lng } = req.query;
    
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const skip = (pageNum - 1) * limitNum;
    
    // Build query for Provider documents
    let query = {};
    
    // Filter by profession if provided
    if (profession && profession !== '') {
      query.profession = { $regex: new RegExp(`^${profession}$`, 'i') };
    }
    
    console.log('[getProviders] Query:', JSON.stringify(query));
    
    // Get providers with their associated user data
    let providers = await Provider.find(query)
      .populate('user', 'name avatar phone location email bio')
      .skip(skip)
      .limit(limitNum);
    
    const total = await Provider.countDocuments(query);
    console.log('[getProviders] Found providers:', providers.length, 'total:', total);
    
    // If search term is provided, filter in memory (more flexible)
    let providersList = await Promise.all(providers.map(async p => {
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
        location: p.user.location || 'Maroc',
        role: 'provider',
        profession: p.profession,
        bio: p.bio || p.user.bio || '',
        hourlyRate: p.hourlyRate,
        responseTime: p.responseTime || '< 1h',
        distance: null, // Remove fake distance - will be calculated with real geolocation
        experience: p.experience || '1 Year Exp.',
        verified: p.verified || false,
        rating: stats.rating,
        reviewCount: stats.reviewCount,
        jobsDone: stats.jobsDone,
        serviceArea: p.serviceArea || '10km radius',
        available: p.available,
      };
    }));
    
    providersList = providersList.filter(p => p !== null);
    
    // Apply search filter (if provided)
    if (search && search.trim()) {
      const searchLower = search.toLowerCase().trim();
      providersList = providersList.filter(p => 
        p.name.toLowerCase().includes(searchLower) ||
        p.profession.toLowerCase().includes(searchLower) ||
        (p.bio && p.bio.toLowerCase().includes(searchLower))
      );
    }
    
    // Apply sorting
    if (sort === 'rating') {
      providersList.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sort === 'price_low') {
      providersList.sort((a, b) => (a.hourlyRate || 999999) - (b.hourlyRate || 999999));
    } else if (sort === 'price_high') {
      providersList.sort((a, b) => (b.hourlyRate || 0) - (a.hourlyRate || 0));
    } else {
      // Default: sort by rating
      providersList.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }
    
    res.json({
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

// GET SINGLE PROVIDER BY USER ID
exports.getProviderById = async (req, res) => {
  try {
    const { id } = req.params;
    const mongoose = require('mongoose');
    
    console.log('[getProviderById] Looking for provider with ID:', id);
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log('[getProviderById] Invalid ID format');
      return res.status(400).json({ error: 'Invalid provider ID format' });
    }
    
    // First try: find by user ID (this is the most common case - the ID from URL is the user ID)
    let provider = await Provider.findOne({ user: id })
      .populate('user', 'name avatar phone location email bio')
      .populate('category');
    
    // Second try: if not found, try as provider _id
    if (!provider) {
      provider = await Provider.findById(id)
        .populate('user', 'name avatar phone location email bio')
        .populate('category');
    }
    
    if (!provider) {
      console.log('[getProviderById] Provider not found for ID:', id);
      return res.status(404).json({
        success: false,
        error: 'Provider not found'
      });
    }
    
    if (!provider.user) {
      console.log('[getProviderById] Provider has no associated user');
      return res.status(404).json({
        success: false,
        error: 'Provider data is incomplete'
      });
    }
    
    console.log('[getProviderById] Found provider:', provider.user.name);
    
    const stats = await calculateProviderStats(provider._id);
    
    // Get services for this provider
    const services = await Service.find({ provider: provider._id });
    console.log('[getProviderById] Found services:', services.length);
    
    // Get portfolio items
    const portfolio = await Portfolio.find({ provider: provider._id });
    
    // Get reviews
    const reviews = await Review.find({ provider: provider._id })
      .populate('clientId', 'name avatar')
      .sort({ createdAt: -1 });
    
    // Format reviews for response
    const formattedReviews = reviews.map(r => ({
      id: r._id.toString(),
      rating: r.rating,
      comment: r.comment,
      punctuality: r.punctuality,
      professionalism: r.professionalism,
      createdAt: r.createdAt,
      clientName: r.clientId?.name || 'Anonymous',
      clientAvatar: r.clientId?.avatar || null
    }));
    
    const responseData = {
      id: provider.user._id.toString(),
      providerDbId: provider._id.toString(),
      name: provider.user.name,
      email: provider.user.email,
      avatar: provider.user.avatar || '',
      phone: provider.user.phone || '',
      location: provider.user.location || 'Maroc',
      role: 'provider',
      profession: provider.profession,
      bio: provider.bio || provider.user.bio || '',
      hourlyRate: provider.hourlyRate || 0,
      responseTime: provider.responseTime || '< 1h',
      experience: provider.experience || '1 Year Exp.',
      verified: provider.verified || false,
      rating: stats.rating,
      reviewCount: stats.reviewCount,
      jobsDone: stats.jobsDone,
      serviceArea: provider.serviceArea || '10km radius',
      available: provider.available !== false,
      services: services.map(s => ({
        id: s._id.toString(),
        name: s.name,
        description: s.description,
        price: s.price,
        category: s.category
      })),
      portfolio: portfolio.map(p => ({
        id: p._id.toString(),
        imageUrl: p.imageUrl,
        title: p.title,
        description: p.description
      })),
      reviews: formattedReviews
    };
    
    res.json(responseData);
  } catch (error) {
    console.error('[getProviderById] Error:', error.message, error.stack);
    res.status(500).json({ error: error.message });
  }
};

// GET PROVIDER REVIEWS
exports.getProviderReviews = async (req, res) => {
  try {
    const { id } = req.params;
    const mongoose = require('mongoose');
    
    console.log('[getProviderReviews] Looking for reviews for provider ID:', id);
    
    let provider = await Provider.findOne({ user: id });
    if (!provider && mongoose.Types.ObjectId.isValid(id)) {
      provider = await Provider.findById(id);
    }
    
    if (!provider) {
      console.log('[getProviderReviews] Provider not found, returning empty array');
      return res.json([]);
    }
    
    const reviews = await Review.find({ provider: provider._id })
      .populate('clientId', 'name avatar')
      .sort({ createdAt: -1 });
    
    const reviewsData = reviews.map(r => ({
      id: r._id.toString(),
      providerId: provider._id.toString(),
      clientId: r.clientId._id.toString(),
      clientName: r.clientId.name,
      clientAvatar: r.clientId.avatar,
      rating: r.rating,
      comment: r.comment,
      punctuality: r.punctuality,
      professionalism: r.professionalism,
      createdAt: r.createdAt,
    }));
    
    res.json(reviewsData);
  } catch (error) {
    console.error('[getProviderReviews] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// SEARCH USERS
exports.searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.json([]);
    }
    
    const query = q.toLowerCase().trim();
    
    // Search users by name
    const users = await User.find({ 
      name: { $regex: query, $options: 'i' } 
    }).limit(20);
    
    // Search providers by profession
    const providers = await Provider.find({ 
      profession: { $regex: query, $options: 'i' },
      available: true
    }).populate('user', 'name avatar location');
    
    const matchingUsers = [];
    
    // Add regular users
    for (const u of users) {
      matchingUsers.push({
        id: u._id.toString(),
        name: u.name,
        avatar: u.avatar,
        role: u.role,
        profession: '',
        location: u.location || '',
      });
    }
    
    // Add providers (deduplicate by user ID)
    const existingUserIds = new Set(matchingUsers.map(u => u.id));
    for (const p of providers) {
      if (p.user && !existingUserIds.has(p.user._id.toString())) {
        matchingUsers.push({
          id: p.user._id.toString(),
          name: p.user.name,
          avatar: p.user.avatar,
          role: 'provider',
          profession: p.profession || '',
          location: p.user.location || '',
        });
      }
    }
    
    res.json(matchingUsers.slice(0, 20));
  } catch (error) {
    console.error('[searchUsers] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// GET USER BY ID
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const mongoose = require('mongoose');
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const { password, ...userWithoutPassword } = user.toObject();
    res.json({ ...userWithoutPassword, id: user._id.toString() });
  } catch (error) {
    console.error('[getUserById] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// GET PROFESSIONS (categories)
exports.getProfessions = async (req, res) => {
  try {
    const categories = await Category.find();
    if (categories.length === 0) {
      // Return default categories if none in DB
      const defaultCategories = [
        { _id: '1', name: 'Plumber', icon: 'plumbing', color: '#3b82f6' },
        { _id: '2', name: 'Electrician', icon: 'bolt', color: '#eab308' },
        { _id: '3', name: 'Painter', icon: 'format_paint', color: '#ec4899' },
        { _id: '4', name: 'Carpenter', icon: 'carpenter', color: '#f59e0b' },
        { _id: '5', name: 'Home Cleaner', icon: 'cleaning_services', color: '#8b5cf6' },
        { _id: '6', name: 'Mover', icon: 'local_shipping', color: '#22c55e' },
        { _id: '7', name: 'HVAC Technician', icon: 'ac_unit', color: '#06b6d4' },
        { _id: '8', name: 'Landscaper', icon: 'grass', color: '#84cc16' },
        { _id: '9', name: 'Roofer', icon: 'roofing', color: '#dc2626' },
        { _id: '10', name: 'Appliance Repair', icon: 'kitchen', color: '#6366f1' },
      ];
      return res.json(defaultCategories);
    }
    res.json(categories);
  } catch (error) {
    console.error('getProfessions error:', error);
    res.status(500).json({ error: error.message });
  }
};

// CREATE PROFESSION
exports.createProfession = async (req, res) => {
  try {
    const { name, icon, color } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, error: 'Name is required' });
    }
    
    const existing = await Category.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existing) {
      return res.status(400).json({ success: false, error: 'Category already exists' });
    }
    
    const category = await Category.create({ 
      name, 
      icon: icon || 'work', 
      color: color || '#64748b' 
    });
    
    res.json({ success: true, profession: category });
  } catch (error) {
    console.error('[createProfession] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// GET CATEGORIES
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (error) {
    console.error('[getCategories] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// GET PROVIDER SERVICES
exports.getProviderServices = async (req, res) => {
  try {
    const { id } = req.params;
    const mongoose = require('mongoose');
    
    let provider = await Provider.findOne({ user: id });
    if (!provider && mongoose.Types.ObjectId.isValid(id)) {
      provider = await Provider.findById(id);
    }
    
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    
    const services = await Service.find({ provider: provider._id });
    res.json(services);
  } catch (error) {
    console.error('[getProviderServices] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// GET PROVIDER PORTFOLIO
exports.getProviderPortfolioById = async (req, res) => {
  try {
    const { id } = req.params;
    const mongoose = require('mongoose');
    
    let provider = await Provider.findOne({ user: id });
    if (!provider && mongoose.Types.ObjectId.isValid(id)) {
      provider = await Provider.findById(id);
    }
    
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    
    const portfolio = await Portfolio.find({ provider: provider._id });
    res.json(portfolio);
  } catch (error) {
    console.error('[getProviderPortfolioById] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
};