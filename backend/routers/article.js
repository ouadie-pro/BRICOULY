const express = require('express');
const router = express.Router();
const { uploadMultiple } = require('../middleware/upload');
const { auth } = require('../middleware/authMiddleware');
const { 
  getArticles, 
  getUserArticles, 
  createArticle, 
  likeArticle, 
  deleteArticle,
  getArticleComments,
  createArticleComment 
} = require('../controllers/articleController');

router.get('/', getArticles);
router.get('/users/:id/articles', getUserArticles);
router.post('/', auth, uploadMultiple, createArticle);
router.post('/:id/like', auth, likeArticle);
router.delete('/:id', auth, deleteArticle);
router.get('/:id/comments', getArticleComments);
router.post('/:id/comments', auth, createArticleComment);

module.exports = router;
