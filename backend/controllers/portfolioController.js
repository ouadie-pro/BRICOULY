const Provider = require('../models/Provider');
const Portfolio = require('../models/Portfolio');
const User = require('../models/User');

exports.getProviderPortfolio = async (req, res) => {
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

exports.createPortfolio = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    const provider = await Provider.findOne({ user: userId });
    if (!provider) {
      return res.status(403).json({ error: 'Only providers can add portfolio' });
    }
    
    const { imageUrl, caption } = req.body;
    
    const portfolio = await Portfolio.create({
      provider: provider._id,
      imageUrl,
      caption: caption || '',
    });
    
    res.json({ success: true, portfolio });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deletePortfolio = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const provider = await Provider.findOne({ user: userId });
    
    if (!provider) {
      return res.status(403).json({ error: 'Only providers can delete portfolio' });
    }
    
    const portfolio = await Portfolio.findOneAndDelete({ _id: req.params.id, provider: provider._id });
    
    if (!portfolio) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.uploadPortfolio = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    const provider = await Provider.findOne({ user: userId });
    if (!provider) {
      return res.status(403).json({ error: 'Only providers can upload portfolio' });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const { caption } = req.body;
    const imageUrl = `/uploads/${req.file.filename}`;
    
    const portfolio = await Portfolio.create({
      provider: provider._id,
      imageUrl,
      caption: caption || '',
    });
    
    res.json({ success: true, portfolio });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};