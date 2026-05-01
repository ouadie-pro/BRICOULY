// frontend/src/components/ProviderBookingsScreen.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { 
  FiCalendar, FiClock, FiMapPin, FiDollarSign, FiUser, FiCheckCircle, 
  FiXCircle, FiAlertCircle, FiMessageCircle, FiRefreshCw, FiLoader,
  FiArrowLeft, FiChevronLeft, FiChevronRight, FiFilter, FiSearch,
  FiPhone, FiMail, FiClock as FiClockIcon
} from 'react-icons/fi';

const STATUS_CONFIG = {
  pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending', icon: FiAlertCircle, actions: ['accept', 'decline'] },
  confirmed: { color: 'bg-blue-100 text-blue-800', label: 'Confirmed', icon: FiClockIcon, actions: ['complete'] },
  completed: { color: 'bg-green-100 text-green-800', label: 'Completed', icon: FiCheckCircle, actions: [] },
  cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelled', icon: FiXCircle, actions: [] }
};

const formatDate = (dateString) => {
  if (!dateString) return 'Date TBD';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const formatTime = (timeString) => {
  if (!timeString) return 'Time TBD';
  return timeString;
};

export default function ProviderBookingsScreen({ isDesktop }) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(isDesktop ? 8 : 5);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    if (currentUser.role !== 'provider') {
      navigate('/home');
      return;
    }
  }, [currentUser.role, navigate]);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.getBookings({ role: 'provider' });
      const bookingsData = result.bookings || [];
      
      const enhancedBookings = bookingsData.map(booking => ({
        ...booking,
        displayDate: formatDate(booking.date),
        displayTime: formatTime(booking.time),
        canAccept: booking.status === 'pending',
        canComplete: booking.status === 'confirmed',
        canMessage: ['pending', 'confirmed', 'completed'].includes(booking.status)
      }));
      
      setBookings(enhancedBookings);
      setFilteredBookings(enhancedBookings);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError('Failed to load bookings');
      showToast('Failed to load bookings', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Apply filters
  useEffect(() => {
    let filtered = [...bookings];
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(b => b.status === statusFilter);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(b => 
        b.service?.toLowerCase().includes(query) ||
        b.user?.name?.toLowerCase().includes(query) ||
        b.address?.toLowerCase().includes(query)
      );
    }
    
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'date_soonest':
          return new Date(a.date) - new Date(b.date);
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });
    
    setFilteredBookings(filtered);
    setCurrentPage(1);
  }, [bookings, statusFilter, searchQuery, sortBy]);

  const handleStatusUpdate = async (bookingId, newStatus) => {
    try {
      const result = await api.updateBookingStatus(bookingId, newStatus);
      if (result.success) {
        showToast(`Booking ${newStatus} successfully`, 'success');
        fetchBookings();
      } else {
        showToast(result.error || 'Failed to update booking status', 'error');
      }
    } catch (err) {
      console.error('Error updating booking:', err);
      showToast('Failed to update booking status', 'error');
    }
  };

  const handleMessageClient = (clientId) => {
    navigate(`/messages/${clientId}`);
  };

  const getStatusBadge = (status) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  // Pagination
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const paginatedBookings = filteredBookings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const statusOptions = [
    { value: 'all', label: 'All Bookings' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  const BookingCard = ({ booking }) => {
    const client = booking.user;
    
    return (
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
        <div className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 mb-2">
                {getStatusBadge(booking.status)}
                <span className="text-xs text-slate-400">
                  #{booking._id?.slice(-8)}
                </span>
              </div>
              <h3 className="font-semibold text-slate-900">{booking.service}</h3>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500">Total</p>
              <p className="text-lg font-bold text-primary">{booking.price} MAD</p>
            </div>
          </div>
          
          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div className="flex items-center gap-2 text-slate-600">
              <FiCalendar className="text-slate-400 text-sm" />
              <span className="text-sm">{booking.displayDate}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <FiClock className="text-slate-400 text-sm" />
              <span className="text-sm">{booking.displayTime}</span>
            </div>
          </div>
          
          {/* Location */}
          {booking.address && (
            <div className="flex items-start gap-2 mb-3 text-slate-600">
              <FiMapPin className="text-slate-400 text-sm mt-0.5" />
              <span className="text-sm">{booking.address}</span>
            </div>
          )}
          
          {/* Client Info */}
          <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-100">
            <div className="flex items-center gap-3">
              {client?.avatar ? (
                <img 
                  src={client.avatar} 
                  alt={client.name}
                  className="w-10 h-10 rounded-full object-cover border border-slate-200"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {client?.name?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                </div>
              )}
              <div>
                <p className="font-medium text-slate-900">{client?.name || 'Client'}</p>
                {client?.phone && (
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <FiPhone className="text-xs" /> {client.phone}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => handleMessageClient(client?._id)}
              className="p-2 text-primary hover:bg-blue-50 rounded-lg transition-colors"
              title="Message client"
            >
              <FiMessageCircle className="text-lg" />
            </button>
          </div>
          
          {/* Actions */}
          <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100">
            {booking.canAccept && (
              <>
                <button
                  onClick={() => handleStatusUpdate(booking._id, 'confirmed')}
                  className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                >
                  Accept Booking
                </button>
                <button
                  onClick={() => handleStatusUpdate(booking._id, 'cancelled')}
                  className="px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50"
                >
                  Decline
                </button>
              </>
            )}
            {booking.canComplete && (
              <button
                onClick={() => handleStatusUpdate(booking._id, 'completed')}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                Mark as Completed
              </button>
            )}
          </div>
          
          {/* Notes */}
          {booking.notes && (
            <div className="mt-3 p-2 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-500 italic">"{booking.notes}"</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <FiLoader className="animate-spin text-4xl text-primary mx-auto mb-4" />
          <p className="text-slate-500">Loading bookings...</p>
        </div>
      </div>
    );
  }

  if (error && bookings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <FiAlertCircle className="text-5xl text-red-400 mb-4" />
        <p className="text-slate-600 mb-4">{error}</p>
        <button onClick={fetchBookings} className="px-6 py-2 bg-primary text-white rounded-lg">
          Try Again
        </button>
      </div>
    );
  }

  // Mobile Layout
  if (!isDesktop) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50 pb-24">
        <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
          <div className="flex items-center gap-3 p-4">
            <button onClick={() => navigate(-1)} className="p-1 -ml-2">
              <FiArrowLeft className="text-xl" />
            </button>
            <h1 className="flex-1 text-lg font-bold text-slate-900">Bookings</h1>
            <button onClick={() => setShowFilters(!showFilters)} className="p-2 relative">
              <FiFilter className="text-xl" />
              {statusFilter !== 'all' && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
              )}
            </button>
          </div>
          
          <div className="px-4 pb-3">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by service or client..."
                className="w-full h-10 pl-10 pr-4 rounded-lg bg-slate-100 text-sm"
              />
            </div>
          </div>
        </header>
        
        {showFilters && (
          <div className="bg-white border-b border-slate-200 p-4">
            <div className="mb-3">
              <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
              <div className="flex flex-wrap gap-2">
                {statusOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => setStatusFilter(option.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                      statusFilter === option.value
                        ? 'bg-primary text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg text-sm"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="date_soonest">Soonest Date</option>
              </select>
            </div>
          </div>
        )}
        
        <main className="flex-1 p-4">
          {filteredBookings.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <FiCalendar className="text-3xl text-slate-300" />
              </div>
              <p className="text-slate-500 font-medium">No bookings yet</p>
              <p className="text-slate-400 text-sm mt-1">
                When clients book your services, they'll appear here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedBookings.map(booking => (
                <BookingCard key={booking._id} booking={booking} />
              ))}
            </div>
          )}
          
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-slate-200 disabled:opacity-50"
              >
                <FiChevronLeft />
              </button>
              <span className="px-3 py-1 text-sm text-slate-600">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-slate-200 disabled:opacity-50"
              >
                <FiChevronRight />
              </button>
            </div>
          )}
        </main>
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Bookings</h2>
          <p className="text-slate-500 text-sm mt-1">
            Manage incoming booking requests from clients
          </p>
        </div>
        <button
          onClick={fetchBookings}
          className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
        >
          <FiRefreshCw className={`text-sm ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>
      
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex-1 max-w-md relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by service or client..."
            className="w-full h-10 pl-10 pr-4 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        
        <div className="flex gap-2">
          {statusOptions.map(option => (
            <button
              key={option.value}
              onClick={() => setStatusFilter(option.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                statusFilter === option.value
                  ? 'bg-primary text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="date_soonest">Soonest Date</option>
        </select>
      </div>
      
      <div className="flex justify-between items-center">
        <p className="text-sm text-slate-500">
          Showing {paginatedBookings.length} of {filteredBookings.length} bookings
        </p>
        {(statusFilter !== 'all' || searchQuery) && (
          <button
            onClick={() => { setStatusFilter('all'); setSearchQuery(''); setSortBy('newest'); }}
            className="text-sm text-primary hover:underline"
          >
            Clear Filters
          </button>
        )}
      </div>
      
      {filteredBookings.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <FiCalendar className="text-4xl text-slate-300" />
          </div>
          <p className="text-slate-500 text-lg font-medium">No bookings found</p>
          <p className="text-slate-400 text-sm mt-2">
            {searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your filters to see more results'
              : 'When clients book your services, they\'ll appear here'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {paginatedBookings.map(booking => (
              <BookingCard key={booking._id} booking={booking} />
            ))}
          </div>
          
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-lg border border-slate-200 disabled:opacity-50 hover:bg-slate-50"
              >
                Previous
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-10 h-10 rounded-lg font-medium ${
                      currentPage === pageNum
                        ? 'bg-primary text-white'
                        : 'border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-lg border border-slate-200 disabled:opacity-50 hover:bg-slate-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}