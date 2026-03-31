const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
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
router.post('/', upload.single('image'), createArticle);
router.post('/:id/like', likeArticle);
router.delete('/:id', deleteArticle);
router.get('/:id/comments', getArticleComments);
router.post('/:id/comments', createArticleComment);

module.exports = router;