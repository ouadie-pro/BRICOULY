const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { upload } = require('../middleware/upload');
const { signup, login, getMe, updateProfile, uploadAvatar, incrementProfileView, getSpecializations } = require('../controllers/authController');
const User = require('../models/User');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    { expiresIn: '7d' }
  );
};

router.post('/signup', signup);
router.post('/login', login);
router.get('/me', getMe);
router.put('/profile', updateProfile);
router.post('/avatar', upload.single('file'), uploadAvatar);
router.patch('/users/:id/view', incrementProfileView);
router.get('/specializations', getSpecializations);

router.get('/google', (req, res) => {
  res.status(501).json({ 
    success: false, 
    error: 'Google OAuth not configured',
    message: 'Please configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env file'
  });
});

router.get('/google/callback', (req, res) => {
  res.redirect(`${FRONTEND_URL}/auth?mode=login&error=oauth_not_configured`);
});

router.get('/facebook', (req, res) => {
  res.status(501).json({ 
    success: false, 
    error: 'Facebook OAuth not configured',
    message: 'Please configure FACEBOOK_APP_ID and FACEBOOK_APP_SECRET in .env file'
  });
});

router.get('/facebook/callback', (req, res) => {
  res.redirect(`${FRONTEND_URL}/auth?mode=login&error=oauth_not_configured`);
});

router.get('/check-config', (req, res) => {
  res.json({
    googleEnabled: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    facebookEnabled: !!(process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET),
  });
});

module.exports = router;