const express = require('express');
const router = express.Router();
const { 
  getNotifications, 
  markAsRead, 
  getUnreadCount 
} = require('../controllers/notificationController');

router.get('/', getNotifications);
router.put('/read', markAsRead);
router.get('/unread-count', getUnreadCount);

module.exports = router;