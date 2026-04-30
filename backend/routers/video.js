const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/authMiddleware');
const { uploadVideo } = require('../middleware/upload');
const { 
  getVideos, 
  createVideo, 
  likeVideo, 
  deleteVideo,
  incrementView 
} = require('../controllers/videoController');

router.get('/', getVideos);
router.post('/', auth, uploadVideo.single('video'), createVideo);
router.post('/:id/like', auth, likeVideo);
router.post('/:id/view', incrementView);
router.delete('/:id', auth, deleteVideo);

module.exports = router;
