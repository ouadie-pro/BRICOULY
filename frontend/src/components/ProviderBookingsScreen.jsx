// frontend/src/components/ProviderBookingsScreen.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { 
  FiCalendar, FiClock, FiMapPin, FiDollarSign, FiUser, FiCheckCircle, 
  FiXCircle, FiAlertCircle, FiMessageCircle, FiRefreshCw, FiLoader,
  FiArrowLeft, FiChevronLeft, FiChevronRight, FiFilter, FiSearch,
  FiPhone, FiMail, FiCheck, FiX, FiClock as FiClockIcon, FiSend,
  FiThumbsUp, FiThumbsDown, FiEdit2
} from 'react-icons/fi';

const STATUS_CONFIG = {
  pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending', icon: FiClockIcon, actions: ['accept', 'reject'] },
  accepted: { color: 'bg-blue-100 text-blue-800', label: 'Accepted', icon: FiCheckCircle, actions: ['confirm', 'cancel'] },
  rejected: { color: 'bg-red-100 text-red-800', label: 'Rejected', icon: FiXCircle, actions: [] },
  confirmed: { color: 'bg-green-100 text-green-800', label: 'Confirmed', icon: FiCheckCircle, actions: ['start', 'cancel'] },
  in_progress: { color: 'bg-purple-100 text-purple-800', label: 'In Progress', icon: FiClockIcon, actions: ['complete'] },
  completed: { color: 'bg-gray-100 text-gray-800', label: 'Completed', icon: FiCheckCircle, actions: [] },
  cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelled', icon: FiXCircle, actions: [] }
};

