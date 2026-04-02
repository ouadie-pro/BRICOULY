const express = require('express');
const router = express.Router();
const { uploadVideo } = require('../middleware/upload');
const { 
  getVideos, 
  createVideo, 
  likeVideo, 
  deleteVideo 
} = require('../controllers/videoController');

router.get('/', getVideos);
router.post('/', uploadVideo.single('video'), createVideo);
router.post('/:id/like', likeVideo);
router.delete('/:id', deleteVideo);

module.exports = router;