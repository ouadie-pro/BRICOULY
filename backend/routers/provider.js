const express = require('express');
const router = express.Router();
const { getProviders, getProviderById, getProviderReviews } = require('../controllers/userController');

router.get('/', getProviders);
router.get('/:id', getProviderById);
router.get('/:id/reviews', getProviderReviews);

module.exports = router;