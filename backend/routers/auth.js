const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { signup, login, getMe, updateProfile, uploadAvatar } = require('../controllers/authController');
const { authLimiter } = require('../middleware/rateLimiter'); // FIXED: #11

// FIXED: #11 - Apply rate limiting to auth routes
router.post('/signup', authLimiter, signup);
router.post('/login', authLimiter, login);
router.get('/me', getMe);
router.put('/profile', updateProfile);
router.post('/avatar', upload.single('file'), uploadAvatar);

module.exports = router;