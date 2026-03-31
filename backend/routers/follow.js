const express = require('express');
const router = express.Router();
const { 
  followUser, 
  respondFollowRequest, 
  getFollowRequests, 
  getFollowing, 
  getFollowers,
  getFollowingByUserId 
} = require('../controllers/followController');

// IMPORTANT: Specific routes must come before parameterized routes
router.post('/respond', respondFollowRequest);
router.get('/requests', getFollowRequests);
router.get('/following', getFollowing);

router.post('/:userId', followUser);
router.get('/:id/followers', getFollowers);
router.get('/:id/following', getFollowingByUserId);

module.exports = router;