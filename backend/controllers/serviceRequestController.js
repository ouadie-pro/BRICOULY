const ServiceRequest = require('../models/ServiceRequest');
const User = require('../models/User');
const Provider = require('../models/Provider');

const formatServiceRequest = (req, sr) => {
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

exports.getServiceTypes = async (req, res) => {
  try {
    res.json({
      success: true,
      serviceTypes: ServiceRequest.SERVICE_TYPES.map(s => ({
        value: s,
        label: s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ')
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getAllRequests = async (req, res) => {
  try {
    const { status, serviceType, city, maxBudget, minBudget, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (serviceType) query.serviceType = serviceType;
    if (city) {
      query.location = { $regex: city, $options: 'i' };
    }
    if (minBudget || maxBudget) {
      query.budget = {};
      if (minBudget) query.budget.$gte = parseFloat(minBudget);
      if (maxBudget) query.budget.$lte = parseFloat(maxBudget);
      if (Object.keys(query.budget).length === 0) delete query.budget;
    }
    
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
    
    res.json({
      success: true,
      requests: requests.map(sr => formatServiceRequest(req, sr)),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getRequestsForProvider = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    if (req.user.role !== 'provider') {
      return res.status(403).json({ success: false, error: 'Only providers can access this endpoint' });
    }
    
    const providerSpecialization = req.user.specialization || 'general';
    const { status, page = 1, limit = 20, city, minBudget, maxBudget } = req.query;
    
    const query = {
      serviceType: providerSpecialization,
      status: status || 'open'
    };
    
    if (city) {
      query.location = { $regex: city, $options: 'i' };
    }
    if (minBudget || maxBudget) {
      query.budget = {};
      if (minBudget) query.budget.$gte = parseFloat(minBudget);
      if (maxBudget) query.budget.$lte = parseFloat(maxBudget);
      if (Object.keys(query.budget).length === 0) delete query.budget;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const matchingRequests = await ServiceRequest.find(query)
      .populate('clientId', 'name email phone avatar location')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await ServiceRequest.countDocuments(query);
    
    const provider = await Provider.findOne({ user: req.user.id });
    const providerCity = (provider?.city || '').toLowerCase().trim();
    const providerHourlyRate = provider?.hourlyRate || 0;
    
    const scoredRequests = matchingRequests.map(request => {
      let score = 100;

      const requestCity = (request.location || '').toLowerCase().trim();
      if (providerCity && requestCity && (
        requestCity.includes(providerCity) || providerCity.includes(requestCity)
      )) {
        score += 50;
      }

      if (!request.budget || request.budget === 0) {
        score += 15;
      } else if (request.budget >= providerHourlyRate) {
        score += 30;
      }

      const ageHours = (Date.now() - new Date(request.createdAt).getTime()) / 3600000;
      if (ageHours < 24) score += 20;
      else if (ageHours < 72) score += 10;

      const formatted = formatServiceRequest(req, request);
      formatted._matchScore = score;
      
      const myApplication = request.applications?.find(
        app => app.providerId?.toString() === req.user.id.toString()
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
    
    scoredRequests.sort((a, b) => b._matchScore - a._matchScore);
    
    res.json({
      success: true,
      requests: scoredRequests,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getRequestsForClient = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const userId = req.user.id.toString();
    const { status, page = 1, limit = 20 } = req.query;
    
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
        const formatted = formatServiceRequest(req, sr);
        
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
    
    res.json({
      success: true,
      requests: requestsWithProviderDetails,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const request = await ServiceRequest.findById(id)
      .populate('clientId', 'name email phone avatar location')
      .populate('acceptedProviderId', 'name email avatar phone');
    
    if (!request) {
      return res.status(404).json({ success: false, error: 'Service request not found' });
    }
    
    const formatted = formatServiceRequest(req, request);
    
    if (request.applications?.length > 0 && req.user?.role === 'client') {
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
    
    res.json({ success: true, request: formatted });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createRequest = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const userId = req.user.id.toString();
    const { title, description, serviceType, location, budget, preferredDate, preferredTime } = req.body;
    
    if (!title || !description || !serviceType) {
      return res.status(400).json({ 
        success: false, 
        error: 'Title, description, and serviceType are required' 
      });
    }
    
    const validServiceTypes = ServiceRequest.SERVICE_TYPES;
    if (!validServiceTypes.includes(serviceType)) {
      return res.status(400).json({ 
        success: false, 
        error: `Invalid service type. Must be one of: ${validServiceTypes.join(', ')}` 
      });
    }
    
    const request = await ServiceRequest.create({
      clientId: userId,
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
    
    res.status(201).json({
      success: true,
      message: 'Service request created successfully',
      request: formatServiceRequest(req, populatedRequest)
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message).join(', ');
      return res.status(400).json({ success: false, error: messages });
    }
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateRequest = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const userId = req.user.id.toString();
    const { id } = req.params;
    const { title, description, serviceType, location, budget, preferredDate, preferredTime, status } = req.body;
    
    const request = await ServiceRequest.findById(id);
    
    if (!request) {
      return res.status(404).json({ success: false, error: 'Service request not found' });
    }
    
    if (request.clientId.toString() !== userId) {
      return res.status(403).json({ 
        success: false, 
        error: 'You can only update your own service requests' 
      });
    }
    
    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (serviceType) {
      if (!ServiceRequest.SERVICE_TYPES.includes(serviceType)) {
        return res.status(400).json({ 
          success: false, 
          error: `Invalid service type` 
        });
      }
      updateData.serviceType = serviceType;
    }
    if (location !== undefined) updateData.location = location;
    if (budget !== undefined) updateData.budget = budget ? parseFloat(budget) : null;
    if (preferredDate !== undefined) updateData.preferredDate = preferredDate ? new Date(preferredDate) : null;
    if (preferredTime) updateData.preferredTime = preferredTime;
    if (status && ServiceRequest.POST_STATUSES.includes(status)) {
      updateData.status = status;
      if (status === 'completed') {
        updateData.completedAt = new Date();
      }
    }
    
    const updatedRequest = await ServiceRequest.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('clientId', 'name email phone avatar')
     .populate('acceptedProviderId', 'name email avatar phone');
    
    res.json({
      success: true,
      message: 'Service request updated successfully',
      request: formatServiceRequest(req, updatedRequest)
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteRequest = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const userId = req.user.id.toString();
    const { id } = req.params;
    
    const request = await ServiceRequest.findById(id);
    
    if (!request) {
      return res.status(404).json({ success: false, error: 'Service request not found' });
    }
    
    if (request.clientId.toString() !== userId) {
      return res.status(403).json({ 
        success: false, 
        error: 'You can only delete your own service requests' 
      });
    }
    
    if (request.status !== 'open') {
      return res.status(400).json({ 
        success: false, 
        error: 'Can only delete open service requests' 
      });
    }
    
    await ServiceRequest.findByIdAndDelete(id);
    
    res.json({
      success: true,
      message: 'Service request deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.applyToRequest = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const userId = req.user.id.toString();
    const { id } = req.params;
    const { message, proposedPrice } = req.body;
    
    const request = await ServiceRequest.findById(id);
    
    if (!request) {
      return res.status(404).json({ success: false, error: 'Service request not found' });
    }
    
    if (request.status !== 'open') {
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot apply to a closed service request' 
      });
    }
    
    const alreadyApplied = request.applications?.some(
      app => app.providerId?.toString() === userId
    );
    
    if (alreadyApplied) {
      return res.status(400).json({ 
        success: false, 
        error: 'You have already applied to this service request' 
      });
    }
    
    if (request.clientId.toString() === userId) {
      return res.status(400).json({ 
        success: false, 
        error: 'You cannot apply to your own service request' 
      });
    }
    
    request.applications.push({
      providerId: userId,
      message: message || '',
      proposedPrice: proposedPrice ? parseFloat(proposedPrice) : null,
      status: 'pending'
    });
    
    await request.save();
    
    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      application: {
        providerId: userId,
        status: 'pending',
        message: message || '',
        proposedPrice: proposedPrice ? parseFloat(proposedPrice) : null,
        appliedAt: new Date()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateApplicationStatus = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const userId = req.user.id.toString();
    const { id, applicationId } = req.params;
    const { status, message } = req.body;
    
    if (!['pending', 'accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid status. Must be pending, accepted, or rejected' 
      });
    }
    
    const request = await ServiceRequest.findById(id);
    
    if (!request) {
      return res.status(404).json({ success: false, error: 'Service request not found' });
    }
    
    if (request.clientId.toString() !== userId) {
      return res.status(403).json({ 
        success: false, 
        error: 'Only the client can update application status' 
      });
    }
    
    const application = request.applications.id(applicationId);
    
    if (!application) {
      return res.status(404).json({ success: false, error: 'Application not found' });
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
    
    const io = req.app.get('io');
    if (io) {
      const Notification = require('../models/Notification');
      const notifType = status === 'accepted' ? 'application_accepted' : 'application_rejected';
      await Notification.create({
        user: new (require('mongoose').Types.ObjectId)(application.providerId.toString()),
        type: notifType,
        title: status === 'accepted' ? 'Application Accepted!' : 'Application Rejected',
        text: status === 'accepted'
          ? 'Your application was accepted. Contact the client to get started.'
          : 'Your application was not selected for this job.',
        fromUser: new (require('mongoose').Types.ObjectId)(userId),
      });
      io.to(`user:${application.providerId.toString()}`).emit('notification', {
        type: notifType,
        title: status === 'accepted' ? 'Application Accepted!' : 'Application Rejected',
        text: status === 'accepted'
          ? 'Your application was accepted. Contact the client to get started.'
          : 'Your application was not selected for this job.',
        fromUserId: userId.toString(),
      });
    }
    
    res.json({
      success: true,
      message: `Application ${status} successfully`,
      request: formatServiceRequest(req, request)
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.cancelApplication = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const userId = req.user.id.toString();
    const { id } = req.params;
    
    const request = await ServiceRequest.findById(id);
    
    if (!request) {
      return res.status(404).json({ success: false, error: 'Service request not found' });
    }
    
    const applicationIndex = request.applications.findIndex(
      app => app.providerId?.toString() === userId
    );
    
    if (applicationIndex === -1) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }
    
    const application = request.applications[applicationIndex];
    
    if (application.status !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        error: 'Can only cancel pending applications' 
      });
    }
    
    request.applications.splice(applicationIndex, 1);
    await request.save();
    
    res.json({
      success: true,
      message: 'Application cancelled successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};


exports.completeRequest = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const userId = req.user.id.toString();
    const { id } = req.params;
    
    const request = await ServiceRequest.findById(id);
    
    if (!request) {
      return res.status(404).json({ success: false, error: 'Service request not found' });
    }
    
    const isClient = request.clientId.toString() === userId;
    const isAcceptedProvider = request.acceptedProviderId?.toString() === userId;
    
    if (!isClient && !isAcceptedProvider) {
      return res.status(403).json({ 
        success: false, 
        error: 'Only the client or accepted provider can mark the request as completed' 
      });
    }
    
    if (request.status !== 'in_progress') {
      return res.status(400).json({ 
        success: false, 
        error: 'Can only complete requests that are in progress' 
      });
    }
    
    request.status = 'completed';
    request.completedAt = new Date();
    await request.save();
    
    if (isAcceptedProvider) {
      await Provider.findOneAndUpdate(
        { user: req.user.id },
        { $inc: { jobsDone: 1 } }
      );
    }
    
    res.json({
      success: true,
      message: 'Service request marked as completed',
      request: formatServiceRequest(req, request)
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
