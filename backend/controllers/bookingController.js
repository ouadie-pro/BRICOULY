// backend/controllers/bookingController.js - Add these improvements

// Add at the top of the file
const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const Provider = require('../models/Provider');
const User = require('../models/User');
const Booking = require('../models/Booking');

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
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    
    const userId = req.user.id;
    const userRole = req.user.role;
    const { status } = req.query;
    
    let query = {};
    
    if (userRole === 'provider') {
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
    
    // Validate required fields
    const missingFields = [];
    if (!providerUserId) missingFields.push('provider');
    if (!service) missingFields.push('service');
    if (!date) missingFields.push('date');
    if (!time) missingFields.push('time');
    if (!price) missingFields.push('price');
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`,
      });
    }
    
    // Validate date is not in the past
    const bookingDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (bookingDate < today) {
      return res.status(400).json({
        success: false,
        error: 'Cannot book a date in the past',
      });
    }
    
    // Find provider document by user ID
    const providerDoc = await Provider.findOne({ user: providerUserId });
    if (!providerDoc) {
      return res.status(404).json({ success: false, error: 'Provider not found' });
    }
    
    // Check if provider is available
    if (providerDoc.available === false) {
      return res.status(400).json({
        success: false,
        error: 'This provider is currently unavailable for new bookings',
      });
    }
    
    const bookingData = {
      service,
      date: bookingDate,
      time,
      address: address || '',
      notes: notes || '',
      price: parseFloat(price),
      user: new mongoose.Types.ObjectId(userId),
      provider: providerDoc._id,
      status: 'pending',
    };
    
    const booking = await Booking.create(bookingData);
    
    const populatedBooking = await Booking.findById(booking._id)
      .populate('user', 'name avatar email phone')
      .populate({
        path: 'provider',
        populate: { path: 'user', select: 'name avatar email phone' },
      });
    
    const io = req.app.get('io');
    if (io) {
      // Create notification for provider
      await Notification.create({
        user: new mongoose.Types.ObjectId(providerUserId),
        type: 'new_booking',
        title: 'New Booking Request',
        text: `${req.user.name} requested "${service}" on ${new Date(date).toLocaleDateString()} at ${time}`,
        fromUser: new mongoose.Types.ObjectId(userId),
      });
      
      // Emit socket event
      io.to(`user:${providerUserId}`).emit('new_booking_notification', {
        bookingId: booking._id,
        service: service,
        clientName: req.user.name,
        date: new Date(date).toLocaleDateString(),
        time: time,
        message: `New booking request for ${service}`,
      });
      
      io.to(`user:${providerUserId}`).emit('notification', {
        type: 'new_booking',
        title: 'New Booking Request',
        text: `${req.user.name} requested a booking for ${service}`,
        fromUserId: userId,
        bookingId: booking._id,
      });
    }
    
    res.status(201).json({
      success: true,
      booking: populatedBooking,
      message: 'Booking created successfully. The provider will be notified.',
    });
  } catch (error) {
    console.error('[createBooking] Error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Improved updateBookingStatus with better validation
exports.updateBookingStatus = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
    
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }
    
    const booking = await Booking.findById(req.params.id)
      .populate('user', 'name email')
      .populate({
        path: 'provider',
        populate: { path: 'user', select: 'name email' },
      });
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
      });
    }
    
    // Check authorization
    const userId = req.user.id;
    const userRole = req.user.role;
    
    let isAuthorized = false;
    let clientId = null;
    
    if (userRole === 'provider') {
      const provider = await Provider.findOne({ user: userId });
      if (provider && booking.provider._id.toString() === provider._id.toString()) {
        isAuthorized = true;
        clientId = booking.user._id.toString();
      }
    } else if (userRole === 'client') {
      if (booking.user._id.toString() === userId.toString()) {
        isAuthorized = true;
        // Clients can only cancel their bookings
        if (status !== 'cancelled') {
          return res.status(403).json({
            success: false,
            error: 'Clients can only cancel bookings',
          });
        }
      }
    }
    
    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this booking',
      });
    }
    
    const previousStatus = booking.status;
    
    // Prevent invalid status transitions
    if (previousStatus === 'cancelled' || previousStatus === 'completed') {
      return res.status(400).json({
        success: false,
        error: `Cannot change status of a ${previousStatus} booking`,
      });
    }
    
    booking.status = status;
    
    if (status === 'completed' && previousStatus !== 'completed') {
      booking.completedAt = new Date();
      if (booking.provider) {
        await updateProviderJobsDone(booking.provider._id);
      }
    }
    
    await booking.save();
    
    // Emit Socket.IO events for status updates
    const io = req.app.get('io');
    if (io && clientId) {
      const statusMessages = {
        confirmed: 'Your booking has been confirmed! The provider will contact you soon.',
        completed: 'Great news! Your service has been marked as completed.',
        cancelled: 'Your booking has been cancelled.',
      };
      
      if (statusMessages[status]) {
        io.to(`user:${clientId}`).emit('booking_status_updated', {
          bookingId: booking._id,
          status: status,
          message: statusMessages[status],
        });
        
        // Create notification for client
        await Notification.create({
          user: new mongoose.Types.ObjectId(clientId),
          type: `booking_${status}`,
          title: `Booking ${status.charAt(0).toUpperCase() + status.slice(1)}`,
          text: statusMessages[status],
          fromUser: new mongoose.Types.ObjectId(userId),
        });
      }
    }
    
    res.json({
      success: true,
      booking,
      message: `Booking ${status} successfully`,
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
        io.to(`user:${provider.user.toString()}`).emit('booking_status_updated', {
          bookingId: booking._id,
          status: 'cancelled',
          message: 'A booking has been cancelled by the client',
        });
        await Notification.create({
          user: provider.user,
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