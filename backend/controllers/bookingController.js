const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const Provider = require('../models/Provider');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Message = require('../models/Message');

const createNotification = async (userId, type, title, text, fromUserId, bookingId = null) => {
  try {
    const notificationData = {
      user: new mongoose.Types.ObjectId(userId),
      type,
      title,
      text,
      fromUser: fromUserId ? new mongoose.Types.ObjectId(fromUserId) : null,
    };
    if (bookingId) notificationData.bookingId = bookingId;
    await Notification.create(notificationData);
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

const updateProviderStats = async (providerId) => {
  try {
    const [completedBookings, reviews] = await Promise.all([
      Booking.countDocuments({ provider: providerId, status: 'completed' }),
      require('../models/Review').find({ provider: providerId })
    ]);
    
    const jobsDone = completedBookings;
    let rating = 0;
    let reviewCount = reviews.length;
    
    if (reviews.length > 0) {
      const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
      rating = Math.round((sum / reviews.length) * 10) / 10;
    }
    
    await Provider.findByIdAndUpdate(providerId, { rating, reviewCount, jobsDone });
  } catch (error) {
    console.error('Error updating provider stats:', error);
  }
};

exports.getBookings = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    
    const userId = req.user.id;
    const userRole = req.user.role;
    const { status, page = 1, limit = 20 } = req.query;
    
    let query = {};
    
    if (userRole === 'provider') {
      const provider = await Provider.findOne({ user: userId });
      if (!provider) {
        return res.status(404).json({ success: false, error: 'Provider profile not found' });
      }
      query.provider = provider._id;
    } else if (userRole === 'client') {
      query.user = userId;
    } else {
      return res.status(403).json({ success: false, error: 'Invalid role for accessing bookings' });
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Booking.countDocuments(query);
    
    const bookings = await Booking.find(query)
      .populate({ path: 'provider', populate: { path: 'user', select: '_id name avatar email phone' } })
      .populate('user', 'name avatar email phone location')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    if (userRole === 'provider') {
      await Booking.updateMany(
        { provider: query.provider, providerSeen: false, status: { $in: ['pending', 'accepted'] } },
        { providerSeen: true }
      );
    } else if (userRole === 'client') {
      await Booking.updateMany({ user: userId, clientSeen: false }, { clientSeen: true });
    }

    res.json({
      success: true,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / parseInt(limit)),
      bookings,
    });
  } catch (error) {
    console.error('[getBookings] Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getUnreadBookingsCount = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    
    const userId = req.user.id;
    const userRole = req.user.role;
    let count = 0;
    
    if (userRole === 'provider') {
      const provider = await Provider.findOne({ user: userId });
      if (provider) {
        count = await Booking.countDocuments({ provider: provider._id, providerSeen: false, status: 'pending' });
      }
    } else if (userRole === 'client') {
      count = await Booking.countDocuments({ user: userId, clientSeen: false });
    }
    
    res.json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createBooking = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    
    const userId = req.user.id;
    const userRole = req.user.role;
    
    if (userRole !== 'client') {
      return res.status(403).json({ success: false, error: 'Only clients can create bookings' });
    }
    
    const { provider: providerUserId, service, serviceId, date, time, address, notes, price } = req.body;
    
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
    
    const bookingDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (bookingDate < today) {
      return res.status(400).json({ success: false, error: 'Cannot book a date in the past' });
    }
    
    const providerDoc = await Provider.findOne({ user: providerUserId });
    if (!providerDoc) {
      return res.status(404).json({ success: false, error: 'Provider not found' });
    }
    
    if (providerDoc.available === false) {
      return res.status(400).json({
        success: false,
        error: 'This provider is currently unavailable for new bookings',
      });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    const bookingData = {
      service,
      serviceId: serviceId || null,
      date: bookingDate,
      time,
      address: address || '',
      notes: notes || '',
      price: parseFloat(price),
      user: new mongoose.Types.ObjectId(userId),
      provider: providerDoc._id,
      status: 'pending',
      clientSeen: true,
      providerSeen: false,
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
      await createNotification(
        providerUserId,
        'new_booking',
        'New Booking Request',
        `${user.name} requested "${service}" on ${new Date(date).toLocaleDateString()} at ${time}`,
        userId,
        booking._id
      );
      
      io.to(`user:${providerUserId}`).emit('new_booking_notification', {
        bookingId: booking._id,
        service: service,
        clientName: user.name,
        date: new Date(date).toLocaleDateString(),
        time: time,
        message: `New booking request for ${service}`,
      });
      
      io.to(`user:${providerUserId}`).emit('notification', {
        type: 'new_booking',
        title: 'New Booking Request',
        text: `${user.name} requested a booking for ${service}`,
        fromUserId: userId,
        bookingId: booking._id,
      });
      
      io.to(`user:${providerUserId}`).emit('booking_status_update', {
        bookingId: booking._id,
        status: 'pending',
        message: 'New booking request received',
      });
    }
    
    res.status(201).json({
      success: true,
      booking: populatedBooking,
      message: 'Booking created successfully. The provider will be notified.',
    });
  } catch (error) {
    console.error('[createBooking] Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateBookingStatus = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    
    const { id } = req.params;
    const { status, rejectReason, rescheduleDate, rescheduleTime } = req.body;
    
    const validStatuses = ['pending', 'accepted', 'rejected', 'confirmed', 'in_progress', 'completed', 'cancelled'];
    
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }
    
    const booking = await Booking.findById(id)
      .populate('user', 'name email')
      .populate({
        path: 'provider',
        populate: { path: 'user', select: 'name email' },
      });
    
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }
    
    const userId = req.user.id;
    const userRole = req.user.role;
    const userName = req.user.name;
    
    let isAuthorized = false;
    let clientId = null;
    let providerUserId = null;
    
    if (userRole === 'provider') {
      const provider = await Provider.findOne({ user: userId });
      if (provider && booking.provider._id.toString() === provider._id.toString()) {
        isAuthorized = true;
        clientId = booking.user._id.toString();
        providerUserId = userId;
      }
    } else if (userRole === 'client') {
      if (booking.user._id.toString() === userId.toString()) {
        isAuthorized = true;
        clientId = userId;
        providerUserId = booking.provider.user._id.toString();
        if (status !== 'cancelled' && status !== 'completed') {
          return res.status(403).json({
            success: false,
            error: 'Clients can only cancel or complete bookings',
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
    
    if (previousStatus === 'cancelled' || previousStatus === 'completed') {
      return res.status(400).json({
        success: false,
        error: `Cannot change status of a ${previousStatus} booking`,
      });
    }
    
    const statusMessages = {
      accepted: 'Your booking request has been accepted! The provider will contact you soon.',
      rejected: `Your booking request was declined. Reason: ${rejectReason || 'Not specified'}`,
      confirmed: 'Your booking has been confirmed!',
      in_progress: 'Your service has started!',
      completed: 'Great news! Your service has been marked as completed.',
      cancelled: 'Your booking has been cancelled.',
    };
    
    booking.status = status;
    booking.providerSeen = false;
    booking.clientSeen = false;
    
    if (status === 'rejected' && rejectReason) {
      booking.rejectReason = rejectReason;
    }
    
    if (status === 'cancelled') {
      booking.cancelledAt = new Date();
    }
    
    if (status === 'completed') {
      booking.completedAt = new Date();
      if (booking.provider) {
        await updateProviderStats(booking.provider._id);
      }
    }
    
    if (status === 'in_progress') {
      booking.startedAt = new Date();
    }
    
    if (rescheduleDate || rescheduleTime) {
      booking.rescheduleRequest = {
        requestedDate: rescheduleDate ? new Date(rescheduleDate) : null,
        requestedTime: rescheduleTime || null,
        reason: req.body.rescheduleReason || '',
        status: 'pending',
      };
      booking.status = 'pending';
    }
    
    await booking.save();
    
    const io = req.app.get('io');
    if (io) {
      const notifUserId = userRole === 'provider' ? clientId : providerUserId;
      const notifTitle = `Booking ${status.charAt(0).toUpperCase() + status.slice(1)}`;
      
      await createNotification(
        notifUserId,
        `booking_${status}`,
        notifTitle,
        statusMessages[status] || `Booking has been ${status}`,
        userId,
        booking._id
      );
      
      io.to(`user:${notifUserId}`).emit('booking_status_update', {
        bookingId: booking._id,
        status: status,
        message: statusMessages[status],
        previousStatus,
      });
      
      io.to(`user:${notifUserId}`).emit('notification', {
        type: `booking_${status}`,
        title: notifTitle,
        text: statusMessages[status],
        fromUserId: userId,
        bookingId: booking._id,
      });
      
      if (status === 'cancelled') {
        const otherUserId = userRole === 'provider' ? providerUserId : clientId;
        io.to(`user:${otherUserId}`).emit('booking_status_update', {
          bookingId: booking._id,
          status: 'cancelled',
          message: 'A booking has been cancelled',
        });
      }
    }
    
    const updatedBooking = await Booking.findById(id)
      .populate('user', 'name avatar email')
      .populate({
        path: 'provider',
        populate: { path: 'user', select: 'name avatar email' },
      });
    
    res.json({
      success: true,
      booking: updatedBooking,
      message: statusMessages[status] || `Booking ${status} successfully`,
    });
  } catch (error) {
    console.error('[updateBookingStatus] Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.acceptBooking = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'provider') {
      return res.status(403).json({ success: false, error: 'Only providers can accept bookings' });
    }
    
    const { id } = req.params;
    
    const booking = await Booking.findById(id).populate('user', 'name email');
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }
    
    const provider = await Provider.findOne({ user: req.user.id });
    if (!provider || booking.provider.toString() !== provider._id.toString()) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }
    
    if (booking.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'Can only accept pending bookings' });
    }
    
    booking.status = 'accepted';
    booking.providerSeen = true;
    await booking.save();
    
    const io = req.app.get('io');
    if (io) {
      await createNotification(
        booking.user._id,
        'booking_accepted',
        'Booking Accepted',
        `${req.user.name} has accepted your booking request for ${booking.service}`,
        req.user.id,
        booking._id
      );
      
      io.to(`user:${booking.user._id}`).emit('booking_accepted', {
        bookingId: booking._id,
        service: booking.service,
        providerName: req.user.name,
        message: 'Your booking has been accepted!',
      });
    }
    
    const updatedBooking = await Booking.findById(id)
      .populate('user', 'name avatar email')
      .populate({ path: 'provider', populate: { path: 'user', select: 'name avatar email' } });
    
    res.json({ success: true, booking: updatedBooking, message: 'Booking accepted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.rejectBooking = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'provider') {
      return res.status(403).json({ success: false, error: 'Only providers can reject bookings' });
    }
    
    const { id } = req.params;
    const { reason } = req.body;
    
    const booking = await Booking.findById(id).populate('user', 'name email');
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }
    
    const provider = await Provider.findOne({ user: req.user.id });
    if (!provider || booking.provider.toString() !== provider._id.toString()) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }
    
    if (booking.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'Can only reject pending bookings' });
    }
    
    booking.status = 'rejected';
    booking.rejectReason = reason || 'No reason provided';
    await booking.save();
    
    const io = req.app.get('io');
    if (io) {
      await createNotification(
        booking.user._id,
        'booking_rejected',
        'Booking Declined',
        `${req.user.name} has declined your booking request. Reason: ${booking.rejectReason}`,
        req.user.id,
        booking._id
      );
      
      io.to(`user:${booking.user._id}`).emit('booking_rejected', {
        bookingId: booking._id,
        service: booking.service,
        reason: booking.rejectReason,
        message: 'Your booking request was declined',
      });
    }
    
    const updatedBooking = await Booking.findById(id)
      .populate('user', 'name avatar email')
      .populate({ path: 'provider', populate: { path: 'user', select: 'name avatar email' } });
    
    res.json({ success: true, booking: updatedBooking, message: 'Booking rejected' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.confirmBooking = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    
    const { id } = req.params;
    
    const booking = await Booking.findById(id).populate('user', 'name email');
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }
    
    const userId = req.user.id;
    const userRole = req.user.role;
    
    let isAuthorized = false;
    let otherUserId = null;
    
    if (userRole === 'provider') {
      const provider = await Provider.findOne({ user: userId });
      if (provider && booking.provider.toString() === provider._id.toString()) {
        isAuthorized = true;
        otherUserId = booking.user._id;
      }
    } else if (userRole === 'client') {
      if (booking.user.toString() === userId.toString()) {
        isAuthorized = true;
        const provider = await Provider.findById(booking.provider);
        otherUserId = provider?.user;
      }
    }
    
    if (!isAuthorized) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }
    
    if (booking.status !== 'accepted' && booking.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'Can only confirm accepted or pending bookings' });
    }
    
    booking.status = 'confirmed';
    await booking.save();
    
    const io = req.app.get('io');
    if (io) {
      await createNotification(
        otherUserId,
        'booking_confirmed',
        'Booking Confirmed',
        `Your booking for ${booking.service} on ${booking.date.toLocaleDateString()} has been confirmed!`,
        userId,
        booking._id
      );
      
      io.to(`user:${otherUserId}`).emit('booking_confirmed', {
        bookingId: booking._id,
        service: booking.service,
        date: booking.date,
        time: booking.time,
        message: 'Booking confirmed!',
      });
    }
    
    const updatedBooking = await Booking.findById(id)
      .populate('user', 'name avatar email')
      .populate({ path: 'provider', populate: { path: 'user', select: 'name avatar email' } });
    
    res.json({ success: true, booking: updatedBooking, message: 'Booking confirmed' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.completeBooking = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    
    const { id } = req.params;
    
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }
    
    const provider = await Provider.findOne({ user: req.user.id });
    const isProvider = provider && booking.provider.toString() === provider._id.toString();
    const isClient = booking.user.toString() === req.user.id.toString();
    
    if (!isProvider && !isClient) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }
    
    if (booking.status !== 'confirmed' && booking.status !== 'in_progress') {
      return res.status(400).json({ success: false, error: 'Can only complete confirmed or in-progress bookings' });
    }
    
    booking.status = 'completed';
    booking.completedAt = new Date();
    await booking.save();
    
    await updateProviderStats(booking.provider);
    
    const io = req.app.get('io');
    if (io) {
      const otherUserId = isProvider ? booking.user : (await Provider.findById(booking.provider)).user;
      await createNotification(
        otherUserId,
        'booking_completed',
        'Service Completed',
        `The service "${booking.service}" has been marked as completed.`,
        req.user.id,
        booking._id
      );
      
      io.to(`user:${otherUserId}`).emit('booking_completed', {
        bookingId: booking._id,
        service: booking.service,
        message: 'Service completed! Please leave a review.',
      });
    }
    
    const updatedBooking = await Booking.findById(id)
      .populate('user', 'name avatar email')
      .populate({ path: 'provider', populate: { path: 'user', select: 'name avatar email' } });
    
    res.json({ success: true, booking: updatedBooking, message: 'Booking marked as completed' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    
    const { id } = req.params;
    
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }
    
    if (booking.user.toString() !== req.user.id.toString()) {
      const provider = await Provider.findOne({ user: req.user.id });
      if (!provider || booking.provider.toString() !== provider._id.toString()) {
        return res.status(403).json({ success: false, error: 'Not authorized to cancel this booking' });
      }
    }
    
    if (booking.status === 'completed') {
      return res.status(400).json({ success: false, error: 'Cannot cancel a completed booking' });
    }
    
    if (booking.status === 'cancelled') {
      return res.status(400).json({ success: false, error: 'Booking is already cancelled' });
    }
    
    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    await booking.save();
    
    const io = req.app.get('io');
    if (io) {
      let otherUserId = booking.user.toString() === req.user.id.toString()
        ? (await Provider.findById(booking.provider)).user
        : booking.user;
      
      await createNotification(
        otherUserId,
        'booking_cancelled',
        'Booking Cancelled',
        `A booking for ${booking.service} has been cancelled.`,
        req.user.id,
        booking._id
      );
      
      io.to(`user:${otherUserId}`).emit('booking_cancelled', {
        bookingId: booking._id,
        service: booking.service,
        message: 'Booking has been cancelled',
      });
    }
    
    const updatedBooking = await Booking.findById(id)
      .populate('user', 'name avatar email')
      .populate({ path: 'provider', populate: { path: 'user', select: 'name avatar email' } });
    
    res.json({ success: true, booking: updatedBooking, message: 'Booking cancelled' });
  } catch (error) {
    console.error('[cancelBooking] Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const booking = await Booking.findById(id)
      .populate('user', 'name avatar email phone')
      .populate({
        path: 'provider',
        populate: { path: 'user', select: 'name avatar email phone profession hourlyRate rating' },
      });
    
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }
    
    res.json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getBookingMessages = async (req, res) => {
  try {
    const { id } = req.params;
    
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }
    
    const messages = await Message.find({ conversationId: booking.chatRoomId })
      .populate('sender', 'name avatar')
      .sort({ createdAt: 1 });
    
    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};