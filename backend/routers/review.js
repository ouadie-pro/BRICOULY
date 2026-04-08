const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/authMiddleware');
const { getReviews, createReview } = require('../controllers/reviewController');

router.get('/:providerId', getReviews);
router.post('/', auth, createReview);

module.exports = router;