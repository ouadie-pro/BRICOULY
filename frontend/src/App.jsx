import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Layout from './components/Layout';
import WelcomeScreen from './components/WelcomeScreen';
import AuthScreen from './components/AuthScreen';
import HomeScreen from './components/HomeScreen';
import SearchScreen from './components/SearchScreen';
import ProviderProfileScreen from './components/ProviderProfileScreen';
import MessagesScreen from './components/MessagesScreen';
import ReviewScreen from './components/ReviewScreen';
import ProviderDashboard from './components/ProviderDashboard';
import MyRequestsScreen from './components/MyRequestsScreen';
import ProfileScreen from './components/ProfileScreen';
import VideosScreen from './components/VideosScreen';

function App() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
  };

  const handleUserUpdate = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const ProtectedRoute = ({ children }) => {
    if (!user) {
      return <Navigate to="/auth" replace />;
    }
    return <Layout user={user} onLogout={handleLogout}>{children}</Layout>;
  };

  return (
    <Routes>
      <Route path="/" element={<WelcomeScreen />} />
      <Route path="/auth" element={<AuthScreen onAuth={(userData) => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      }} />} />
      <Route path="/home" element={<ProtectedRoute><HomeScreen isDesktop /></ProtectedRoute>} />
      <Route path="/search" element={<ProtectedRoute><SearchScreen isDesktop /></ProtectedRoute>} />
      <Route path="/search/:q" element={<ProtectedRoute><SearchScreen isDesktop /></ProtectedRoute>} />
      <Route path="/videos" element={<ProtectedRoute><VideosScreen isDesktop /></ProtectedRoute>} />
      <Route path="/user/:id" element={<ProtectedRoute><ProfileScreen isDesktop isViewingOther /></ProtectedRoute>} />
      <Route path="/provider/:id" element={<ProtectedRoute><ProviderProfileScreen isDesktop /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><ProviderDashboard isDesktop /></ProtectedRoute>} />
      <Route path="/requests" element={<ProtectedRoute><MyRequestsScreen isDesktop /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfileScreen isDesktop onUserUpdate={handleUserUpdate} /></ProtectedRoute>} />
      <Route path="/messages" element={<ProtectedRoute><MessagesScreen isDesktop /></ProtectedRoute>} />
      <Route path="/messages/:providerId" element={<ProtectedRoute><MessagesScreen isDesktop /></ProtectedRoute>} />
      <Route path="/review/:providerId" element={<ProtectedRoute><ReviewScreen isDesktop /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
