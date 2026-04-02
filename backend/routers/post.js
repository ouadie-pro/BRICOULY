const express = require('express');
const router = express.Router();
const { uploadMultiple } = require('../middleware/upload');
const { 
  getPosts, 
  createPost, 
  likePost,
  getComments, 
  createComment,
  deletePost
} = require('../controllers/postController');

router.get('/', getPosts);
router.post('/', uploadMultiple, createPost);
router.delete('/:id', deletePost);
router.post('/:id/like', likePost);
router.get('/:id/comments', getComments);
router.post('/:id/comments', createComment);

module.exports = router;