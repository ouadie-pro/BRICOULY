const express = require('express');
const router = express.Router();
const { auth, requireClient, requireProvider } = require('../middleware/authMiddleware');
const { getBookings, createBooking, updateBookingStatus, cancelBooking } = require('../controllers/bookingController');

// Both clients and providers can view bookings (with different data based on role)
router.get('/', auth, getBookings);
// Only clients can create bookings
router.post('/', auth, requireClient, createBooking);
// Both can update booking status (providers can confirm/complete, clients can cancel)
router.put('/:id', auth, updateBookingStatus);
// Both can cancel bookings (handled inside controller by role)
router.delete('/:id', auth, cancelBooking);

module.exports = router;
