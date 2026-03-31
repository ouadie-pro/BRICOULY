const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { 
  getVideos, 
  createVideo, 
  likeVideo, 
  deleteVideo 
} = require('../controllers/videoController');

router.get('/', getVideos);
router.post('/', upload.single('video'), createVideo);
router.post('/:id/like', likeVideo);
router.delete('/:id', deleteVideo);

module.exports = router;