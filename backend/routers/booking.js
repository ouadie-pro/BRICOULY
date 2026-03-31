const express = require('express');
const router = express.Router();
const { getBookings, createBooking, updateBookingStatus, cancelBooking } = require('../controllers/bookingController');

router.get('/', getBookings);
router.post('/', createBooking);
router.put('/:id', updateBookingStatus);
router.delete('/:id', cancelBooking);

module.exports = router;
