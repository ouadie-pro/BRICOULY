const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { upload } = require('../middleware/upload');
const { signup, login, getMe, updateProfile, uploadAvatar, incrementProfileView } = require('../controllers/authController');
const User = require('../models/User');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const API_URL = process.env.API_URL || 'http://localhost:5000';

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    { expiresIn: '7d' }
  );
};

let passport = null;
let GoogleStrategy = null;
let FacebookStrategy = null;

try {
  passport = require('passport');
  const GoogleOAuth2Strategy = require('passport-google-oauth20').Strategy;
  const FacebookStrategyClass = require('passport-facebook').Strategy;
  GoogleStrategy = GoogleOAuth2Strategy;
  FacebookStrategy = FacebookStrategyClass;
} catch (e) {
  console.log('OAuth packages not installed. Run: npm install passport passport-google-oauth20 passport-facebook');
}

if (passport && GoogleStrategy && process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${API_URL}/api/auth/google/callback`,
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ googleId: profile.id });
      
      if (!user) {
        user = await User.findOne({ email: profile.emails[0].value });
        if (user) {
          user.googleId = profile.id;
          user.authProvider = 'google';
          user.isVerified = true;
          if (profile.photos && profile.photos[0]) {
            user.avatar = profile.photos[0].value;
          }
          await user.save();
        } else {
          user = await User.create({
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails[0].value,
            avatar: profile.photos && profile.photos[0] ? profile.photos[0].value : '',
            role: 'user',
            isVerified: true,
            authProvider: 'google',
          });
        }
      }
      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }));
  console.log('Google OAuth configured');
}

if (passport && FacebookStrategy && process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
  passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: `${API_URL}/api/auth/facebook/callback`,
    profileFields: ['id', 'emails', 'name', 'picture'],
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ facebookId: profile.id });
      
      if (!user) {
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
        if (email) {
          user = await User.findOne({ email });
        }
        
        if (user) {
          user.facebookId = profile.id;
          user.authProvider = 'facebook';
          user.isVerified = true;
          if (profile.photos && profile.photos[0]) {
            user.avatar = profile.photos[0].value;
          }
          await user.save();
        } else {
          user = await User.create({
            facebookId: profile.id,
            name: `${profile.name.givenName} ${profile.name.familyName}`,
            email: email || `fb_${profile.id}@prucoly.ma`,
            avatar: profile.photos && profile.photos[0] ? profile.photos[0].value : '',
            role: 'user',
            isVerified: true,
            authProvider: 'facebook',
          });
        }
      }
      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }));
  console.log('Facebook OAuth configured');
}

router.post('/signup', signup);
router.post('/login', login);
router.get('/me', getMe);
router.put('/profile', updateProfile);
router.post('/avatar', upload.single('file'), uploadAvatar);
router.patch('/users/:id/view', incrementProfileView);

if (passport) {
  router.use(passport.initialize());
}

if (GoogleStrategy && process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  router.get('/google', (req, res, next) => {
    passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
  });
  
  router.get('/google/callback', 
    passport.authenticate('google', { session: false, failureRedirect: `${FRONTEND_URL}/auth?mode=login&error=oauth_failed` }),
    (req, res) => {
      try {
        const token = generateToken(req.user);
        const user = req.user;
        res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}&userId=${user._id}&name=${encodeURIComponent(user.name)}&email=${encodeURIComponent(user.email)}&role=${user.role}&avatar=${encodeURIComponent(user.avatar || '')}`);
      } catch (err) {
        console.error('Google OAuth callback error:', err);
        res.redirect(`${FRONTEND_URL}/auth?mode=login&error=oauth_failed`);
      }
    }
  );
} else {
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
}

if (FacebookStrategy && process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
  router.get('/facebook', (req, res, next) => {
    passport.authenticate('facebook', { scope: ['email'] })(req, res, next);
  });
  
  router.get('/facebook/callback',
    passport.authenticate('facebook', { session: false, failureRedirect: `${FRONTEND_URL}/auth?mode=login&error=oauth_failed` }),
    (req, res) => {
      try {
        const token = generateToken(req.user);
        const user = req.user;
        res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}&userId=${user._id}&name=${encodeURIComponent(user.name)}&email=${encodeURIComponent(user.email)}&role=${user.role}&avatar=${encodeURIComponent(user.avatar || '')}`);
      } catch (err) {
        console.error('Facebook OAuth callback error:', err);
        res.redirect(`${FRONTEND_URL}/auth?mode=login&error=oauth_failed`);
      }
    }
  );
} else {
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
}

router.get('/check-config', (req, res) => {
  res.json({
    googleEnabled: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    facebookEnabled: !!(process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET),
  });
});

module.exports = router;
