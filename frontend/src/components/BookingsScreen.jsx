import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { 
  FiCalendar, FiClock, FiMapPin, FiDollarSign, FiUser, FiCheckCircle, 
  FiXCircle, FiAlertCircle, FiMessageCircle, FiPhone, FiMail
} from 'react-icons/fi';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const statusIcons = {
  pending: FiAlertCircle,
  confirmed: FiClock,
  completed: FiCheckCircle,
  cancelled: FiXCircle,
};

export default function BookingsScreen({ isDesktop }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        setUserRole(currentUser.role);
        
        const result = await api.getBookings();
        setBookings(result.bookings || []);
      } catch (err) {
        console.error('Error fetching bookings:', err);
        setError('Failed to load bookings');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const handleStatusUpdate = async (bookingId, newStatus) => {
    try {
      const result = await api.updateBookingStatus(bookingId, newStatus);
      if (result.success) {
        setBookings(prev => 
          prev.map(booking => 
            booking._id === bookingId 
              ? { ...booking, status: newStatus }
              : booking
          )
        );
      }
    } catch (error) {
      console.error('Error updating booking status:', error);
      alert('Failed to update booking status');
    }
  };

  const handleMessageProvider = (providerId) => {
    navigate(`/messages/${providerId}`);
  };

  const handleViewClient = (client) => {
    // For providers - show client contact information
    alert(`Client Contact Information:\n\nName: ${client.name}\nEmail: ${client.email}\nPhone: ${client.phone || 'Not provided'}`);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (status) => {
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    const Icon = statusIcons[status] || FiAlertCircle;
    return Icon;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <FiAlertCircle className="text-red-500 text-4xl mx-auto mb-4" />
          <p className="text-slate-600">{error}</p>
        </div>
      </div>
    );
  }

  const BookingCard = ({ booking }) => {
    const StatusIcon = getStatusIcon(booking.status);
    const isProvider = userRole === 'provider';
    const client = booking.user;
    const provider = booking.provider;

    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                <StatusIcon className="w-3 h-3" />
                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
              </span>
              <span className="text-sm text-slate-500">
                {formatDate(booking.date)}
              </span>
            </div>
            
            <h3 className="font-semibold text-slate-900 mb-1">{booking.service}</h3>
            <div className="flex items-center gap-4 text-sm text-slate-600">
              <div className="flex items-center gap-1">
                <FiClock className="w-4 h-4" />
                {booking.time}
              </div>
              <div className="flex items-center gap-1">
                <FiDollarSign className="w-4 h-4" />
                {booking.price} MAD
              </div>
            </div>
          </div>
        </div>

        {booking.address && (
          <div className="flex items-start gap-2 mb-3 text-sm text-slate-600">
            <FiMapPin className="w-4 h-4 mt-0.5" />
            <span>{booking.address}</span>
          </div>
        )}

        {booking.notes && (
          <div className="mb-4 p-3 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-600">{booking.notes}</p>
          </div>
        )}

        {/* Client/Provider Information */}
        <div className="border-t border-slate-100 pt-4">
          {isProvider ? (
            // Provider view - show client information
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
                  {client?.avatar ? (
                    <img src={client.avatar} alt={client.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-sm font-bold text-slate-500">
                        {client?.name?.charAt(0) || '?'}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-medium text-slate-900">{client?.name}</p>
                  <p className="text-sm text-slate-500">Client</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleViewClient(client)}
                  className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                  title="View client contact info"
                >
                  <FiUser className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleMessageProvider(client._id)}
                  className="p-2 text-primary hover:bg-blue-50 rounded-lg"
                  title="Message client"
                >
                  <FiMessageCircle className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            // Client view - show provider information
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
                {provider?.user?.avatar ? (
                  <img src={provider.user.avatar} alt={provider.user.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-sm font-bold text-slate-500">
                      {provider?.user?.name?.charAt(0) || '?'}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium text-slate-900">{provider?.user?.name}</p>
                <p className="text-sm text-slate-500">Provider</p>
              </div>
              <button
                onClick={() => handleMessageProvider(provider?.user?._id)}
                className="p-2 text-primary hover:bg-blue-50 rounded-lg"
                title="Message provider"
              >
                <FiMessageCircle className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
          {isProvider ? (
            // Provider actions
            <>
              {booking.status === 'pending' && (
                <>
                  <button
                    onClick={() => handleStatusUpdate(booking._id, 'confirmed')}
                    className="flex-1 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90"
                  >
                    Confirm Booking
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(booking._id, 'cancelled')}
                    className="px-4 py-2 border border-red-300 text-red-600 rounded-lg font-medium hover:bg-red-50"
                  >
                    Reject
                  </button>
                </>
              )}
              {booking.status === 'confirmed' && (
                <button
                  onClick={() => handleStatusUpdate(booking._id, 'completed')}
                  className="flex-1 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
                >
                  Mark as Completed
                </button>
              )}
            </>
          ) : (
            // Client actions
            <>
              {booking.status === 'pending' && (
                <button
                  onClick={() => handleStatusUpdate(booking._id, 'cancelled')}
                  className="px-4 py-2 border border-red-300 text-red-600 rounded-lg font-medium hover:bg-red-50"
                >
                  Cancel Booking
                </button>
              )}
              {booking.status === 'completed' && (
                <button
                  onClick={() => navigate(`/review/${provider?.user?._id}`)}
                  className="flex-1 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90"
                >
                  Leave Review
                </button>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  if (!isDesktop) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50 pb-24">
        <div className="sticky top-0 z-50 bg-white border-b border-slate-200 p-4">
          <h1 className="text-xl font-bold text-slate-900">
            {userRole === 'provider' ? 'My Bookings' : 'My Bookings'}
          </h1>
        </div>

        <div className="p-4">
          {bookings.length === 0 ? (
            <div className="text-center py-12">
              <FiCalendar className="text-slate-300 text-4xl mx-auto mb-4" />
              <p className="text-slate-500 font-medium">No bookings yet</p>
              <p className="text-slate-400 text-sm mt-1">
                {userRole === 'provider' 
                  ? 'You will see client bookings here' 
                  : 'Your bookings will appear here'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map(booking => (
                <BookingCard key={booking._id} booking={booking} />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">
          {userRole === 'provider' ? 'My Bookings' : 'My Bookings'}
        </h2>
      </div>

      {bookings.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <FiCalendar className="text-slate-300 text-5xl mx-auto mb-4" />
          <p className="text-slate-500 text-lg font-medium">No bookings yet</p>
          <p className="text-slate-400 text-sm mt-2">
            {userRole === 'provider' 
              ? 'You will see client bookings here' 
              : 'Your bookings will appear here'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {bookings.map(booking => (
            <BookingCard key={booking._id} booking={booking} />
          ))}
        </div>
      )}
    </div>
  );
}
