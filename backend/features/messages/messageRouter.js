const express = require('express');
const router = express.Router();
const { auth } = require('../../shared/middleware/auth');
const { uploadMedia } = require('../../shared/middleware/upload');
const {
  getConversations,
  getMessages,
  sendMessage,
  uploadMedia: uploadMediaHandler,
  markAsRead
} = require('./messageController');

router.get('/conversations', auth, getConversations);

router.get('/:userId', auth, getMessages);

router.post('/', auth, sendMessage);

router.post('/media', auth, uploadMedia.single('file'), uploadMediaHandler);

router.put('/:providerId/read', auth, markAsRead);

module.exports = router;