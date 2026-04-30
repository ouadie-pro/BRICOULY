const Booking = require('../models/Booking');
const Provider = require('../models/Provider');

const updateProviderJobsDone = async (providerId) => {
  try {
    const completedBookings = await Booking.countDocuments({ provider: providerId, status: 'completed' });
    await Provider.findByIdAndUpdate(providerId, { jobsDone: completedBookings });
  } catch (error) {
    console.error('Error updating provider jobsDone:', error);
  }
};

exports.getBookings = async (req, res) => {
  try {
    const userId = req.user.id; // Use authenticated user's ID from token
    const { status } = req.query;
    const userRole = req.user.role; // Get role from authenticated user
    
    let query = {};
    
    if (userRole === 'provider') {
      // Providers can only see bookings assigned to them
      const provider = await Provider.findOne({ user: userId });
      if (!provider) {
        return res.status(404).json({
          success: false,
          error: 'Provider profile not found',
        });
      }
      query.provider = provider._id;
    } else if (userRole === 'client') {
      // Clients can only see their own bookings
      query.user = userId;
    } else {
      return res.status(403).json({
        success: false,
        error: 'Invalid role for accessing bookings',
      });
    }

    if (status) {
      query.status = status;
    }

    const bookings = await Booking.find(query)
      .populate({ path: 'provider', populate: { path: 'user', select: 'name avatar email phone' } })
      .populate('user', 'name avatar email phone location')
      .sort({ createdAt: -1 });

    console.log(`[getBookings] ${userRole} ${userId} fetched ${bookings.length} bookings`);

    res.json({
      success: true,
      count: bookings.length,
      bookings,
      role: userRole, // Include role in response for frontend handling
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
    // Ensure only clients can create bookings (middleware already enforces this)
    const userId = req.user.id; // Use authenticated user's ID from token
    const userRole = req.user.role; // Get role from authenticated user
    
    if (userRole !== 'client') {
      return res.status(403).json({
        success: false,
        error: 'Only clients can create bookings',
      });
    }

    const providerDoc = await Provider.findOne({ user: req.body.provider });
    if (!providerDoc) return res.status(404).json({ success: false, error: 'Provider not found' });

    const bookingData = {
      service: req.body.service,
      date: req.body.date,
      time: req.body.time,
      address: req.body.address || '',
      notes: req.body.notes || '',
      price: req.body.price,
      user: userId,
      provider: providerDoc._id,
      status: 'pending',
    };

    console.log(`[createBooking] Client ${userId} creating booking for provider ${providerDoc._id}`);

    const booking = await Booking.create(bookingData);

    // Populate with full client information for provider visibility
    const populatedBooking = await Booking.findById(booking._id)
      .populate('user', 'name avatar email phone') // Full client info for provider
      .populate({
        path: 'provider',
        populate: { path: 'user', select: 'name avatar' },
      });

    console.log(`[createBooking] Booking ${booking._id} created successfully with client info`);

    const io = req.app.get('io');
    if (io) {
      const Notification = require('../models/Notification');
      await Notification.create({
        user: new (require('mongoose').Types.ObjectId)(req.body.provider),
        type: 'new_booking',
        title: 'New Booking Request',
        text: `${req.user.name} has requested a booking for ${bookingData.service}`,
        fromUser: new (require('mongoose').Types.ObjectId)(req.user.id),
      });
      io.to(`user:${req.body.provider.toString()}`).emit('notification', {
        type: 'new_booking',
        title: 'New Booking Request',
        text: `${req.user.name} has requested a booking for ${bookingData.service}`,
        fromUserId: req.user.id.toString(),
      });
    }

    res.status(201).json({
      success: true,
      booking: populatedBooking,
      message: 'Booking created successfully. The provider will be notified.',
    });
  } catch (error) {
    console.error('[createBooking] Error:', error.message, error.stack);
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

    const previousStatus = booking.status;
    
    if (status === 'completed' && previousStatus !== 'completed') {
      booking.completedAt = new Date();
      if (booking.provider) {
        await updateProviderJobsDone(booking.provider);
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
    const userId = req.user.id; // Use authenticated user's ID from token
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
      });
    }

    if (booking.user.toString() !== userId.toString()) {
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
