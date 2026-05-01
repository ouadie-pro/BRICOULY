// frontend/src/components/ProviderDashboard.jsx
// This is a new/improved version with proper API integration

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import {
  FiBriefcase, FiStar, FiMessageCircle, FiEye, FiCalendar,
  FiTrendingUp, FiUsers, FiCheckCircle, FiClock, FiAlertCircle,
  FiSettings, FiPlus, FiEdit2, FiTrash2, FiX, FiSave
} from 'react-icons/fi';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function ProviderDashboard({ isDesktop }) {
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const [stats, setStats] = useState({
    jobsDone: 0,
    activeJobs: 0,
    rating: 0,
    unreadMessages: 0,
    profileViews: 0,
    totalEarnings: 0
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

  useEffect(() => {
    if (currentUser.role !== 'provider') {
      navigate('/home');
      return;
    }
    loadDashboardData();
  }, [currentUser.id]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [statsData, bookingsData, activityData] = await Promise.all([
        api.getProviderStats(currentUser.id),
        api.getBookings({ role: 'provider' }),
        api.getWeeklyActivity(currentUser.id)
      ]);

      setStats({
        jobsDone: statsData?.jobsDone || 0,
        activeJobs: statsData?.activeJobs || 0,
        rating: statsData?.rating || 0,
        unreadMessages: statsData?.unreadMessages || 0,
        profileViews: statsData?.profileViews || 0,
        totalEarnings: statsData?.totalEarnings || 0
      });

      setRecentBookings(bookingsData?.bookings?.slice(0, 5) || []);
      setActivityData(activityData || []);
    } catch (err) {
      console.error('Error loading dashboard:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAvailability = async () => {
    try {
      const result = await api.updateProviderAvailability(available, unavailableUntil || null);
      if (result.success) {
        setShowAvailabilityModal(false);
        loadDashboardData();
      } else {
        alert(result.error || 'Failed to update availability');
      }
    } catch (err) {
      console.error('Error updating availability:', err);
      alert('Failed to update availability');
    }
  };

  const handleUpdateWorkingHours = async () => {
    try {
      const result = await api.updateWorkingHours(workingHours);
      if (result.success) {
        setShowWorkingHoursModal(false);
      } else {
        alert(result.error || 'Failed to update working hours');
      }
    } catch (err) {
      console.error('Error updating working hours:', err);
      alert('Failed to update working hours');
    }
  };

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500 font-medium">{title}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
        </div>
        <div className={`w-10 h-10 rounded-full bg-${color}-100 flex items-center justify-center`}>
          <Icon className={`text-${color}-500 text-xl`} />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <FiAlertCircle className="text-red-500 text-4xl mb-4" />
        <p className="text-slate-600">{error}</p>
        <button onClick={loadDashboardData} className="mt-4 px-4 py-2 bg-primary text-white rounded-lg">
          Retry
        </button>
      </div>
    );
  }

  if (!isDesktop) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50 pb-24">
        <header className="sticky top-0 z-50 bg-white border-b border-slate-200 p-4">
          <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
        </header>

        <div className="p-4 space-y-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard title="Jobs Done" value={stats.jobsDone} icon={FiBriefcase} color="blue" />
            <StatCard title="Active Jobs" value={stats.activeJobs} icon={FiClock} color="green" />
            <StatCard title="Rating" value={stats.rating.toFixed(1)} icon={FiStar} color="yellow" />
            <StatCard title="Profile Views" value={stats.profileViews} icon={FiEye} color="purple" />
          </div>

          {/* Activity Chart */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-900 mb-3">Weekly Activity</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip />
                  <Area type="monotone" dataKey="views" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-900 mb-3">Quick Actions</h3>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => navigate('/profile')} className="px-4 py-2 bg-slate-100 rounded-lg text-sm font-medium">
                Edit Profile
              </button>
              <button onClick={() => setShowAvailabilityModal(true)} className="px-4 py-2 bg-slate-100 rounded-lg text-sm font-medium">
                Set Availability
              </button>
              <button onClick={() => setShowWorkingHoursModal(true)} className="px-4 py-2 bg-slate-100 rounded-lg text-sm font-medium">
                Working Hours
              </button>
              <button onClick={() => navigate('/provider-bookings')} className="px-4 py-2 bg-slate-100 rounded-lg text-sm font-medium">
                View Bookings
              </button>
            </div>
          </div>

          {/* Recent Bookings */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-900 mb-3">Recent Bookings</h3>
            {recentBookings.length === 0 ? (
              <p className="text-slate-500 text-center py-4">No bookings yet</p>
            ) : (
              <div className="space-y-3">
                {recentBookings.map((booking) => (
                  <div key={booking._id} className="border-b border-slate-100 pb-3 last:border-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-slate-900">{booking.service}</p>
                        <p className="text-sm text-slate-500">
                          {booking.user?.name} • {new Date(booking.date).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        booking.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                        booking.status === 'completed' ? 'bg-green-100 text-green-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {booking.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
                  <button onClick={handleUpdateAvailability} className="flex-1 py-2 bg-primary text-white rounded-lg">
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
                <button onClick={handleUpdateWorkingHours} className="flex-1 py-2 bg-primary text-white rounded-lg">
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Provider Dashboard</h1>
        <div className="flex gap-3">
          <button onClick={() => setShowAvailabilityModal(true)} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium">
            Set Availability
          </button>
          <button onClick={() => setShowWorkingHoursModal(true)} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium">
            Working Hours
          </button>
          <button onClick={() => navigate('/profile')} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium">
            Edit Profile
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard title="Jobs Completed" value={stats.jobsDone} icon={FiBriefcase} color="blue" />
        <StatCard title="Active Jobs" value={stats.activeJobs} icon={FiClock} color="green" />
        <StatCard title="Rating" value={stats.rating.toFixed(1)} icon={FiStar} color="yellow" />
        <StatCard title="Profile Views" value={stats.profileViews} icon={FiEye} color="purple" />
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

      {/* Recent Bookings */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Recent Bookings</h2>
          <button onClick={() => navigate('/provider-bookings')} className="text-primary text-sm font-medium">
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
                  <tr key={booking._id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {booking.user?.avatar ? (
                          <img src={booking.user.avatar} className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                            <span className="text-xs font-bold">{booking.user?.name?.charAt(0)}</span>
                          </div>
                        )}
                        <span className="font-medium text-slate-900">{booking.user?.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{booking.service}</td>
                    <td className="px-6 py-4 text-slate-600">{new Date(booking.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 font-medium text-primary">{booking.price} MAD</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        booking.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                        booking.status === 'completed' ? 'bg-green-100 text-green-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {booking.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => api.updateBookingStatus(booking._id, 'confirmed').then(() => loadDashboardData())}
                            className="px-3 py-1 bg-green-500 text-white rounded text-xs"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => api.updateBookingStatus(booking._id, 'cancelled').then(() => loadDashboardData())}
                            className="px-3 py-1 bg-red-500 text-white rounded text-xs"
                          >
                            Decline
                          </button>
                        </div>
                      )}
                      {booking.status === 'confirmed' && (
                        <button
                          onClick={() => api.updateBookingStatus(booking._id, 'completed').then(() => loadDashboardData())}
                          className="px-3 py-1 bg-blue-500 text-white rounded text-xs"
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
    </div>
  );
}