const express = require('express');
const router = express.Router();
const { 
  getProviders, 
  getProviderById, 
  getProviderReviews, 
  searchUsers, 
  getUserById,
  getProfessions,
  createProfession,
  getCategories
} = require('../controllers/userController');

const {
  getUserArticles
} = require('../controllers/articleController');

const {
  getFollowers,
  getFollowingByUserId
} = require('../controllers/followController');

router.get('/providers', getProviders);
router.get('/providers/:id', getProviderById);
router.get('/providers/:id/reviews', getProviderReviews);
router.get('/search', searchUsers);
router.get('/:id/articles', getUserArticles);
router.get('/:id/followers', getFollowers);
router.get('/:id/following', getFollowingByUserId);
router.get('/:id', getUserById);
router.get('/professions', getProfessions);
router.post('/professions', createProfession);
router.get('/categories', getCategories);

module.exports = router;