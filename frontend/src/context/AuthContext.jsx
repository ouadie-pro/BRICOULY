import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (storedUser && token) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser && parsedUser.id) {
          setUser(parsedUser);
        }
      } catch (e) {
        console.error('Error parsing stored user:', e);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    setError(null);
    try {
      const response = await api.login(email, password);
      
      if (response.success) {
        const userData = {
          ...response.data.user,
          id: response.data.user.id
        };
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', response.data.accessToken);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        return { success: true, user: userData };
      } else {
        setError(response.error);
        return { success: false, error: response.error };
      }
    } catch (err) {
      const errorMsg = err.message || 'Login failed';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  }, []);

  const signup = useCallback(async (userData) => {
    setError(null);
    try {
      const response = await api.signup(userData);
      
      if (response.success) {
        const user = {
          ...response.data.user,
          id: response.data.user.id
        };
        setUser(user);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('token', response.data.accessToken);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        return { success: true, user };
      } else {
        setError(response.error);
        return { success: false, error: response.error };
      }
    } catch (err) {
      const errorMsg = err.message || 'Signup failed';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  }, []);

  const updateUser = useCallback((updatedUser) => {
    setUser(prev => {
      const newUser = { ...prev, ...updatedUser };
      localStorage.setItem('user', JSON.stringify(newUser));
      return newUser;
    });
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const response = await api.getCurrentUser();
      if (response.success) {
        const userData = {
          ...response.data,
          id: response.data.id
        };
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      }
    } catch (err) {
      console.error('Error refreshing user:', err);
    }
  }, []);

  const value = {
    user,
    loading,
    error,
    login,
    signup,
    logout,
    updateUser,
    refreshUser,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;