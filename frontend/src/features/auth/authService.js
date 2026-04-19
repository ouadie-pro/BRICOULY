import { api } from '../services/api';

export const authService = {
  login: async (email, password) => {
    const response = await api.login(email, password);
    return response;
  },

  signup: async (userData) => {
    const response = await api.signup(userData);
    return response;
  },

  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  },

  getCurrentUser: async () => {
    return await api.getCurrentUser();
  },

  updateProfile: async (updates) => {
    return await api.updateProfile(updates);
  },

  uploadAvatar: async (file) => {
    return await api.uploadAvatar(file);
  },

  getSpecializations: async () => {
    return await api.getSpecializations();
  },

  getToken: () => {
    return localStorage.getItem('token');
  },

  getRefreshToken: () => {
    return localStorage.getItem('refreshToken');
  },

  setTokens: (accessToken, refreshToken) => {
    localStorage.setItem('token', accessToken);
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
  },

  setUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user));
  },

  getUser: () => {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token') && !!localStorage.getItem('user');
  }
};

export default authService;