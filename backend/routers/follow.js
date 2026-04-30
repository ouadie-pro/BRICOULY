const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/authMiddleware');
const { 
  followUser, 
  respondFollowRequest, 
  getFollowRequests, 
  getFollowing, 
  getFollowers,
  getFollowingByUserId,
  checkFollowStatus
} = require('../controllers/followController');

router.get('/following', auth, getFollowing);
router.post('/respond', auth, respondFollowRequest);
router.get('/requests', auth, getFollowRequests);
router.get('/status/:userId', auth, checkFollowStatus);
router.post('/:userId', auth, followUser);
router.get('/:id/followers', getFollowers);
router.get('/:id/following', getFollowingByUserId);
router.get('/:id', getFollowingByUserId);

module.exports = router;
