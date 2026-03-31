const User = require('../models/User');
const Provider = require('../models/Provider');
const Service = require('../models/Service');
const Portfolio = require('../models/Portfolio');
const Review = require('../models/Review');
const Category = require('../models/Category');

exports.getProviders = async (req, res) => {
  try {
    const { profession, search, sort } = req.query;
    
    let providers = await Provider.find().populate('user', 'name avatar phone location').populate('category');
    
    let providersList = providers.map(p => ({
      id: p.user._id.toString(),
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
      distance: Math.random() * 5 + 0.5,
      experience: p.experience,
      verified: p.verified,
      rating: p.rating,
      reviewCount: p.reviewCount,
      jobsDone: p.jobsDone,
      serviceArea: p.serviceArea,
    }));
    
    if (profession) {
      providersList = providersList.filter(p => p.profession?.toLowerCase() === profession.toLowerCase());
    }
    
    if (search) {
      providersList = providersList.filter(p => 
        p.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.profession?.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    if (sort === 'rating') {
      providersList.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }
    
    if (sort === 'price_low') {
      providersList.sort((a, b) => (a.hourlyRate || 0) - (b.hourlyRate || 0));
    }
    
    if (sort === 'price_high') {
      providersList.sort((a, b) => (b.hourlyRate || 0) - (a.hourlyRate || 0));
    }
    
    for (let p of providersList) {
      const services = await Service.find({ provider: p.id });
      const portfolio = await Portfolio.find({ provider: p.id });
      const reviews = await Review.find({ provider: p.id });
      p.services = services;
      p.portfolio = portfolio;
      p.reviews = reviews;
    }
    
    res.json(providersList);
  } catch (error) {
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
    
    const provider = await Provider.findOne({ user: id }).populate('user', 'name avatar phone location email').populate('category');
    
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    
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
      rating: provider.rating,
      reviewCount: provider.reviewCount,
      jobsDone: provider.jobsDone,
      serviceArea: provider.serviceArea,
      services,
      portfolio,
      reviews,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getProviderReviews = async (req, res) => {
  try {
    const provider = await Provider.findOne({ user: req.params.id });
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    const reviews = await Review.find({ provider: provider._id }).populate('user', 'name avatar');
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
    res.status(500).json({ error: error.message });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (error) {
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
    res.status(500).json({ error: error.message });
  }
};