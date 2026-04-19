import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (storedUser && token) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser && parsedUser.id) {
          setUser(parsedUser);
          setIsAuthenticated(true);
        }
      } catch (e) {
        console.error('Error parsing stored user:', e);
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    const response = await api.login(email, password);
    if (response.success) {
      const userData = {
        ...response.data.user,
        id: response.data.user.id
      };
      setUser(userData);
      setIsAuthenticated(true);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
    }
    return response;
  }, []);

  const signup = useCallback(async (userData) => {
    const response = await api.signup(userData);
    if (response.success) {
      const user = {
        ...response.data.user,
        id: response.data.user.id
      };
      setUser(user);
      setIsAuthenticated(true);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
    }
    return response;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  }, []);

  const updateUser = useCallback((updatedData) => {
    setUser(prev => {
      const newUser = { ...prev, ...updatedData };
      localStorage.setItem('user', JSON.stringify(newUser));
      return newUser;
    });
  }, []);

  const refreshUser = useCallback(async () => {
    const response = await api.getCurrentUser();
    if (response.success) {
      const userData = {
        ...response.data,
        id: response.data.id
      };
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
    }
    return response;
  }, []);

  return {
    user,
    loading,
    isAuthenticated,
    login,
    signup,
    logout,
    updateUser,
    refreshUser
  };
}

export default useAuth;