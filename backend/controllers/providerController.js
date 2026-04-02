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
    const { search, category, sort, lat, lng } = req.query;
    
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
    } else if (sort === 'distance' && lat && lng) {
      sortOption = { distance: 1 };
    }

    const providers = await Provider.find(query)
      .populate('user', 'name avatar phone location')
      .populate('category')
      .sort(sortOption);

    const providersList = await Promise.all(providers.map(async p => {
      const stats = await calculateProviderStats(p._id);
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
        distance: p.distance || 1.0,
        experience: p.experience,
        verified: p.verified,
        rating: stats.rating,
        reviewCount: stats.reviewCount,
        jobsDone: stats.jobsDone,
        serviceArea: p.serviceArea,
      };
    }));

    res.json(providersList);
  } catch (error) {
    res.status(500).json({ error: error.message });
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
    const userId = req.headers['x-user-id']; // FIXED: #1 - Use x-user-id header
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
