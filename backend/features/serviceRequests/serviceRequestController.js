const serviceRequestService = require('./serviceRequestService');
const { asyncHandler, ApiResponse } = require('../../shared/utils/responseWrapper');

const getServiceTypes = asyncHandler(async (req, res) => {
  const serviceTypes = serviceRequestService.getServiceTypes();
  return ApiResponse.success(res, { serviceTypes });
});

const getAllRequests = asyncHandler(async (req, res) => {
  const { status, serviceType, page, limit } = req.query;
  const result = await serviceRequestService.getAllRequests(
    { status, serviceType },
    { page, limit }
  );
  return ApiResponse.paginated(res, result.requests, result.pagination);
});

const getRequestsForProvider = asyncHandler(async (req, res) => {
  const { status, page, limit } = req.query;
  const result = await serviceRequestService.getRequestsForProvider(
    req.user.id,
    req.user.role,
    req.user.specialization,
    { status, page, limit }
  );
  return ApiResponse.paginated(res, result.requests, result.pagination);
});

const getRequestsForClient = asyncHandler(async (req, res) => {
  const { status, page, limit } = req.query;
  const result = await serviceRequestService.getRequestsForClient(
    req.user.id,
    { status, page, limit }
  );
  return ApiResponse.paginated(res, result.requests, result.pagination);
});

const getRequestById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const includeApplications = req.user?.role === 'client';
  const request = await serviceRequestService.getRequestById(id, { includeApplications });
  return ApiResponse.success(res, { request });
});

const createRequest = asyncHandler(async (req, res) => {
  const request = await serviceRequestService.createRequest(req.user.id, req.body);
  return ApiResponse.created(res, { request });
});

const updateRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const request = await serviceRequestService.updateRequest(id, req.user.id, req.body);
  return ApiResponse.success(res, { request });
});

const deleteRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await serviceRequestService.deleteRequest(id, req.user.id);
  return ApiResponse.success(res, { message: 'Service request deleted successfully' });
});

const applyToRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const application = await serviceRequestService.applyToRequest(id, req.user.id, req.body);
  return ApiResponse.created(res, { application });
});

const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { id, applicationId } = req.params;
  const { status, message } = req.body;
  const request = await serviceRequestService.updateApplicationStatus(id, req.user.id, applicationId, status, message);
  return ApiResponse.success(res, { request });
});

const cancelApplication = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await serviceRequestService.cancelApplication(id, req.user.id);
  return ApiResponse.success(res, { message: 'Application cancelled successfully' });
});

const completeRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const request = await serviceRequestService.completeRequest(id, req.user.id, req.user.role);
  return ApiResponse.success(res, { request });
});

module.exports = {
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
};