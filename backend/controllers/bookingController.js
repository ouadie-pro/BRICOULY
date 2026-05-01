// backend/controllers/bookingController.js
const Booking = require('../models/Booking');
const Provider = require('../models/Provider');
const User = require('../models/User');

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
    // Get user from JWT token (attached by auth middleware)
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    
    const userId = req.user.id;
    const userRole = req.user.role;
    const { status } = req.query;
    
    let query = {};
    
    if (userRole === 'provider') {
      // Find provider document for this user
      const provider = await Provider.findOne({ user: userId });
      if (!provider) {
        return res.status(404).json({
          success: false,
          error: 'Provider profile not found',
        });
      }
      query.provider = provider._id;
    } else if (userRole === 'client') {
      query.user = userId;
    } else {
      return res.status(403).json({
        success: false,
        error: 'Invalid role for accessing bookings',
      });
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    const bookings = await Booking.find(query)
      .populate({ path: 'provider', populate: { path: 'user', select: '_id name avatar email phone' } })
      .populate('user', 'name avatar email phone location')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error('[getBookings] Error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

exports.createBooking = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    
    const userId = req.user.id;
    const userRole = req.user.role;
    
    if (userRole !== 'client') {
      return res.status(403).json({
        success: false,
        error: 'Only clients can create bookings',
      });
    }
    
    const { provider: providerUserId, service, date, time, address, notes, price } = req.body;
    
    if (!providerUserId || !service || !date || !time || !price) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: provider, service, date, time, price',
      });
    }
    
    // Find provider document by user ID
    const providerDoc = await Provider.findOne({ user: providerUserId });
    if (!providerDoc) {
      return res.status(404).json({ success: false, error: 'Provider not found' });
    }
    
    const bookingData = {
      service,
      date: new Date(date),
      time,
      address: address || '',
      notes: notes || '',
      price: parseFloat(price),
      user: userId,
      provider: providerDoc._id,
      status: 'pending',
    };
    
    const booking = await Booking.create(bookingData);
    
    const populatedBooking = await Booking.findById(booking._id)
      .populate('user', 'name avatar email phone')
      .populate({
        path: 'provider',
        populate: { path: 'user', select: 'name avatar' },
      });
    
    const io = req.app.get('io');
    if (io) {
      const Notification = require('../models/Notification');
      await Notification.create({
        user: providerUserId,
        type: 'new_booking',
        title: 'New Booking Request',
        text: `${req.user.name} has requested a booking for ${service}`,
        fromUser: userId,
      });
      io.to(`user:${providerUserId}`).emit('notification', {
        type: 'new_booking',
        title: 'New Booking Request',
        text: `${req.user.name} has requested a booking for ${service}`,
        fromUserId: userId,
      });
      // Emit booking notification with client name
      io.to(`user:${providerUserId}`).emit('new_booking_notification', {
        bookingId: booking._id,
        service: service,
        clientName: req.user.name,
        message: `New booking request for ${service}`,
      });
    }
    
    res.status(201).json({
      success: true,
      booking: populatedBooking,
      message: 'Booking created successfully.',
    });
  } catch (error) {
    console.error('[createBooking] Error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

exports.updateBookingStatus = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    
    const { status } = req.body;
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
      });
    }
    
    // Check authorization
    const userId = req.user.id;
    const userRole = req.user.role;
    
    if (userRole === 'provider') {
      const provider = await Provider.findOne({ user: userId });
      if (!provider || booking.provider.toString() !== provider._id.toString()) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to update this booking',
        });
      }
    } else if (userRole === 'client') {
      if (booking.user.toString() !== userId.toString()) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to update this booking',
        });
      }
      // Clients can only cancel their bookings
      if (status !== 'cancelled') {
        return res.status(403).json({
          success: false,
          error: 'Clients can only cancel bookings',
        });
      }
    } else {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
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

    // Emit Socket.IO events for status updates
    const io = req.app.get('io');
    if (io) {
      const clientId = booking.user.toString();
      if (status === 'confirmed') {
        io.to(`user:${clientId}`).emit('booking_status_updated', {
          bookingId: booking._id,
          status: 'confirmed',
          message: 'Your booking has been confirmed',
        });
      }
      if (status === 'completed') {
        io.to(`user:${clientId}`).emit('booking_status_updated', {
          bookingId: booking._id,
          status: 'completed',
          message: 'Your service has been marked as completed',
        });
      }
    }
    
    res.json({
      success: true,
      booking,
    });
  } catch (error) {
    console.error('[updateBookingStatus] Error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    
    const userId = req.user.id;
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
    
    // Notify provider
    const io = req.app.get('io');
    if (io) {
      const provider = await Provider.findById(booking.provider);
      if (provider && provider.user) {
        io.to(`user:${provider.user.toString()}`).emit('notification', {
          type: 'booking_cancelled',
          title: 'Booking Cancelled',
          text: `A booking has been cancelled by the client`,
        });
      }
    }
    
    res.json({
      success: true,
      booking,
    });
  } catch (error) {
    console.error('[cancelBooking] Error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};