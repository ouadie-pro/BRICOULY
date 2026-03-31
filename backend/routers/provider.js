const express = require('express');
const router = express.Router();
const { getProviders, getProviderById, getProviderReviews, getProviderServices, getProviderPortfolioById } = require('../controllers/userController');

router.get('/', getProviders);
router.get('/:id', getProviderById);
router.get('/:id/reviews', getProviderReviews);
router.get('/:id/services', getProviderServices);
router.get('/:id/portfolio', getProviderPortfolioById);

module.exports = router;