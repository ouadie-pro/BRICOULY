const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/authMiddleware');
const { getReviews, createReview, updateReview } = require('../controllers/reviewController');

router.get('/:providerId', getReviews);
router.post('/', auth, createReview);
router.put('/', auth, updateReview);

module.exports = router;