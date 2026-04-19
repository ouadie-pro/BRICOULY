import { api } from '../../services/api';

export const providersService = {
  getProviders: async (params = {}) => {
    return await api.getProviders(params);
  },

  getProvider: async (id) => {
    return await api.getProvider(id);
  },

  searchByService: async (service) => {
    return await api.searchProvidersByService(service);
  },

  getProviderStats: async (providerId) => {
    return await api.getProviderStats(providerId);
  },

  incrementProfileView: async (targetUserId) => {
    return await api.incrementProfileView(targetUserId);
  }
};

export default providersService;