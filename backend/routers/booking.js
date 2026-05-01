const express = require('express');
const router = express.Router();
const { auth, requireClient, requireProvider } = require('../middleware/authMiddleware');
const { 
  getBookings, 
  getUnreadBookingsCount,
  createBooking, 
  updateBookingStatus, 
  cancelBooking,
  acceptBooking,
  rejectBooking,
  confirmBooking,
  completeBooking,
  getBookingById,
  getBookingMessages
} = require('../controllers/bookingController');

router.get('/', auth, getBookings);
router.get('/unread-count', auth, getUnreadBookingsCount);
router.post('/', auth, requireClient, createBooking);
router.put('/:id/status', auth, updateBookingStatus);
router.post('/:id/accept', auth, requireProvider, acceptBooking);
router.post('/:id/reject', auth, requireProvider, rejectBooking);
router.post('/:id/confirm', auth, confirmBooking);
router.post('/:id/complete', auth, completeBooking);
router.delete('/:id', auth, cancelBooking);
router.get('/:id', auth, getBookingById);
router.get('/:id/messages', auth, getBookingMessages);

module.exports = router;