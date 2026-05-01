const express = require('express');
const router = express.Router();
const { 
  getReviews, 
  createReview, 
  updateReview, 
  deleteReview,
  checkCanReview
} = require('../controllers/reviewController');

router.get('/provider/:providerId', getReviews);

router.get('/can-review/:providerId', checkCanReview);

router.post('/', createReview);
router.put('/:reviewId', updateReview);
router.delete('/:reviewId', deleteReview);

module.exports = router;
