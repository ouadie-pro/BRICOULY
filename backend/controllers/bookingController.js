const Booking = require('../models/Booking');

exports.getBookings = async (req, res) => {
  try {
    console.log('[getBookings] Request received', { headers: req.headers });
    const userId = req.headers['x-user-id'];
    console.log('[getBookings] userId:', userId);
    const { status, role } = req.query;
    
    let query = {};
    
    if (role === 'provider') {
      const Provider = require('../models/Provider');
      const provider = await Provider.findOne({ user: userId });
      if (provider) {
        query.provider = provider._id;
      }
    } else {
      query.user = userId;
    }

    if (status) {
      query.status = status;
    }

    const bookings = await Booking.find(query)
      .populate('user', 'name avatar email phone')
      .populate({
        path: 'provider',
        populate: { path: 'user', select: 'name avatar' },
      })
      .sort({ date: -1 });

    res.json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error('[getBookings] Error:', error.message, error.stack);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

exports.createBooking = async (req, res) => {
  try {
    const userId = req.headers['x-user-id']; // FIXED: #1 - Use x-user-id header
    const bookingData = {
      ...req.body,
      user: userId,
    };

    const booking = await Booking.create(bookingData);

    const populatedBooking = await Booking.findById(booking._id)
      .populate('user', 'name avatar email phone')
      .populate({
        path: 'provider',
        populate: { path: 'user', select: 'name avatar' },
      });

    res.status(201).json({
      success: true,
      booking: populatedBooking,
    });
  } catch (error) {
    console.error('[getBookings] Error:', error.message, error.stack);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

exports.updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
      });
    }

    // FIXED: #9 - Increment jobsDone and recalculate successRate on completion
    if (status === 'completed') {
      booking.completedAt = new Date();
      
      // Find and update the provider's jobsDone and successRate
      if (booking.provider) {
        const Provider = require('../models/Provider');
        const totalBookings = await Booking.countDocuments({ provider: booking.provider });
        const completedBookings = await Booking.countDocuments({ 
          provider: booking.provider, 
          status: 'completed' 
        });
        
        const successRate = totalBookings > 0 ? Math.round((completedBookings / totalBookings) * 100) : 95;
        
        await Provider.findByIdAndUpdate(booking.provider, {
          $inc: { jobsDone: 1 },
          successRate: successRate,
        });
      }
    }

    booking.status = status;
    await booking.save();

    res.json({
      success: true,
      booking,
    });
  } catch (error) {
    console.error('[getBookings] Error:', error.message, error.stack);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const userId = req.headers['x-user-id']; // FIXED: #1 - Use x-user-id header
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
      });
    }

    if (booking.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to cancel this booking',
      });
    }

    booking.status = 'cancelled';
    await booking.save();

    res.json({
      success: true,
      booking,
    });
  } catch (error) {
    console.error('[getBookings] Error:', error.message, error.stack);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
