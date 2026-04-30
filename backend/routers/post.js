const express = require('express');
const router = express.Router();
const { uploadMultiple } = require('../middleware/upload');
const { auth } = require('../middleware/authMiddleware');
const { 
  getPosts, 
  createPost, 
  likePost,
  getComments, 
  createComment,
  deletePost
} = require('../controllers/postController');

router.get('/', getPosts);
router.post('/', auth, uploadMultiple, createPost);
router.delete('/:id', auth, deletePost);
router.post('/:id/like', auth, likePost);
router.get('/:id/comments', getComments);
router.post('/:id/comments', auth, createComment);

module.exports = router;
