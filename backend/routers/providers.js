const express = require('express');
const router = express.Router();
const { getProviders, getProvider, createProvider, updateProvider } = require('../controllers/providerController');

router.get('/', getProviders);
router.get('/:id', getProvider);
router.post('/', createProvider);
router.put('/:id', updateProvider);

module.exports = router;
