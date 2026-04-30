const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/authMiddleware');
const { 
  getProviderServices, 
  createService, 
  updateService, 
  deleteService 
} = require('../controllers/serviceController');

router.get('/providers/:id/services', getProviderServices);
router.post('/', auth, createService);
router.put('/:id', auth, updateService);
router.delete('/:id', auth, deleteService);

module.exports = router;
