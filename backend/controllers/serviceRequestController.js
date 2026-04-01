const User = require('../models/User');
const Provider = require('../models/Provider');
const ServiceRequest = require('../models/ServiceRequest');
const Notification = require('../models/Notification');

exports.createServiceRequest = async (req, res) => {
  try {
    console.log('[createServiceRequest] Request received', { headers: req.headers, body: req.body });
    const clientId = req.headers['x-user-id'];
    console.log('[createServiceRequest] clientId:', clientId);
    const { providerId, serviceName, description } = req.body;
    
    console.log('[createServiceRequest] providerId:', providerId);
    const provider = await Provider.findOne({ user: providerId });
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    
    const serviceRequest = await ServiceRequest.create({
      client: clientId,
      provider: provider._id,
      serviceName,
      description,
      status: 'pending',
    });
    
    await Notification.create({
      user: providerId,
      type: 'request',
      title: 'New Service Request',
      text: `${serviceName} - ${description.substring(0, 50)}`,
    });
    
    res.json({ success: true, request: serviceRequest });
  } catch (error) {
    console.error('[createServiceRequest] Error:', error.message, error.stack);
    res.status(500).json({ error: error.message });
  }
};

exports.getServiceRequests = async (req, res) => {
  try {
    console.log('[getServiceRequests] Request received', { headers: req.headers });
    const userId = req.headers['x-user-id'];
    console.log('[getServiceRequests] userId:', userId);
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // FIXED: #3 - Use 'user' instead of 'client'
    let userRequests;
    if (user.role === 'user') {
      userRequests = await ServiceRequest.find({ client: userId }).populate('provider');
    } else {
      const provider = await Provider.findOne({ user: userId });
      if (provider) {
        userRequests = await ServiceRequest.find({ provider: provider._id }).populate('client');
      } else {
        userRequests = [];
      }
    }
    
    const enrichedRequests = await Promise.all(userRequests.map(async (r) => {
      let otherUser;
      // FIXED: #3 - Use 'user' instead of 'client'
      if (user.role === 'user') {
        otherUser = await User.findById(r.provider.user);
      } else {
        otherUser = await User.findById(r.client);
      }
      return {
        id: r._id.toString(),
        clientId: r.client.toString(),
        providerId: r.provider._id.toString(),
        serviceName: r.serviceName,
        description: r.description,
        status: r.status,
        createdAt: r.createdAt,
        otherUserName: otherUser?.name || 'Unknown',
        otherUserAvatar: otherUser?.avatar || '',
        otherUserProfession: '',
      };
    }));
    
    res.json(enrichedRequests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateServiceRequest = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const { status } = req.body;
    
    const serviceRequest = await ServiceRequest.findById(req.params.id).populate('client provider');
    
    if (!serviceRequest) {
      return res.status(404).json({ error: 'Request not found' });
    }
    
    serviceRequest.status = status;
    await serviceRequest.save();
    
    await Notification.create({
      user: serviceRequest.client._id,
      type: 'request_update',
      title: 'Service Request Update',
      text: `Your request for ${serviceRequest.serviceName} has been ${status}`,
    });
    
    res.json({ success: true, request: serviceRequest });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};