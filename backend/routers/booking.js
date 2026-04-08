const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/authMiddleware');
const { getBookings, createBooking, updateBookingStatus, cancelBooking } = require('../controllers/bookingController');

router.get('/', auth, getBookings);
router.post('/', auth, createBooking);
router.put('/:id', auth, updateBookingStatus);
router.delete('/:id', auth, cancelBooking);

module.exports = router;
