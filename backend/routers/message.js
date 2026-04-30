const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { auth } = require('../middleware/authMiddleware');
const { uploadMedia } = require('../middleware/upload');
const { 
  getConversations, 
  getMessages, 
  sendMessage,
  markAsRead 
} = require('../controllers/messageController');

router.get('/conversations', auth, getConversations);

const handleUpload = [
  auth,
  uploadMedia.single('file'),
  (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ success: false, error: 'File too large', message: 'Maximum file size is 100MB' });
      }
      return res.status(400).json({ success: false, error: err.message });
    }
    if (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
    next();
  }
];

router.post('/media', ...handleUpload, (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No file uploaded' });
  }
  res.json({
    success: true,
    filePath: `/uploads/${req.file.filename}`,
    filename: req.file.filename,
  });
});

router.get('/:userId', auth, getMessages);
router.post('/', auth, sendMessage);
router.put('/:providerId/read', auth, markAsRead);

router.post('/typing', auth, (req, res) => {
  const { toUserId, isTyping } = req.body;
  const io = req.app.get('io');
  if (io && toUserId) {
    io.to(`user:${toUserId}`).emit(
      isTyping ? 'userTyping' : 'userStoppedTyping',
      { fromUserId: req.user.id.toString() }
    );
  }
  res.json({ success: true });
});

module.exports = router;
