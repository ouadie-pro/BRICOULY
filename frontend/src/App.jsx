import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import WelcomeScreen from './components/WelcomeScreen';
import AuthScreen from './components/AuthScreen';
import AuthCallback from './components/AuthCallback';
import HomeScreen from './components/HomeScreen';
import SearchScreen from './components/SearchScreen';
import ProviderProfileScreen from './components/ProviderProfileScreen';
import MessagesScreen from './components/MessagesScreen';
import ReviewScreen from './components/ReviewScreen';
import ProviderDashboard from './components/ProviderDashboard';
import MyRequestsScreen from './components/MyRequestsScreen';
import ProfileScreen from './components/ProfileScreen';

function ProtectedRoute({ user, loading, children }) {
  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = '/';
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  return <Layout user={user} onLogout={logout}>{children}</Layout>;
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser && storedUser !== 'undefined') {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser && parsedUser.id) {
          setUser(parsedUser);
        }
      } catch (e) {
        console.error('Error parsing stored user:', e);
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const handleUserUpdate = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  return (
    <Routes>
      <Route path="/" element={<WelcomeScreen />} />
      <Route path="/auth" element={<AuthScreen onAuth={(userData) => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      }} />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/home" element={<ProtectedRoute user={user} loading={loading}><HomeScreen /></ProtectedRoute>} />
      <Route path="/search" element={<ProtectedRoute user={user} loading={loading}><SearchScreen /></ProtectedRoute>} />
      <Route path="/search/:q" element={<ProtectedRoute user={user} loading={loading}><SearchScreen /></ProtectedRoute>} />
      <Route path="/user/:id" element={<ProtectedRoute user={user} loading={loading}><ProfileScreen isViewingOther /></ProtectedRoute>} />
      <Route path="/provider/:id" element={<ProtectedRoute user={user} loading={loading}><ProviderProfileScreen /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute user={user} loading={loading}><ProviderDashboard /></ProtectedRoute>} />
      <Route path="/requests" element={<ProtectedRoute user={user} loading={loading}><MyRequestsScreen /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute user={user} loading={loading}><ProfileScreen onUserUpdate={handleUserUpdate} /></ProtectedRoute>} />
      <Route path="/messages" element={<ProtectedRoute user={user} loading={loading}><MessagesScreen /></ProtectedRoute>} />
      <Route path="/messages/:providerId" element={<ProtectedRoute user={user} loading={loading}><MessagesScreen /></ProtectedRoute>} />
      <Route path="/review/:providerId" element={<ProtectedRoute user={user} loading={loading}><ReviewScreen /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
