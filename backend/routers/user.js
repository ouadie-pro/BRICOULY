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
const { getProvidersByService } = require('../controllers/providerController');

// Static routes MUST come before parameterized routes
router.get('/providers', getProviders);
router.get('/providers/search', getProvidersByService);
router.get('/providers/:id', getProviderById);
router.get('/providers/:id/reviews', getProviderReviews);
router.get('/professions', getProfessions);
router.post('/professions', createProfession);
router.get('/categories', getCategories);
router.get('/search', searchUsers);

// Parameterized routes come last
router.get('/:id', getUserById);

module.exports = router;