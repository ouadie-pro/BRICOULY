const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = require('../middleware/upload');
const { 
  getConversations, 
  getMessages, 
  sendMessage 
} = require('../controllers/messageController');

router.get('/conversations', getConversations);

const handleUpload = [
  upload.single('file'),
  (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ success: false, error: 'File too large', message: 'Maximum file size is 50MB' });
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

router.get('/:userId', getMessages);
router.post('/', sendMessage);

module.exports = router;