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

// FIXED: #19 - Move ProtectedRoute outside the App component
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
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 1024);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
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

    const handleResize = () => {
      setIsDesktop(window.innerWidth > 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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

  // FIXED: #19 - Removed inline ProtectedRoute (now defined above)

  return (
    <Routes>
      <Route path="/" element={<WelcomeScreen />} />
      <Route path="/auth" element={<AuthScreen onAuth={(userData) => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      }} />} />
      <Route path="/home" element={<ProtectedRoute user={user} loading={loading}><HomeScreen isDesktop /></ProtectedRoute>} />
      <Route path="/search" element={<ProtectedRoute user={user} loading={loading}><SearchScreen isDesktop /></ProtectedRoute>} />
      <Route path="/search/:q" element={<ProtectedRoute user={user} loading={loading}><SearchScreen isDesktop /></ProtectedRoute>} />
      <Route path="/videos" element={<ProtectedRoute user={user} loading={loading}><VideosScreen isDesktop /></ProtectedRoute>} />
      <Route path="/user/:id" element={<ProtectedRoute user={user} loading={loading}><ProfileScreen isDesktop isViewingOther /></ProtectedRoute>} />
      <Route path="/provider/:id" element={<ProtectedRoute user={user} loading={loading}><ProviderProfileScreen isDesktop /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute user={user} loading={loading}><ProviderDashboard isDesktop /></ProtectedRoute>} />
      <Route path="/requests" element={<ProtectedRoute user={user} loading={loading}><MyRequestsScreen isDesktop /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute user={user} loading={loading}><ProfileScreen isDesktop onUserUpdate={handleUserUpdate} /></ProtectedRoute>} />
      <Route path="/messages" element={<ProtectedRoute user={user} loading={loading}><MessagesScreen isDesktop /></ProtectedRoute>} />
      <Route path="/messages/:providerId" element={<ProtectedRoute user={user} loading={loading}><MessagesScreen isDesktop /></ProtectedRoute>} />
      <Route path="/review/:providerId" element={<ProtectedRoute user={user} loading={loading}><ReviewScreen isDesktop /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
