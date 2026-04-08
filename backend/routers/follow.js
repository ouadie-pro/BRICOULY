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

// FIXED: #8 - /following route moved from inline in server.js to router
router.get('/following', getFollowing);

router.post('/respond', respondFollowRequest);
router.get('/requests', getFollowRequests);

router.post('/:userId', followUser);
router.get('/:id/followers', getFollowers);
router.get('/:id/following', getFollowingByUserId);
router.get('/:id', getFollowingByUserId);

module.exports = router;