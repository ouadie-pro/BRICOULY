const express = require('express');
const router = express.Router();
const { 
  getProviderServices, 
  createService, 
  updateService, 
  deleteService 
} = require('../controllers/serviceController');

router.get('/providers/:id/services', getProviderServices);
router.post('/', createService);
router.put('/:id', updateService);
router.delete('/:id', deleteService);

module.exports = router;