const formatDate = (dateString) => {
  if (!dateString) return 'Date TBD';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
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
  const [itemsPerPage] = useState(isDesktop ? 6 : 5);
  const [processingId, setProcessingId] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRescheduleModal, setShowRescheduleModal] = useState(null);
  const [rescheduleData, setRescheduleData] = useState({ date: '', time: '', reason: '' });
  const [unreadCount, setUnreadCount] = useState(0);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    if (currentUser.role !== 'provider') {
      setAccessDenied(true);
      setLoading(false);
      return;
    }
  }, [currentUser.role]);

  if (accessDenied) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center p-8">
          <FiXCircle className="text-5xl text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-500 mb-4">This page is only available for service providers.</p>
          <button onClick={() => navigate('/home')} className="px-6 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors">
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  const fetchUnreadCount = useCallback(async () => {
    try {
      const result = await api.getBookingsUnreadCount?.() || { count: 0 };
      setUnreadCount(result.count || 0);
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  }, []);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.getBookings({ role: 'provider' });
      const bookingsData = result.bookings || [];
      
      const enhancedBookings = bookingsData.map(booking => ({
        ...booking,
        displayDate: formatDate(booking.date),
        displayTime: formatTime(booking.time),
        canAccept: booking.status === 'pending',
        canReject: booking.status === 'pending',
        canConfirm: booking.status === 'accepted',
        canStart: booking.status === 'confirmed',
        canComplete: booking.status === 'in_progress',
        canCancel: ['pending', 'accepted', 'confirmed'].includes(booking.status),
        canMessage: ['pending', 'accepted', 'confirmed', 'in_progress', 'completed'].includes(booking.status),
        canReschedule: booking.status === 'pending' || booking.status === 'accepted',
      }));
      
      setBookings(enhancedBookings);
      await fetchUnreadCount();
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError('Failed to load bookings');
      showToast('Failed to load bookings', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast, fetchUnreadCount]);

  useEffect(() => {
    fetchBookings();
    const interval = setInterval(fetchBookings, 30000);
    return () => clearInterval(interval);
  }, [fetchBookings]);

  useEffect(() => {
    let filtered = [...bookings];
    if (statusFilter !== 'all') filtered = filtered.filter(b => b.status === statusFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(b => 
        b.service?.toLowerCase().includes(q) || 
        b.user?.name?.toLowerCase().includes(q) ||
        b.user?.email?.toLowerCase().includes(q)
      );
    }
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    setFilteredBookings(filtered);
    setCurrentPage(1);
  }, [bookings, statusFilter, searchQuery]);

  const handleAcceptBooking = async (bookingId) => {
    setProcessingId(bookingId);
    try {
      const result = await api.acceptBooking?.(bookingId) || await api.updateBookingStatus(bookingId, 'accepted');
      if (result.success) {
        showToast('Booking accepted! You can now confirm the schedule.', 'success');
        fetchBookings();
      } else {
        showToast(result.error || 'Failed to accept booking', 'error');
      }
    } catch (err) {
      showToast('Failed to accept booking', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectBooking = async () => {
    if (!showRejectModal) return;
    setProcessingId(showRejectModal);
    try {
      const result = await api.rejectBooking?.(showRejectModal, rejectReason) || 
                     await api.updateBookingStatus(showRejectModal, 'rejected', rejectReason);
      if (result.success) {
        showToast('Booking rejected', 'info');
        setShowRejectModal(null);
        setRejectReason('');
        fetchBookings();
      } else {
        showToast(result.error || 'Failed to reject booking', 'error');
      }
    } catch (err) {
      showToast('Failed to reject booking', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleConfirmBooking = async (bookingId) => {
    setProcessingId(bookingId);
    try {
      const result = await api.confirmBooking?.(bookingId) || await api.updateBookingStatus(bookingId, 'confirmed');
      if (result.success) {
        showToast('Booking confirmed! The client has been notified.', 'success');
        fetchBookings();
      } else {
        showToast(result.error || 'Failed to confirm booking', 'error');
      }
    } catch (err) {
      showToast('Failed to confirm booking', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleStartBooking = async (bookingId) => {
    setProcessingId(bookingId);
    try {
      const result = await api.updateBookingStatus(bookingId, 'in_progress');
      if (result.success) {
        showToast('Service marked as in progress', 'success');
        fetchBookings();
      } else {
        showToast(result.error || 'Failed to update status', 'error');
      }
    } catch (err) {
      showToast('Failed to update status', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleCompleteBooking = async (bookingId) => {
    if (!window.confirm('Mark this booking as completed? The client will be able to leave a review.')) return;
    setProcessingId(bookingId);
    try {
      const result = await api.completeBooking?.(bookingId) || await api.updateBookingStatus(bookingId, 'completed');
      if (result.success) {
        showToast('Booking completed! Great job!', 'success');
        fetchBookings();
      } else {
        showToast(result.error || 'Failed to complete booking', 'error');
      }
    } catch (err) {
      showToast('Failed to complete booking', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    setProcessingId(bookingId);
    try {
      const result = await api.cancelBooking(bookingId);
      if (result.success) {
        showToast('Booking cancelled', 'info');
        fetchBookings();
      } else {
        showToast(result.error || 'Failed to cancel booking', 'error');
      }
    } catch (err) {
      showToast('Failed to cancel booking', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRescheduleRequest = async () => {
    if (!showRescheduleModal) return;
    setProcessingId(showRescheduleModal);
    try {
      const result = await api.requestReschedule?.(showRescheduleModal, rescheduleData) ||
                     await api.updateBookingStatus(showRescheduleModal, 'pending', null, rescheduleData);
      if (result.success) {
        showToast('Reschedule request sent to client', 'success');
        setShowRescheduleModal(null);
        setRescheduleData({ date: '', time: '', reason: '' });
        fetchBookings();
      } else {
        showToast(result.error || 'Failed to send request', 'error');
      }
    } catch (err) {
      showToast('Failed to send request', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleMessageClient = (clientId, bookingId) => {
    navigate(`/messages/${clientId}?bookingId=${bookingId}`);
  };

  const statusOptions = [
    { value: 'pending', label: 'Pending', icon: FiClockIcon, count: bookings.filter(b => b.status === 'pending').length },
    { value: 'accepted', label: 'Accepted', icon: FiCheckCircle, count: bookings.filter(b => b.status === 'accepted').length },
    { value: 'confirmed', label: 'Confirmed', icon: FiCheckCircle, count: bookings.filter(b => b.status === 'confirmed').length },
    { value: 'in_progress', label: 'In Progress', icon: FiClockIcon, count: bookings.filter(b => b.status === 'in_progress').length },
    { value: 'completed', label: 'Completed', icon: FiCheckCircle, count: bookings.filter(b => b.status === 'completed').length },
    { value: 'cancelled', label: 'Cancelled', icon: FiXCircle, count: bookings.filter(b => b.status === 'cancelled').length },
    { value: 'all', label: 'All', icon: FiCalendar, count: bookings.length },
  ];

  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const paginatedBookings = filteredBookings.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const BookingCard = ({ booking }) => {
    const client = booking.user;
    const config = STATUS_CONFIG[booking.status] || STATUS_CONFIG.pending;
    const Icon = config.icon;
    const isProcessing = processingId === booking._id;

    return (
      <div className={`bg-white rounded-xl border overflow-hidden transition-all ${config.color.replace('text-', 'border-').replace('-800', '-200')} ${booking.status === 'cancelled' ? 'opacity-75' : ''}`}>
        <div className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
                  <Icon className="w-3 h-3" />
                  {config.label}
                </span>
                <span className="text-xs text-gray-400">#{booking._id?.slice(-8)}</span>
              </div>
              <h3 className="font-semibold text-gray-900">{booking.service}</h3>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-lg font-bold text-blue-600">{booking.price} MAD</p>
            </div>
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-2 mb-3 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <FiCalendar className="text-gray-400" />
              {booking.displayDate}
            </div>
            <div className="flex items-center gap-2">
              <FiClock className="text-gray-400" />
              {booking.displayTime}
            </div>
          </div>

          {booking.address && (
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
              <FiMapPin className="text-gray-400" />
              <span className="truncate">{booking.address}</span>
            </div>
          )}

          {/* Client Info */}
          <div className="flex items-center justify-between pt-3 mt-2 border-t border-gray-100">
            <div className="flex items-center gap-3">
              {client?.avatar ? (
                <img src={client.avatar} className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <span className="text-white font-bold">{client?.name?.charAt(0) || '?'}</span>
                </div>
              )}
              <div>
                <p className="font-medium text-gray-900">{client?.name || 'Client'}</p>
                {client?.phone && (
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <FiPhone className="text-xs" />
                    {client.phone}
                  </p>
                )}
              </div>
            </div>
            {booking.canMessage && (
              <button 
                onClick={() => handleMessageClient(client?._id, booking._id)}
                className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                title="Send message"
              >
                <FiMessageCircle className="text-lg" />
              </button>
            )}
          </div>

          {/* Notes */}
          {booking.notes && (
            <div className="mt-3 p-2 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 italic">"{booking.notes}"</p>
            </div>
          )}

          {/* Rejection Reason */}
          {booking.status === 'rejected' && booking.rejectReason && (
            <div className="mt-3 p-2 bg-red-50 rounded-lg">
              <p className="text-xs text-red-600 font-medium">Reason: {booking.rejectReason}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-gray-100">
            {config.actions.includes('accept') && (
              <button 
                onClick={() => handleAcceptBooking(booking._id)}
                disabled={isProcessing}
                className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-1"
              >
                {isProcessing ? <FiLoader className="animate-spin" /> : <FiThumbsUp className="text-sm" />}
                Accept
              </button>
            )}
            {config.actions.includes('reject') && (
              <button 
                onClick={() => setShowRejectModal(booking._id)}
                disabled={isProcessing}
                className="px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-50 transition-colors flex items-center gap-1"
              >
                <FiThumbsDown className="text-sm" />
                Decline
              </button>
            )}
            {config.actions.includes('confirm') && (
              <button 
                onClick={() => handleConfirmBooking(booking._id)}
                disabled={isProcessing}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-1"
              >
                {isProcessing ? <FiLoader className="animate-spin" /> : <FiCheck className="text-sm" />}
                Confirm Schedule
              </button>
            )}
            {config.actions.includes('start') && (
              <button 
                onClick={() => handleStartBooking(booking._id)}
                disabled={isProcessing}
                className="flex-1 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-1"
              >
                {isProcessing ? <FiLoader className="animate-spin" /> : <FiClockIcon className="text-sm" />}
                Start Service
              </button>
            )}
            {config.actions.includes('complete') && (
              <button 
                onClick={() => handleCompleteBooking(booking._id)}
                disabled={isProcessing}
                className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-1"
              >
                {isProcessing ? <FiLoader className="animate-spin" /> : <FiCheckCircle className="text-sm" />}
                Mark Completed
              </button>
            )}
            {config.actions.includes('cancel') && (
              <button 
                onClick={() => handleCancelBooking(booking._id)}
                disabled={isProcessing}
                className="px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-50 transition-colors flex items-center gap-1"
              >
                <FiXCircle className="text-sm" />
                Cancel
              </button>
            )}
            {booking.canReschedule && (
              <button 
                onClick={() => {
                  setShowRescheduleModal(booking._id);
                  setRescheduleData({ date: booking.date?.split('T')[0] || '', time: booking.time, reason: '' });
                }}
                disabled={isProcessing}
                className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-1"
              >
                <FiEdit2 className="text-sm" />
                Reschedule
              </button>
            )}
          </div>

          {/* Reschedule Request Status */}
          {booking.rescheduleRequest?.status === 'pending' && (
            <div className="mt-3 p-2 bg-yellow-50 rounded-lg">
              <p className="text-xs text-yellow-700">
                Reschedule request pending client approval: {booking.rescheduleRequest.requestedDate?.split('T')[0]} at {booking.rescheduleRequest.requestedTime}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading && !bookings.length) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <FiLoader className="animate-spin text-4xl text-blue-500 mx-auto mb-4" />
          <p className="text-gray-500">Loading bookings...</p>
        </div>
      </div>
    );
  }

  if (!isDesktop) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50 pb-24">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
          <div className="flex items-center gap-3 p-4">
            <button onClick={() => navigate(-1)} className="p-1 -ml-2">
              <FiArrowLeft className="text-xl" />
            </button>
            <h1 className="flex-1 text-lg font-bold">Booking Requests</h1>
            <button onClick={fetchBookings} className="relative">
              <FiRefreshCw className={`text-gray-500 ${loading ? 'animate-spin' : ''}`} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
          <div className="px-4 pb-3">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by service or client..."
                className="w-full h-10 pl-10 pr-4 rounded-lg bg-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </header>

        {/* Status Filter */}
        <div className="px-4 py-2 overflow-x-auto flex gap-2 border-b border-gray-200 bg-white">
          {statusOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                statusFilter === opt.value 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              <opt.icon className="text-sm" />
              {opt.label}
              <span className="text-xs ml-0.5">({opt.count})</span>
            </button>
          ))}
        </div>

        {/* Bookings List */}
        <main className="flex-1 p-4 space-y-4">
          {paginatedBookings.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <FiCalendar className="text-4xl text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No {statusFilter !== 'all' ? statusFilter : ''} bookings</p>
              <p className="text-gray-400 text-sm mt-1">When clients book your services, they'll appear here</p>
            </div>
          ) : (
            paginatedBookings.map(booking => <BookingCard key={booking._id} booking={booking} />)
          )}
        </main>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 p-4">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
              disabled={currentPage === 1}
              className="p-2 rounded-lg border disabled:opacity-50"
            >
              <FiChevronLeft />
            </button>
            <span className="px-3 py-1 text-sm">{currentPage} / {totalPages}</span>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border disabled:opacity-50"
            >
              <FiChevronRight />
            </button>
          </div>
        )}

        {/* Reject Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <h3 className="text-lg font-bold mb-4">Decline Booking</h3>
              <p className="text-sm text-gray-600 mb-3">Please provide a reason for declining:</p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g., Schedule conflict, not available, etc."
                className="w-full p-3 border rounded-lg resize-none h-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={200}
              />
              <div className="flex gap-3 mt-5">
                <button onClick={() => { setShowRejectModal(null); setRejectReason(''); }} className="flex-1 py-2 border rounded-lg">
                  Cancel
                </button>
                <button onClick={handleRejectBooking} className="flex-1 py-2 bg-red-500 text-white rounded-lg">
                  Decline Booking
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reschedule Modal */}
        {showRescheduleModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <h3 className="text-lg font-bold mb-4">Request Reschedule</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">New Date</label>
                  <input
                    type="date"
                    value={rescheduleData.date}
                    onChange={(e) => setRescheduleData(prev => ({ ...prev, date: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">New Time</label>
                  <select
                    value={rescheduleData.time}
                    onChange={(e) => setRescheduleData(prev => ({ ...prev, time: e.target.value }))}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="">Select time</option>
                    <option value="09:00">09:00 AM</option>
                    <option value="10:00">10:00 AM</option>
                    <option value="11:00">11:00 AM</option>
                    <option value="12:00">12:00 PM</option>
                    <option value="13:00">01:00 PM</option>
                    <option value="14:00">02:00 PM</option>
                    <option value="15:00">03:00 PM</option>
                    <option value="16:00">04:00 PM</option>
                    <option value="17:00">05:00 PM</option>
                    <option value="18:00">06:00 PM</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Reason (optional)</label>
                  <textarea
                    value={rescheduleData.reason}
                    onChange={(e) => setRescheduleData(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="e.g., I have another appointment at that time"
                    className="w-full p-2 border rounded-lg resize-none h-20"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => { setShowRescheduleModal(null); setRescheduleData({ date: '', time: '', reason: '' }); }} className="flex-1 py-2 border rounded-lg">
                  Cancel
                </button>
                <button onClick={handleRescheduleRequest} disabled={!rescheduleData.date || !rescheduleData.time} className="flex-1 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50">
                  Send Request
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
          <h2 className="text-2xl font-bold text-gray-900">Booking Requests</h2>
          <p className="text-gray-500 text-sm">Manage incoming booking requests from clients</p>
        </div>
        <div className="flex gap-3">
          {unreadCount > 0 && (
            <div className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm flex items-center gap-1">
              <FiAlertCircle className="text-sm" />
              {unreadCount} new {unreadCount === 1 ? 'request' : 'requests'}
            </div>
          )}
          <button onClick={fetchBookings} className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <FiRefreshCw className={`text-sm ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex-1 max-w-md relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by service or client..."
            className="w-full h-10 pl-10 pr-4 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {statusOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === opt.value 
                  ? 'bg-blue-500 text-white shadow-sm' 
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <opt.icon className="text-sm" />
              {opt.label}
              <span className="text-xs ml-0.5">({opt.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Bookings Grid */}
      {filteredBookings.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <FiCalendar className="text-4xl text-gray-300" />
          </div>
          <p className="text-gray-500 text-lg font-medium">No {statusFilter !== 'all' ? statusFilter : ''} bookings</p>
          <p className="text-gray-400 text-sm mt-2">When clients book your services, they'll appear here</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {paginatedBookings.map(booking => <BookingCard key={booking._id} booking={booking} />)}
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-lg border border-gray-200 disabled:opacity-50 hover:bg-gray-50 transition-colors"
              >
                <FiChevronLeft className="inline mr-1" /> Previous
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) pageNum = i + 1;
                else if (currentPage <= 3) pageNum = i + 1;
                else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                else pageNum = currentPage - 2 + i;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                      currentPage === pageNum
                        ? 'bg-blue-500 text-white'
                        : 'border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-lg border border-gray-200 disabled:opacity-50 hover:bg-gray-50 transition-colors"
              >
                Next <FiChevronRight className="inline ml-1" />
              </button>
            </div>
          )}
        </>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
            <h3 className="text-xl font-bold mb-4">Decline Booking</h3>
            <p className="text-gray-600 mb-3">Please provide a reason for declining:</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g., Schedule conflict, not available in your area, etc."
              className="w-full p-3 border rounded-lg resize-none h-28 focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={200}
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{rejectReason.length}/200</p>
            <div className="flex gap-3 mt-5">
              <button 
                onClick={() => { setShowRejectModal(null); setRejectReason(''); }} 
                className="flex-1 py-2.5 border border-gray-200 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleRejectBooking} 
                className="flex-1 py-2.5 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors flex items-center justify-center gap-1"
                disabled={processingId === showRejectModal}
              >
                {processingId === showRejectModal ? <FiLoader className="animate-spin" /> : <FiThumbsDown />}
                Decline Booking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
            <h3 className="text-xl font-bold mb-4">Request Reschedule</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">New Date *</label>
                <input
                  type="date"
                  value={rescheduleData.date}
                  onChange={(e) => setRescheduleData(prev => ({ ...prev, date: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full p-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">New Time *</label>
                <select
                  value={rescheduleData.time}
                  onChange={(e) => setRescheduleData(prev => ({ ...prev, time: e.target.value }))}
                  className="w-full p-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select time</option>
                  <option value="09:00">09:00 AM</option>
                  <option value="10:00">10:00 AM</option>
                  <option value="11:00">11:00 AM</option>
                  <option value="12:00">12:00 PM</option>
                  <option value="13:00">01:00 PM</option>
                  <option value="14:00">02:00 PM</option>
                  <option value="15:00">03:00 PM</option>
                  <option value="16:00">04:00 PM</option>
                  <option value="17:00">05:00 PM</option>
                  <option value="18:00">06:00 PM</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Reason (optional)</label>
                <textarea
                  value={rescheduleData.reason}
                  onChange={(e) => setRescheduleData(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="e.g., I have another appointment at that time"
                  className="w-full p-2.5 border rounded-lg resize-none h-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => { setShowRescheduleModal(null); setRescheduleData({ date: '', time: '', reason: '' }); }} 
                className="flex-1 py-2.5 border border-gray-200 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleRescheduleRequest} 
                disabled={!rescheduleData.date || !rescheduleData.time || processingId === showRescheduleModal}
                className="flex-1 py-2.5 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
              >
                {processingId === showRescheduleModal ? <FiLoader className="animate-spin" /> : <FiSend />}
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}