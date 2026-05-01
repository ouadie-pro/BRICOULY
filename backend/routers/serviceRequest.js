const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/authMiddleware');
const {
  getServiceTypes,
  getServiceTypesWithCounts,
  getAllRequests,
  getRequestsForProvider,
  getRequestsForClient,
  getRequestById,
  createRequest,
  updateRequest,
  deleteRequest,
  applyToRequest,
  applyToRequestWithDetails,
  updateApplicationStatus,
  cancelApplication,
  completeRequest,
  getRequestsByLocation
} = require('../controllers/serviceRequestController');

router.get('/service-types', getServiceTypes);
router.get('/service-types/with-counts', getServiceTypesWithCounts);
router.get('/service-types/stats', getServiceTypesWithCounts);

router.get('/all', getAllRequests);
router.get('/by-location', getRequestsByLocation);
router.get('/nearby', getRequestsByLocation);

// Provider applications must be before /:id routes
router.get('/provider/applications', auth, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'provider') {
      return res.status(403).json({ success: false, error: 'Only providers can access' });
    }

    const ServiceRequest = require('../models/ServiceRequest');
    const applications = await ServiceRequest.find({
      'applications.providerId': req.user.id
    }).select('title serviceType status applications');

    const myApplications = applications.map(req => {
      const myApp = req.applications.find(a => a.providerId.toString() === req.user.id);
      return {
        requestId: req._id,
        title: req.title,
        serviceType: req.serviceType,
        status: req.status,
        applicationStatus: myApp?.status,
        appliedAt: myApp?.createdAt,
        message: myApp?.message,
        proposedPrice: myApp?.proposedPrice
      };
    });

    res.json({ success: true, applications: myApplications });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/provider', auth, getRequestsForProvider);
router.get('/client', auth, getRequestsForClient);
router.get('/:id', getRequestById);

router.post('/', auth, createRequest);
router.put('/:id', auth, updateRequest);
router.delete('/:id', auth, deleteRequest);

router.post('/:id/apply', auth, applyToRequest);
router.post('/:id/apply-with-details', auth, applyToRequestWithDetails);

router.delete('/:id/cancel-application', auth, cancelApplication);
router.delete('/:id/applications/:applicationId', auth, cancelApplication);
router.put('/:id/applications/:applicationId/status', auth, updateApplicationStatus);

router.put('/:id/complete', auth, completeRequest);

module.exports = router;
