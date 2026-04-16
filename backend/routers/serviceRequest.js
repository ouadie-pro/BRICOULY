const express = require('express');
const router = express.Router();
const {
  getServiceTypes,
  getAllRequests,
  getRequestsForProvider,
  getRequestsForClient,
  getRequestById,
  createRequest,
  updateRequest,
  deleteRequest,
  applyToRequest,
  updateApplicationStatus,
  cancelApplication,
  completeRequest
} = require('../controllers/serviceRequestController');

router.get('/service-types', getServiceTypes);

router.get('/all', getAllRequests);

router.get('/provider', getRequestsForProvider);

router.get('/client', getRequestsForClient);

router.get('/:id', getRequestById);

router.post('/', createRequest);

router.put('/:id', updateRequest);

router.delete('/:id', deleteRequest);

router.post('/:id/apply', applyToRequest);

router.delete('/:id/applications/:applicationId', cancelApplication);

router.put('/:id/applications/:applicationId/status', updateApplicationStatus);

router.put('/:id/complete', completeRequest);

module.exports = router;
