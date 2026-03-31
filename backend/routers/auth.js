const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { signup, login, getMe, updateProfile, uploadAvatar } = require('../controllers/authController');

router.post('/signup', signup);
router.post('/login', login);
router.get('/me', getMe);
router.put('/profile', updateProfile);
router.post('/avatar', upload.single('file'), uploadAvatar);

module.exports = router;