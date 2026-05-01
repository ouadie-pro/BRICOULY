import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import {
  FiCalendar, FiClock, FiMapPin, FiDollarSign,
  FiCheckCircle, FiAlertCircle, FiLoader,
  FiX, FiMessageSquare, FiStar
} from 'react-icons/fi';

const STATUS_CONFIG = {
  pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
  confirmed: { color: 'bg-blue-100 text-blue-800', label: 'Confirmed' },
  completed: { color: 'bg-green-100 text-green-800', label: 'Completed' },
  cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelled' },
};

const BookingCard = ({ booking, userRole, onCancel, onReview, navigate }) => {
  const providerData = booking.provider?.user || booking.provider;
  const clientData = booking.user;
  const otherParty = userRole === 'provider' ? clientData : providerData;
  const statusConfig = STATUS_CONFIG[booking.status] || STATUS_CONFIG.pending;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {otherParty?.avatar ? (
            <img
              src={otherParty.avatar.startsWith('http') ? otherParty.avatar : window.location.origin + otherParty.avatar}
              alt={otherParty.name}
              className="w-10 h-10 rounded-full object-cover cursor-pointer"
              onClick={() => navigate(userRole === 'provider' ? `/user/${otherParty._id}` : `/provider/${booking.provider?.user?._id || booking.provider?._id}`)}
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
              <span className="text-white font-bold">
                {otherParty?.name?.charAt(0)?.toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <h4 className="font-semibold text-slate-900 cursor-pointer hover:text-primary"
                onClick={() => navigate(userRole === 'provider' ? `/user/${otherParty?._id}` : `/provider/${booking.provider?.user?._id || booking.provider?._id}`)}>
              {otherParty?.name || 'Unknown'}
            </h4>
            <p className="text-sm text-slate-500">{booking.service}</p>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
          {statusConfig.label}
        </span>
      </div>

      <div className="space-y-2 mb-3 text-sm text-slate-600">
        <div className="flex items-center gap-2">
          <FiCalendar className="text-slate-400" />
          <span>{new Date(booking.date).toLocaleDateString()}</span>
          <FiClock className="text-slate-400 ml-2" />
          <span>{booking.time}</span>
        </div>
        {booking.address && (
          <div className="flex items-center gap-2">
            <FiMapPin className="text-slate-400" />
            <span className="truncate">{booking.address}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <FiDollarSign className="text-slate-400" />
          <span className="font-medium text-primary">{booking.price} MAD</span>
        </div>
      </div>

      <div className="flex gap-2 pt-3 border-t border-slate-100">
        {booking.status === 'pending' && userRole === 'client' && (
          <button
            onClick={() => onCancel(booking._id)}
            className="flex-1 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50"
          >
            Cancel
          </button>
        )}
        {booking.status === 'confirmed' && (
          <button
            onClick={() => navigate(`/messages/${otherParty?._id}`)}
            className="flex-1 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 flex items-center justify-center gap-1"
          >
            <FiMessageSquare /> Message
          </button>
        )}
        {booking.status === 'completed' && userRole === 'client' && (
          <button
            onClick={() => onReview(booking)}
            className="flex-1 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 flex items-center justify-center gap-1"
          >
            <FiStar /> Leave Review
          </button>
        )}
      </div>
    </div>
  );
};

export default function BookingsScreen({ isDesktop }) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = currentUser.role;

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const result = await api.getBookings();
      if (result.success || Array.isArray(result)) {
        const bookingsData = result.bookings || result.data || result;
        setBookings(Array.isArray(bookingsData) ? bookingsData : []);
      } else {
        setError(result.error || 'Failed to load bookings');
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    
    setCancellingId(bookingId);
    try {
      const result = await api.cancelBooking(bookingId);
      if (result.success !== false) {
        showToast('Booking cancelled successfully', 'success');
        fetchBookings();
      } else {
        showToast(result.error || 'Failed to cancel booking', 'error');
      }
    } catch (err) {
      showToast('Failed to cancel booking', 'error');
    } finally {
      setCancellingId(null);
    }
  };

  const handleReview = (booking) => {
    const providerId = booking.provider?.user?._id || booking.provider?._id;
    navigate(`/review/${providerId}?bookingId=${booking._id}`);
  };

  const filteredBookings = activeTab === 'all'
    ? bookings
    : bookings.filter(b => b.status === activeTab);

  const tabs = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'completed', label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <FiLoader className="animate-spin text-4xl text-primary mx-auto mb-4" />
          <p className="text-slate-500">Loading your bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${isDesktop ? 'max-w-4xl mx-auto p-6' : 'p-4 pb-24'}`}>
      {/* Header */}
      <div className={`${isDesktop ? 'mb-6' : 'sticky top-0 z-40 bg-slate-50 pt-4 pb-3 -mx-4 px-4'}`}>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-slate-900">My Bookings</h1>
          {userRole === 'client' && (
            <button
              onClick={() => navigate('/search')}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium"
            >
              Book a Service
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.key
                  ? 'bg-primary text-white'
                  : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              {tab.label}
              {tab.key !== 'all' && (
                <span className="ml-1 text-xs">
                  ({bookings.filter(b => b.status === tab.key).length})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 flex items-center gap-3">
          <FiAlertCircle className="text-red-500" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {filteredBookings.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <FiCalendar className="text-3xl text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No bookings found</h3>
          <p className="text-slate-500 mb-6">
            {activeTab === 'all' 
              ? "You haven't made any bookings yet." 
              : `No ${activeTab} bookings.`}
          </p>
          {userRole === 'client' && activeTab === 'all' && (
            <button
              onClick={() => navigate('/search')}
              className="px-6 py-3 bg-primary text-white rounded-xl font-medium"
            >
              Find a Provider
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map(booking => (
            <BookingCard
              key={booking._id}
              booking={booking}
              userRole={userRole}
              onCancel={handleCancel}
              onReview={handleReview}
              navigate={navigate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
