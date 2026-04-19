const ServiceRequest = require('../../models/ServiceRequest');
const User = require('../../models/User');
const Provider = require('../../models/Provider');
const { NotFoundError, ForbiddenError, ConflictError } = require('../../shared/errors/AppError');

const SERVICE_TYPES = [
  'plumber', 'electrician', 'painter', 'carpenter', 'cleaner',
  'mover', 'hvac', 'landscaper', 'roofer', 'appliance_repair', 'general'
];

const formatServiceRequest = (sr) => {
  return {
    id: sr._id.toString(),
    clientId: sr.clientId.toString(),
    title: sr.title,
    description: sr.description,
    serviceType: sr.serviceType,
    status: sr.status,
    location: sr.location,
    budget: sr.budget,
    preferredDate: sr.preferredDate,
    preferredTime: sr.preferredTime,
    applications: sr.applications || [],
    acceptedProviderId: sr.acceptedProviderId?.toString() || null,
    completedAt: sr.completedAt,
    createdAt: sr.createdAt,
    updatedAt: sr.updatedAt,
  };
};

const getServiceTypes = () => {
  return SERVICE_TYPES.map(s => ({
    value: s,
    label: s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ')
  }));
};

const getAllRequests = async (filters, pagination) => {
  const { status, serviceType } = filters;
  const { page = 1, limit = 20 } = pagination;
  
  const query = {};
  if (status) query.status = status;
  if (serviceType) query.serviceType = serviceType;
  
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const [requests, total] = await Promise.all([
    ServiceRequest.find(query)
      .populate('clientId', 'name email phone avatar')
      .populate('acceptedProviderId', 'name email avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    ServiceRequest.countDocuments(query)
  ]);
  
  return {
    requests: requests.map(sr => formatServiceRequest(sr)),
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  };
};

const getRequestsForProvider = async (userId, userRole, specialization, filters, pagination) => {
  if (userRole !== 'provider') {
    throw new ForbiddenError('Only providers can access this endpoint');
  }
  
  const providerSpecialization = specialization || 'general';
  const { status, page = 1, limit = 20 } = filters;
  
  const query = {
    serviceType: providerSpecialization,
    status: status || 'open'
  };
  
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const [requests, total] = await Promise.all([
    ServiceRequest.find(query)
      .populate('clientId', 'name email phone avatar location')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    ServiceRequest.countDocuments(query)
  ]);
  
  const requestsWithApplicationStatus = requests.map(sr => {
    const formatted = formatServiceRequest(sr);
    const myApplication = sr.applications?.find(
      app => app.providerId?.toString() === userId.toString()
    );
    formatted.hasApplied = !!myApplication;
    formatted.myApplication = myApplication ? {
      status: myApplication.status,
      message: myApplication.message,
      proposedPrice: myApplication.proposedPrice,
      appliedAt: myApplication.createdAt
    } : null;
    return formatted;
  });
  
  return {
    requests: requestsWithApplicationStatus,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  };
};

const getRequestsForClient = async (userId, filters, pagination) => {
  const { status, page = 1, limit = 20 } = filters;
  
  const query = { clientId: userId };
  if (status) query.status = status;
  
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const [requests, total] = await Promise.all([
    ServiceRequest.find(query)
      .populate('acceptedProviderId', 'name email avatar phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    ServiceRequest.countDocuments(query)
  ]);
  
  const requestsWithProviderDetails = await Promise.all(
    requests.map(async (sr) => {
      const formatted = formatServiceRequest(sr);
      
      if (sr.applications?.length > 0) {
        const providerIds = sr.applications.map(a => a.providerId);
        const providers = await User.find({ _id: { $in: providerIds } })
          .select('name avatar phone');
        
        formatted.applicationDetails = sr.applications.map(app => {
          const provider = providers.find(p => p._id.toString() === app.providerId.toString());
          return {
            providerId: app.providerId.toString(),
            providerName: provider?.name || 'Unknown',
            providerAvatar: provider?.avatar || '',
            providerPhone: provider?.phone || '',
            status: app.status,
            message: app.message,
            proposedPrice: app.proposedPrice,
            appliedAt: app.createdAt
          };
        });
      }
      
      return formatted;
    })
  );
  
  return {
    requests: requestsWithProviderDetails,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  };
};

const getRequestById = async (requestId, options = {}) => {
  const request = await ServiceRequest.findById(requestId)
    .populate('clientId', 'name email phone avatar location')
    .populate('acceptedProviderId', 'name email avatar phone');
  
  if (!request) {
    throw new NotFoundError('Service request not found');
  }
  
  const formatted = formatServiceRequest(request);
  
  if (request.applications?.length > 0 && options.includeApplications) {
    const providerIds = request.applications.map(a => a.providerId);
    const providers = await User.find({ _id: { $in: providerIds } })
      .select('name avatar phone');
    
    formatted.applicationDetails = request.applications.map(app => {
      const provider = providers.find(p => p._id.toString() === app.providerId.toString());
      return {
        providerId: app.providerId.toString(),
        providerName: provider?.name || 'Unknown',
        providerAvatar: provider?.avatar || '',
        providerPhone: provider?.phone || '',
        status: app.status,
        message: app.message,
        proposedPrice: app.proposedPrice,
        appliedAt: app.createdAt
      };
    });
  }
  
  return formatted;
};

const createRequest = async (clientId, requestData) => {
  const { title, description, serviceType, location, budget, preferredDate, preferredTime } = requestData;
  
  if (!SERVICE_TYPES.includes(serviceType)) {
    throw new ConflictError('Invalid service type');
  }
  
  const request = await ServiceRequest.create({
    clientId,
    title,
    description,
    serviceType,
    location: location || '',
    budget: budget ? parseFloat(budget) : null,
    preferredDate: preferredDate ? new Date(preferredDate) : null,
    preferredTime: preferredTime || 'anytime',
    status: 'open',
    applications: []
  });
  
  const populatedRequest = await ServiceRequest.findById(request._id)
    .populate('clientId', 'name email phone avatar');
  
  return formatServiceRequest(populatedRequest);
};

const updateRequest = async (requestId, clientId, updateData) => {
  const request = await ServiceRequest.findById(requestId);
  
  if (!request) {
    throw new NotFoundError('Service request not found');
  }
  
  if (request.clientId.toString() !== clientId.toString()) {
    throw new ForbiddenError('You can only update your own service requests');
  }
  
  const update = {};
  if (updateData.title) update.title = updateData.title;
  if (updateData.description) update.description = updateData.description;
  if (updateData.serviceType) {
    if (!SERVICE_TYPES.includes(updateData.serviceType)) {
      throw new ConflictError('Invalid service type');
    }
    update.serviceType = updateData.serviceType;
  }
  if (updateData.location !== undefined) update.location = updateData.location;
  if (updateData.budget !== undefined) update.budget = updateData.budget ? parseFloat(updateData.budget) : null;
  if (updateData.preferredDate !== undefined) update.preferredDate = updateData.preferredDate ? new Date(updateData.preferredDate) : null;
  if (updateData.preferredTime) update.preferredTime = updateData.preferredTime;
  if (updateData.status) {
    if (['open', 'in_progress', 'completed'].includes(updateData.status)) {
      update.status = updateData.status;
      if (updateData.status === 'completed') {
        update.completedAt = new Date();
      }
    }
  }
  
  const updatedRequest = await ServiceRequest.findByIdAndUpdate(
    requestId,
    update,
    { new: true, runValidators: true }
  ).populate('clientId', 'name email phone avatar')
   .populate('acceptedProviderId', 'name email avatar phone');
  
  return formatServiceRequest(updatedRequest);
};

const deleteRequest = async (requestId, clientId) => {
  const request = await ServiceRequest.findById(requestId);
  
  if (!request) {
    throw new NotFoundError('Service request not found');
  }
  
  if (request.clientId.toString() !== clientId.toString()) {
    throw new ForbiddenError('You can only delete your own service requests');
  }
  
  if (request.status !== 'open') {
    throw new ConflictError('Can only delete open service requests');
  }
  
  await ServiceRequest.findByIdAndDelete(requestId);
  
  return { message: 'Service request deleted successfully' };
};

const applyToRequest = async (requestId, providerId, applicationData) => {
  const { message, proposedPrice } = applicationData || {};
  
  const request = await ServiceRequest.findById(requestId);
  
  if (!request) {
    throw new NotFoundError('Service request not found');
  }
  
  if (request.status !== 'open') {
    throw new ConflictError('Cannot apply to a closed service request');
  }
  
  const alreadyApplied = request.applications?.some(
    app => app.providerId?.toString() === providerId.toString()
  );
  
  if (alreadyApplied) {
    throw new ConflictError('You have already applied to this service request');
  }
  
  if (request.clientId.toString() === providerId.toString()) {
    throw new ConflictError('You cannot apply to your own service request');
  }
  
  request.applications.push({
    providerId,
    message: message || '',
    proposedPrice: proposedPrice ? parseFloat(proposedPrice) : null,
    status: 'pending'
  });
  
  await request.save();
  
  return {
    providerId: providerId.toString(),
    status: 'pending',
    message: message || '',
    proposedPrice: proposedPrice ? parseFloat(proposedPrice) : null,
    appliedAt: new Date()
  };
};

const updateApplicationStatus = async (requestId, clientId, applicationId, status, message) => {
  if (!['pending', 'accepted', 'rejected'].includes(status)) {
    throw new ConflictError('Invalid status');
  }
  
  const request = await ServiceRequest.findById(requestId);
  
  if (!request) {
    throw new NotFoundError('Service request not found');
  }
  
  if (request.clientId.toString() !== clientId.toString()) {
    throw new ForbiddenError('Only the client can update application status');
  }
  
  const application = request.applications.id(applicationId);
  
  if (!application) {
    throw new NotFoundError('Application not found');
  }
  
  application.status = status;
  if (message !== undefined) {
    application.message = message;
  }
  
  if (status === 'accepted') {
    request.applications.forEach(app => {
      if (app._id.toString() !== applicationId) {
        app.status = 'rejected';
      }
    });
    request.acceptedProviderId = application.providerId;
    request.status = 'in_progress';
  } else if (status === 'rejected') {
    const hasAccepted = request.applications.some(
      app => app.status === 'accepted' && app._id.toString() !== applicationId
    );
    if (!hasAccepted) {
      request.acceptedProviderId = null;
    }
  }
  
  await request.save();
  
  return formatServiceRequest(request);
};

const cancelApplication = async (requestId, providerId) => {
  const request = await ServiceRequest.findById(requestId);
  
  if (!request) {
    throw new NotFoundError('Service request not found');
  }
  
  const applicationIndex = request.applications.findIndex(
    app => app.providerId?.toString() === providerId.toString()
  );
  
  if (applicationIndex === -1) {
    throw new NotFoundError('Application not found');
  }
  
  const application = request.applications[applicationIndex];
  
  if (application.status !== 'pending') {
    throw new ConflictError('Can only cancel pending applications');
  }
  
  request.applications.splice(applicationIndex, 1);
  await request.save();
  
  return { message: 'Application cancelled successfully' };
};

const completeRequest = async (requestId, userId, userRole) => {
  const request = await ServiceRequest.findById(requestId);
  
  if (!request) {
    throw new NotFoundError('Service request not found');
  }
  
  const isClient = request.clientId.toString() === userId.toString();
  const isAcceptedProvider = request.acceptedProviderId?.toString() === userId.toString();
  
  if (!isClient && !isAcceptedProvider) {
    throw new ForbiddenError('Only the client or accepted provider can mark the request as completed');
  }
  
  if (request.status !== 'in_progress') {
    throw new ConflictError('Can only complete requests that are in progress');
  }
  
  request.status = 'completed';
  request.completedAt = new Date();
  await request.save();
  
  if (isAcceptedProvider) {
    await Provider.findOneAndUpdate(
      { user: userId },
      { $inc: { jobsDone: 1 } }
    );
  }
  
  return formatServiceRequest(request);
};

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
  completeRequest,
  SERVICE_TYPES
};