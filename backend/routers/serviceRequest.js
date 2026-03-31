const express = require('express');
const router = express.Router();
const { 
  createServiceRequest, 
  getServiceRequests, 
  updateServiceRequest 
} = require('../controllers/serviceRequestController');

router.post('/', createServiceRequest);
router.get('/', getServiceRequests);
router.put('/:id', updateServiceRequest);

module.exports = router;