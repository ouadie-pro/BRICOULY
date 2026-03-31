const express = require('express');
const router = express.Router();
const { getReviews, createReview } = require('../controllers/reviewController');

router.get('/:providerId', getReviews);
router.post('/', createReview);

module.exports = router;