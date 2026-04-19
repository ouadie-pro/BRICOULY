const express = require('express');
const router = express.Router();
const { 
  getReviews, 
  createReview, 
  updateReview, 
  deleteReview,
  checkCanReview
} = require('../controllers/reviewController');
const { auth } = require('../middleware/authMiddleware');

router.get('/provider/:providerId', getReviews);

router.get('/can-review/:providerId', checkCanReview);

// Protected routes - require authentication
router.post('/', auth, createReview);

router.put('/:reviewId', auth, updateReview);

router.delete('/:reviewId', auth, deleteReview);

module.exports = router;
