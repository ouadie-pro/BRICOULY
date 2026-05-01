// frontend/src/components/ProviderDashboard.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { 
  FiBriefcase, FiStar, FiMessageCircle, FiEye, FiCalendar,
  FiTrendingUp, FiUsers, FiCheckCircle, FiClock, FiAlertCircle,
  FiSettings, FiPlus, FiEdit2, FiTrash2, FiX, FiSave, FiDollarSign,
  FiThumbsUp, FiAward, FiBarChart2, FiRefreshCw, FiLoader
} from 'react-icons/fi';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function ProviderDashboard({ isDesktop }) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  
  const [stats, setStats] = useState({
    jobsDone: 0,
    activeJobs: 0,
    rating: 0,
    reviewCount: 0,
    pendingBookings: 0,
    acceptedBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    unreadMessages: 0,
    profileViews: 0,
    monthlyEarnings: 0,
    followersCount: 0,
    avgPunctuality: 0,
    avgProfessionalism: 0,
    avgQuality: 0,
  });
  
  const [recentBookings, setRecentBookings] = useState([]);
  const [activityData, setActivityData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [available, setAvailable] = useState(true);
  const [unavailableUntil, setUnavailableUntil] = useState('');
  const [showWorkingHoursModal, setShowWorkingHoursModal] = useState(false);
  const [workingHours, setWorkingHours] = useState({
    monday: { open: '08:00', close: '18:00', active: true },
    tuesday: { open: '08:00', close: '18:00', active: true },
    wednesday: { open: '08:00', close: '18:00', active: true },
    thursday: { open: '08:00', close: '18:00', active: true },
    friday: { open: '08:00', close: '18:00', active: true },
    saturday: { open: '09:00', close: '14:00', active: false },
    sunday: { open: '09:00', close: '14:00', active: false }
  });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (currentUser.role !== 'provider') {
      navigate('/home');
      return;
    }
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, [currentUser.id]);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setRefreshing(true);
    try {
      const [statsData, bookingsData, activityData] = await Promise.all([
        api.getProviderStats(currentUser.id),
        api.getBookings({ role: 'provider', limit: 5 }),
        api.getWeeklyActivity(currentUser.id)
      ]);

      setStats({
        jobsDone: statsData?.jobsDone || 0,
        activeJobs: statsData?.activeJobs || 0,
        rating: statsData?.rating || 0,
        reviewCount: statsData?.reviewCount || 0,
        pendingBookings: statsData?.pendingBookings || 0,
        acceptedBookings: statsData?.acceptedBookings || 0,
        completedBookings: statsData?.completedBookings || 0,
        cancelledBookings: statsData?.cancelledBookings || 0,
        unreadMessages: statsData?.unreadMessages || 0,
        profileViews: statsData?.profileViews || 0,
        monthlyEarnings: statsData?.monthlyEarnings || 0,
        followersCount: statsData?.followersCount || 0,
        avgPunctuality: statsData?.avgPunctuality || 0,
        avgProfessionalism: statsData?.avgProfessionalism || 0,
        avgQuality: statsData?.avgQuality || 0,
      });

      setRecentBookings(bookingsData?.bookings?.slice(0, 5) || []);
      setActivityData(activityData || []);
      setError(null);
    } catch (err) {
      console.error('Error loading dashboard:', err);
      setError('Failed to load dashboard data');
      showToast('Failed to load dashboard', 'error');
    } finally {
      setLoading(false);
      setTimeout(() => setRefreshing(false), 1000);
    }
  }, [currentUser.id, showToast]);

  const handleUpdateAvailability = async () => {
    try {
      const result = await api.updateProviderAvailability(available, unavailableUntil || null);
      if (result.success) {
        showToast(`You are now ${available ? 'available' : 'unavailable'} for bookings`, 'success');
        setShowAvailabilityModal(false);
        loadDashboardData();
      } else {
        showToast(result.error || 'Failed to update availability', 'error');
      }
    } catch (err) {
      console.error('Error updating availability:', err);
      showToast('Failed to update availability', 'error');
    }
  };

  const handleUpdateWorkingHours = async () => {
    try {
      const result = await api.updateWorkingHours(workingHours);
      if (result.success) {
        showToast('Working hours updated successfully', 'success');
        setShowWorkingHoursModal(false);
      } else {
        showToast(result.error || 'Failed to update working hours', 'error');
      }
    } catch (err) {
      console.error('Error updating working hours:', err);
      showToast('Failed to update working hours', 'error');
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, subtitle, trend }) => (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-all">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500 font-medium">{title}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
          {trend && <p className={`text-xs mt-1 ${trend > 0 ? 'text-green-500' : 'text-red-500'}`}>{trend > 0 ? '+' : ''}{trend}% from last month</p>}
        </div>
        <div className={`w-12 h-12 rounded-full bg-${color}-100 flex items-center justify-center`}>
          <Icon className={`text-${color}-500 text-xl`} />
        </div>
      </div>
    </div>
  );

  const RatingCard = ({ label, value, color }) => (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-slate-600">{label}</span>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <FiStar
              key={star}
              className={`${star <= Math.round(value) ? `text-${color}-400 fill-${color}-400` : 'text-slate-300'}`}
              size={14}
            />
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-2xl font-bold text-slate-900">{value.toFixed(1)}</span>
        <span className="text-xs text-slate-400">/ 5.0</span>
      </div>
    </div>
  );

  if (loading && !stats.jobsDone && !stats.pendingBookings) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <FiLoader className="animate-spin text-4xl text-blue-500 mx-auto mb-4" />
          <p className="text-gray-500">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && !stats.jobsDone) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <FiAlertCircle className="text-red-500 text-5xl mb-4" />
        <p className="text-gray-600 text-lg mb-4">{error}</p>
        <button onClick={loadDashboardData} className="px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors">
          Try Again
        </button>
      </div>
    );
  }

  if (!isDesktop) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50 pb-24">
        <header className="sticky top-0 z-50 bg-white border-b border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
              <p className="text-xs text-slate-500 mt-0.5">Welcome back, {currentUser.name?.split(' ')[0]}</p>
            </div>
            <button onClick={loadDashboardData} disabled={refreshing} className="p-2 rounded-full hover:bg-slate-100 transition-colors">
              <FiRefreshCw className={`text-slate-500 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </header>

        <div className="p-4 space-y-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard title="Jobs Done" value={stats.jobsDone} icon={FiBriefcase} color="blue" />
            <StatCard title="Active Jobs" value={stats.activeJobs} icon={FiClock} color="green" />
            <StatCard title="Rating" value={stats.rating.toFixed(1)} icon={FiStar} color="yellow" />
            <StatCard title="Profile Views" value={stats.profileViews} icon={FiEye} color="purple" />
            <StatCard title="Pending Bookings" value={stats.pendingBookings} icon={FiAlertCircle} color="orange" />
            <StatCard title="Monthly Earnings" value={`${stats.monthlyEarnings} MAD`} icon={FiDollarSign} color="green" />
          </div>

          {/* Earnings Summary */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white">
            <p className="text-sm opacity-90">Total Earnings (This Month)</p>
            <p className="text-3xl font-bold">{stats.monthlyEarnings} MAD</p>
            <p className="text-xs opacity-80 mt-1">+{Math.round(stats.monthlyEarnings * 0.12)} from last month</p>
          </div>

          {/* Rating Breakdown */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
              <FiAward className="text-yellow-500" />
              Rating Breakdown
            </h3>
            <div className="space-y-2">
              <RatingCard label="Overall" value={stats.rating} color="yellow" />
              <RatingCard label="Punctuality" value={stats.avgPunctuality} color="blue" />
              <RatingCard label="Professionalism" value={stats.avgProfessionalism} color="green" />
              <RatingCard label="Quality" value={stats.avgQuality} color="purple" />
            </div>
          </div>

          {/* Activity Chart */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
              <FiTrendingUp className="text-blue-500" />
              Weekly Activity
            </h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip />
                  <Area type="monotone" dataKey="views" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Bookings */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-900">Recent Bookings</h3>
              <button onClick={() => navigate('/provider-bookings')} className="text-blue-500 text-xs font-medium">
                View All →
              </button>
            </div>
            <div className="divide-y divide-slate-100">
              {recentBookings.length === 0 ? (
                <p className="p-4 text-center text-slate-500 text-sm">No bookings yet</p>
              ) : (
                recentBookings.map(booking => (
                  <div key={booking._id} className="p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-slate-900 text-sm">{booking.service}</p>
                        <p className="text-xs text-slate-500">{booking.user?.name} • {new Date(booking.date).toLocaleDateString()}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        booking.status === 'accepted' ? 'bg-blue-100 text-blue-700' :
                        booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                        booking.status === 'completed' ? 'bg-gray-100 text-gray-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {booking.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-900 mb-3">Quick Actions</h3>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => navigate('/profile')} className="px-4 py-2 bg-slate-100 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors">
                Edit Profile
              </button>
              <button onClick={() => setShowAvailabilityModal(true)} className="px-4 py-2 bg-slate-100 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors">
                Set Availability
              </button>
              <button onClick={() => setShowWorkingHoursModal(true)} className="px-4 py-2 bg-slate-100 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors">
                Working Hours
              </button>
              <button onClick={() => navigate('/provider-bookings')} className="px-4 py-2 bg-slate-100 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors">
                View Bookings
              </button>
            </div>
          </div>
        </div>

        {/* Availability Modal */}
        {showAvailabilityModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Set Availability</h3>
                <button onClick={() => setShowAvailabilityModal(false)}>
                  <FiX className="text-slate-500" />
                </button>
              </div>
              <div className="space-y-4">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={available}
                    onChange={(e) => setAvailable(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300"
                  />
                  <span>Available for new bookings</span>
                </label>
                {!available && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Unavailable until</label>
                    <input
                      type="date"
                      value={unavailableUntil}
                      onChange={(e) => setUnavailableUntil(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full p-2 border rounded-lg"
                    />
                  </div>
                )}
                <div className="flex gap-3 pt-4">
                  <button onClick={() => setShowAvailabilityModal(false)} className="flex-1 py-2 border rounded-lg">
                    Cancel
                  </button>
                  <button onClick={handleUpdateAvailability} className="flex-1 py-2 bg-blue-500 text-white rounded-lg">
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Working Hours Modal */}
        {showWorkingHoursModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Working Hours</h3>
                <button onClick={() => setShowWorkingHoursModal(false)}>
                  <FiX className="text-slate-500" />
                </button>
              </div>
              <div className="space-y-3">
                {Object.entries(workingHours).map(([day, hours]) => (
                  <div key={day} className="border-b border-slate-100 pb-3">
                    <label className="flex items-center gap-3 mb-2">
                      <input
                        type="checkbox"
                        checked={hours.active}
                        onChange={(e) => setWorkingHours(prev => ({
                          ...prev,
                          [day]: { ...prev[day], active: e.target.checked }
                        }))}
                        className="w-4 h-4 rounded"
                      />
                      <span className="font-medium capitalize">{day}</span>
                    </label>
                    {hours.active && (
                      <div className="flex gap-3 ml-7">
                        <input
                          type="time"
                          value={hours.open}
                          onChange={(e) => setWorkingHours(prev => ({
                            ...prev,
                            [day]: { ...prev[day], open: e.target.value }
                          }))}
                          className="flex-1 p-2 border rounded-lg text-sm"
                        />
                        <span className="self-center">to</span>
                        <input
                          type="time"
                          value={hours.close}
                          onChange={(e) => setWorkingHours(prev => ({
                            ...prev,
                            [day]: { ...prev[day], close: e.target.value }
                          }))}
                          className="flex-1 p-2 border rounded-lg text-sm"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex gap-3 pt-4 mt-4">
                <button onClick={() => setShowWorkingHoursModal(false)} className="flex-1 py-2 border rounded-lg">
                  Cancel
                </button>
                <button onClick={handleUpdateWorkingHours} className="flex-1 py-2 bg-blue-500 text-white rounded-lg">
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-[calc(100vh-64px)]">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Provider Dashboard</h1>
          <p className="text-slate-500 text-sm">Welcome back, {currentUser.name}! Here's your business overview.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={loadDashboardData} disabled={refreshing} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
            <FiRefreshCw className={`text-sm ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button onClick={() => setShowAvailabilityModal(true)} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
            Set Availability
          </button>
          <button onClick={() => setShowWorkingHoursModal(true)} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
            Working Hours
          </button>
          <button onClick={() => navigate('/profile')} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors">
            Edit Profile
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard title="Jobs Completed" value={stats.jobsDone} icon={FiBriefcase} color="blue" />
        <StatCard title="Active Jobs" value={stats.activeJobs} icon={FiClock} color="green" />
        <StatCard title="Rating" value={stats.rating.toFixed(1)} icon={FiStar} color="yellow" subtitle={`${stats.reviewCount} reviews`} />
        <StatCard title="Profile Views" value={stats.profileViews} icon={FiEye} color="purple" />
        <StatCard title="Pending Bookings" value={stats.pendingBookings} icon={FiAlertCircle} color="orange" />
        <StatCard title="Completed Bookings" value={stats.completedBookings} icon={FiCheckCircle} color="green" />
        <StatCard title="Monthly Earnings" value={`${stats.monthlyEarnings} MAD`} icon={FiDollarSign} color="green" />
        <StatCard title="Followers" value={stats.followersCount} icon={FiUsers} color="pink" />
      </div>

      {/* Earnings and Rating Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Earnings Card */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <p className="text-sm opacity-90">Total Earnings (This Month)</p>
          <p className="text-4xl font-bold mt-2">{stats.monthlyEarnings} MAD</p>
          <p className="text-xs opacity-80 mt-2">+{Math.round(stats.monthlyEarnings * 0.12)} from last month</p>
          <div className="mt-4 pt-4 border-t border-white/20 flex justify-between">
            <div>
              <p className="text-xs opacity-80">Avg. per job</p>
              <p className="text-lg font-semibold">{stats.completedBookings ? Math.round(stats.monthlyEarnings / stats.completedBookings) : 0} MAD</p>
            </div>
            <div>
              <p className="text-xs opacity-80">This month jobs</p>
              <p className="text-lg font-semibold">{stats.completedBookings}</p>
            </div>
          </div>
        </div>

        {/* Rating Breakdown */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <FiAward className="text-yellow-500" />
            Rating Breakdown
          </h3>
          <div className="space-y-3">
            <RatingCard label="Overall" value={stats.rating} color="yellow" />
            <RatingCard label="Punctuality" value={stats.avgPunctuality} color="blue" />
            <RatingCard label="Professionalism" value={stats.avgProfessionalism} color="green" />
            <RatingCard label="Quality" value={stats.avgQuality} color="purple" />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <FiBarChart2 className="text-blue-500" />
            Quick Stats
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Unread Messages</span>
              <span className={`font-bold ${stats.unreadMessages > 0 ? 'text-red-500' : 'text-green-500'}`}>
                {stats.unreadMessages}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Accepted Bookings</span>
              <span className="font-bold text-blue-500">{stats.acceptedBookings}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Completion Rate</span>
              <span className="font-bold text-green-500">
                {stats.completedBookings + stats.cancelledBookings > 0 
                  ? Math.round((stats.completedBookings / (stats.completedBookings + stats.cancelledBookings)) * 100) 
                  : 0}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Response Time</span>
              <span className="font-bold text-green-500">&lt; 1 hour</span>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Chart */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">Weekly Activity</h2>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <FiTrendingUp />
            <span>Profile views this week</span>
          </div>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={activityData}>
              <defs>
                <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip />
              <Area type="monotone" dataKey="views" stroke="#3b82f6" fill="url(#colorViews)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Bookings Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Recent Bookings</h2>
          <button onClick={() => navigate('/provider-bookings')} className="text-blue-500 text-sm font-medium hover:underline">
            View All →
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Service</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentBookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    No bookings yet
                  </td>
                </tr>
              ) : (
                recentBookings.map((booking) => (
                  <tr key={booking._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {booking.user?.avatar ? (
                          <img src={booking.user.avatar} className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                            <span className="text-xs font-bold text-slate-500">
                              {booking.user?.name?.charAt(0) || '?'}
                            </span>
                          </div>
                        )}
                        <span className="font-medium text-slate-900">{booking.user?.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{booking.service}</td>
                    <td className="px-6 py-4 text-slate-600">{new Date(booking.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 font-medium text-blue-600">{booking.price} MAD</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        booking.status === 'accepted' ? 'bg-blue-100 text-blue-700' :
                        booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                        booking.status === 'completed' ? 'bg-gray-100 text-gray-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {booking.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => api.acceptBooking?.(booking._id).then(() => loadDashboardData())}
                            className="px-3 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 transition-colors"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => api.rejectBooking?.(booking._id, 'Not available').then(() => loadDashboardData())}
                            className="px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-colors"
                          >
                            Decline
                          </button>
                        </div>
                      )}
                      {booking.status === 'accepted' && (
                        <button
                          onClick={() => api.confirmBooking?.(booking._id).then(() => loadDashboardData())}
                          className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors"
                        >
                          Confirm
                        </button>
                      )}
                      {booking.status === 'confirmed' && (
                        <button
                          onClick={() => api.updateBookingStatus(booking._id, 'in_progress').then(() => loadDashboardData())}
                          className="px-3 py-1 bg-purple-500 text-white rounded text-xs hover:bg-purple-600 transition-colors"
                        >
                          Start
                        </button>
                      )}
                      {booking.status === 'in_progress' && (
                        <button
                          onClick={() => api.completeBooking?.(booking._id).then(() => loadDashboardData())}
                          className="px-3 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 transition-colors"
                        >
                          Complete
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Availability Modal Desktop */}
      {showAvailabilityModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Set Availability</h3>
              <button onClick={() => setShowAvailabilityModal(false)} className="p-1 hover:bg-slate-100 rounded-full">
                <FiX className="text-slate-500" />
              </button>
            </div>
            <div className="space-y-4">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={available}
                  onChange={(e) => setAvailable(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300"
                />
                <span>Available for new bookings</span>
              </label>
              {!available && (
                <div>
                  <label className="block text-sm font-medium mb-1">Unavailable until</label>
                  <input
                    type="date"
                    value={unavailableUntil}
                    onChange={(e) => setUnavailableUntil(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full p-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowAvailabilityModal(false)} className="flex-1 py-2.5 border border-slate-200 rounded-lg font-medium hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button onClick={handleUpdateAvailability} className="flex-1 py-2.5 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors">
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Working Hours Modal Desktop */}
      {showWorkingHoursModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Working Hours</h3>
              <button onClick={() => setShowWorkingHoursModal(false)} className="p-1 hover:bg-slate-100 rounded-full">
                <FiX className="text-slate-500" />
              </button>
            </div>
            <div className="space-y-4">
              {Object.entries(workingHours).map(([day, hours]) => (
                <div key={day} className="border-b border-slate-100 pb-4">
                  <label className="flex items-center gap-3 mb-2">
                    <input
                      type="checkbox"
                      checked={hours.active}
                      onChange={(e) => setWorkingHours(prev => ({
                        ...prev,
                        [day]: { ...prev[day], active: e.target.checked }
                      }))}
                      className="w-4 h-4 rounded"
                    />
                    <span className="font-medium capitalize w-28">{day}</span>
                  </label>
                  {hours.active && (
                    <div className="flex gap-3 ml-7">
                      <input
                        type="time"
                        value={hours.open}
                        onChange={(e) => setWorkingHours(prev => ({
                          ...prev,
                          [day]: { ...prev[day], open: e.target.value }
                        }))}
                        className="flex-1 p-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="self-center text-slate-400">to</span>
                      <input
                        type="time"
                        value={hours.close}
                        onChange={(e) => setWorkingHours(prev => ({
                          ...prev,
                          [day]: { ...prev[day], close: e.target.value }
                        }))}
                        className="flex-1 p-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-3 pt-6 mt-4 border-t border-slate-200">
              <button onClick={() => setShowWorkingHoursModal(false)} className="flex-1 py-2.5 border border-slate-200 rounded-lg font-medium hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleUpdateWorkingHours} className="flex-1 py-2.5 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}