const User = require('../models/User');
const Provider = require('../models/Provider');
const Service = require('../models/Service');

// GET SERVICES FOR A PROVIDER
exports.getProviderServices = async (req, res) => {
  try {
    const { id } = req.params;
    const mongoose = require('mongoose');
    
    console.log('[getProviderServices] Looking for services for provider ID:', id);
    
    // Find provider by user ID first, then by provider _id
    let provider = await Provider.findOne({ user: id });
    if (!provider && mongoose.Types.ObjectId.isValid(id)) {
      provider = await Provider.findById(id);
    }
    
    if (!provider) {
      console.log('[getProviderServices] Provider not found');
      return res.status(404).json({ error: 'Provider not found' });
    }
    
    const services = await Service.find({ provider: provider._id });
    console.log('[getProviderServices] Found services:', services.length);
    
    res.json(services);
  } catch (error) {
    console.error('[getProviderServices] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// CREATE A NEW SERVICE (only for the authenticated provider)
exports.createService = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const userId = req.user.id.toString();
    
    console.log('[createService] User ID:', userId);
    
    const provider = await Provider.findOne({ user: userId });
    if (!provider) {
      return res.status(403).json({ error: 'Only providers can add services' });
    }
    
    const { name, description, price, category } = req.body;
    
    if (!name || !price) {
      return res.status(400).json({ error: 'Service name and price are required' });
    }
    
    const service = await Service.create({
      provider: provider._id,
      name,
      description: description || '',
      price: parseFloat(price),
      category: category || 'other',
    });
    
    console.log('[createService] Created service:', service._id);
    
    res.json({ 
      success: true, 
      service: {
        id: service._id.toString(),
        name: service.name,
        description: service.description,
        price: service.price,
        category: service.category,
        createdAt: service.createdAt
      }
    });
  } catch (error) {
    console.error('[createService] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// UPDATE A SERVICE
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
    
    res.json({ 
      success: true, 
      service: {
        id: service._id.toString(),
        name: service.name,
        description: service.description,
        price: service.price,
        category: service.category
      }
    });
  } catch (error) {
    console.error('[updateService] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// DELETE A SERVICE
exports.deleteService = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const userId = req.user.id.toString();
    
    const provider = await Provider.findOne({ user: userId });
    if (!provider) {
      return res.status(403).json({ error: 'Only providers can delete services' });
    }
    
    const service = await Service.findOneAndDelete({ 
      _id: req.params.id, 
      provider: provider._id 
    });
    
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('[deleteService] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
};