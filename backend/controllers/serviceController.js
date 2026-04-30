const User = require('../models/User');
const Provider = require('../models/Provider');
const Service = require('../models/Service');

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

exports.createService = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'User not found' });
    const userId = req.user.id.toString();
    const provider = await Provider.findOne({ user: userId });
    if (!provider) {
      return res.status(403).json({ error: 'Only providers can add services' });
    }
    
    const { name, description, price, category } = req.body;
    
    const service = await Service.create({
      provider: provider._id,
      name,
      description,
      price: parseInt(price),
      category: category || 'other',
    });
    
    res.json({ success: true, service });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateService = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const userId = req.user.id.toString();
    const provider = await Provider.findOne({ user: userId });
    
    if (!provider) {
      return res.status(403).json({ error: 'Only providers can update services' });
    }
    
    const service = await Service.findOneAndUpdate(
      { _id: req.params.id, provider: provider._id },
      req.body,
      { new: true }
    );
    
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    res.json({ success: true, service });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteService = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const userId = req.user.id.toString();
    const provider = await Provider.findOne({ user: userId });
    
    if (!provider) {
      return res.status(403).json({ error: 'Only providers can delete services' });
    }
    
    const service = await Service.findOneAndDelete({ _id: req.params.id, provider: provider._id });
    
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};