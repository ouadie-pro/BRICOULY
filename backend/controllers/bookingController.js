const Booking = require('../models/Booking');

exports.getBookings = async (req, res) => {
  try {
    const userId = req.user.id;
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
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

exports.createBooking = async (req, res) => {
  try {
    const userId = req.user.id;
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

    if (status === 'completed') {
      booking.completedAt = new Date();
    }

    booking.status = status;
    await booking.save();

    res.json({
      success: true,
      booking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const userId = req.user.id;
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
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
