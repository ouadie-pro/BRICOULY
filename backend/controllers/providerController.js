const Provider = require('../models/Provider');
const User = require('../models/User');

exports.getProviders = async (req, res) => {
  try {
    const { search, category, sort } = req.query;
    
    let query = { available: true };

    if (search) {
      query.$or = [
        { profession: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } },
      ];
    }

    if (category) {
      query.category = category;
    }

    let sortOption = { rating: -1 };
    if (sort === 'price') {
      sortOption = { hourlyRate: 1 };
    } else if (sort === 'distance') {
      sortOption = { distance: 1 };
    }

    const providers = await Provider.find(query)
      .populate('user', 'name avatar')
      .sort(sortOption);

    res.json({
      success: true,
      count: providers.length,
      providers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
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
    const providerData = {
      ...req.body,
      user: req.user.id,
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
