const express = require('express');
const router = express.Router();
const { auth } = require('../../shared/middleware/auth');
const { validate, createRequestSchema } = require('../../shared/validators/serviceRequestValidator');
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
} = require('./serviceRequestController');

router.get('/service-types', getServiceTypes);

router.get('/all', getAllRequests);

router.get('/provider', auth, getRequestsForProvider);

router.get('/client', auth, getRequestsForClient);

router.get('/:id', auth, getRequestById);

router.post('/', auth, validate(createRequestSchema), createRequest);

router.put('/:id', auth, updateRequest);

router.delete('/:id', auth, deleteRequest);

router.post('/:id/apply', auth, applyToRequest);

router.delete('/:id/applications/:applicationId', auth, cancelApplication);

router.put('/:id/applications/:applicationId/status', auth, updateApplicationStatus);

router.put('/:id/complete', auth, completeRequest);

module.exports = router;