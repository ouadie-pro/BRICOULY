import { api } from '../../services/api';

export const serviceRequestsService = {
  getServiceTypes: async () => {
    return await api.getServiceTypes();
  },

  getAllRequests: async (params = {}) => {
    return await api.getServiceRequests(params);
  },

  getProviderRequests: async (params = {}) => {
    return await api.getProviderServiceRequests(params);
  },

  getClientRequests: async (params = {}) => {
    return await api.getClientServiceRequests(params);
  },

  getRequest: async (requestId) => {
    return await api.getServiceRequest(requestId);
  },

  createRequest: async (requestData) => {
    return await api.createServiceRequest(requestData);
  },

  updateRequest: async (requestId, updateData) => {
    return await api.updateServiceRequest(requestId, updateData);
  },

  deleteRequest: async (requestId) => {
    return await api.deleteServiceRequest(requestId);
  },

  apply: async (requestId, applicationData) => {
    return await api.applyToServiceRequest(requestId, applicationData);
  },

  cancelApplication: async (requestId) => {
    return await api.cancelServiceApplication(requestId);
  },

  updateApplicationStatus: async (requestId, applicationId, status, message) => {
    return await api.updateApplicationStatus(requestId, applicationId, status, message);
  },

  completeRequest: async (requestId) => {
    return await api.completeServiceRequest(requestId);
  }
};

export default serviceRequestsService;