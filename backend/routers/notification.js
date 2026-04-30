const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/authMiddleware');
const { 
  getNotifications, 
  markAsRead, 
  getUnreadCount 
} = require('../controllers/notificationController');

router.get('/', auth, getNotifications);
router.put('/read', auth, markAsRead);
router.get('/unread-count', auth, getUnreadCount);

module.exports = router;
