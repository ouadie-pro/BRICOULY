const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/authMiddleware');
const { getProviders, createProvider, updateProvider } = require('../controllers/providerController');
const { getProviderById, getProviderReviews, getProviderServices, getProviderPortfolioById } = require('../controllers/userController');

router.get('/', getProviders);
router.get('/:id', getProviderById);
router.get('/:id/reviews', getProviderReviews);
router.get('/:id/services', getProviderServices);
router.get('/:id/portfolio', getProviderPortfolioById);
router.post('/', auth, createProvider);
router.put('/:id', auth, updateProvider);

module.exports = router;
