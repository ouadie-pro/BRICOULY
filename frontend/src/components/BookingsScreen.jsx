// frontend/src/components/BookingsScreen.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { 
  FiCalendar, FiClock, FiMapPin, FiDollarSign, FiUser, FiCheckCircle, 
  FiXCircle, FiAlertCircle, FiMessageCircle, FiRefreshCw, FiLoader,
  FiStar, FiArrowLeft, FiChevronLeft, FiChevronRight, FiFilter,
  FiSearch, FiClock as FiClockIcon
} from 'react-icons/fi';

const STATUS_CONFIG = {
  pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending', icon: FiClockIcon, badge: 'Awaiting Confirmation' },
  confirmed: { color: 'bg-blue-100 text-blue-800', label: 'Confirmed', icon: FiCheckCircle, badge: 'Confirmed' },
  completed: { color: 'bg-green-100 text-green-800', label: 'Completed', icon: FiCheckCircle, badge: 'Completed' },
  cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelled', icon: FiXCircle, badge: 'Cancelled' }
};

const formatDate = (dateString) => {
  if (!dateString) return 'Date TBD';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const formatTime = (timeString) => timeString || 'Time TBD';

export default function BookingsScreen({ isDesktop }) {
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
  const [sortBy, setSortBy] = useState('newest');

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.getBookings({ role: 'client' });
      const bookingsData = result.bookings || [];
      const enhancedBookings = bookingsData.map(booking => ({
        ...booking,
        displayDate: formatDate(booking.date),
        displayTime: formatTime(booking.time),
        canCancel: booking.status === 'pending',
        canReview: booking.status === 'completed',
        canMessage: ['confirmed', 'completed'].includes(booking.status)
      }));
      setBookings(enhancedBookings);
      setFilteredBookings(enhancedBookings);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  useEffect(() => {
    let filtered = [...bookings];
    if (statusFilter !== 'all') filtered = filtered.filter(b => b.status === statusFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(b => b.service?.toLowerCase().includes(q) || b.provider?.user?.name?.toLowerCase().includes(q));
    }
    filtered.sort((a, b) => sortBy === 'newest' ? new Date(b.createdAt) - new Date(a.createdAt) : new Date(a.createdAt) - new Date(b.createdAt));
    setFilteredBookings(filtered);
    setCurrentPage(1);
  }, [bookings, statusFilter, searchQuery, sortBy]);

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      const result = await api.cancelBooking(bookingId);
      if (result.success) {
        showToast('Booking cancelled successfully', 'success');
        fetchBookings();
      } else {
        showToast(result.error || 'Failed to cancel', 'error');
      }
    } catch (err) {
      showToast('Failed to cancel booking', 'error');
    }
  };

  const handleMessage = (providerId) => navigate(`/messages/${providerId}`);
  const handleReview = (booking) => navigate(`/review/${booking.provider?.user?._id || booking.provider?._id}?bookingId=${booking._id}`);
  const handleViewProvider = (providerId) => navigate(`/provider/${providerId}`);

  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const paginatedBookings = filteredBookings.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const statusOptions = [
    { value: 'all', label: 'All', count: bookings.length },
    { value: 'pending', label: 'Pending', count: bookings.filter(b => b.status === 'pending').length },
    { value: 'confirmed', label: 'Confirmed', count: bookings.filter(b => b.status === 'confirmed').length },
    { value: 'completed', label: 'Completed', count: bookings.filter(b => b.status === 'completed').length },
    { value: 'cancelled', label: 'Cancelled', count: bookings.filter(b => b.status === 'cancelled').length },
  ];

  const BookingCard = ({ booking }) => {
    const config = STATUS_CONFIG[booking.status] || STATUS_CONFIG.pending;
    const Icon = config.icon;
    const providerUser = booking.provider?.user || booking.provider;
    const isCancelled = booking.status === 'cancelled';
    const isPending = booking.status === 'pending';
    const isConfirmed = booking.status === 'confirmed';
    const isCompleted = booking.status === 'completed';

    return (
      <div className={`bg-white rounded-xl border overflow-hidden transition-shadow hover:shadow-md ${isCancelled ? 'border-red-200 bg-red-50/30' : 'border-gray-200'}`}>
        <div className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              {providerUser?.avatar ? <img src={providerUser.avatar} className="w-12 h-12 rounded-full object-cover cursor-pointer" onClick={() => handleViewProvider(providerUser._id)} /> : <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center cursor-pointer" onClick={() => handleViewProvider(providerUser?._id)}><span className="text-white font-bold text-lg">{providerUser?.name?.charAt(0)}</span></div>}
              <div><h3 className="font-semibold text-gray-900 cursor-pointer hover:text-blue-600" onClick={() => handleViewProvider(providerUser?._id)}>{providerUser?.name || 'Provider'}</h3><p className="text-sm text-gray-500">{booking.service}</p></div>
            </div>
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${config.color}`}><Icon className="w-3 h-3" />{config.label}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3 text-sm text-gray-600"><div className="flex items-center gap-2"><FiCalendar className="text-gray-400" />{booking.displayDate}</div><div className="flex items-center gap-2"><FiClock className="text-gray-400" />{booking.displayTime}</div></div>
          {booking.address && <div className="flex items-center gap-2 text-sm text-gray-600 mb-3"><FiMapPin className="text-gray-400" /><span>{booking.address}</span></div>}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100"><div className="text-right"><p className="text-sm text-gray-500">Total</p><p className="text-lg font-bold text-blue-600">{booking.price} MAD</p></div></div>
          <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
            {isPending && <button onClick={() => handleCancel(booking._id)} className="flex-1 py-2 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50">Cancel</button>}
            {isConfirmed && <button onClick={() => handleMessage(providerUser?._id)} className="flex-1 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium">Message Provider</button>}
            {isCompleted && <><button onClick={() => handleReview(booking)} className="flex-1 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium"><FiStar className="inline mr-1" />Leave Review</button><button onClick={() => handleMessage(providerUser?._id)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm">Message</button></>}
          </div>
          {isCancelled && <p className="text-xs text-red-500 mt-3 text-center">This booking has been cancelled</p>}
        </div>
      </div>
    );
  };

  if (loading) return (<div className="flex items-center justify-center min-h-[60vh]"><FiLoader className="animate-spin text-4xl text-blue-500" /></div>);

  if (error && !bookings.length) return (<div className="flex flex-col items-center justify-center min-h-[60vh]"><FiAlertCircle className="text-5xl text-red-400 mb-4" /><p className="text-gray-600 mb-4">{error}</p><button onClick={fetchBookings} className="px-6 py-2 bg-blue-500 text-white rounded-lg">Try Again</button></div>);

  if (!isDesktop) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50 pb-24">
        <header className="sticky top-0 z-40 bg-white border-b border-gray-200"><div className="flex items-center justify-between p-4"><h1 className="text-xl font-bold">My Bookings</h1><button onClick={fetchBookings}><FiRefreshCw className={`text-gray-500 ${loading ? 'animate-spin' : ''}`} /></button></div><div className="px-4 pb-3"><div className="relative"><FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by service or provider..." className="w-full h-10 pl-10 pr-4 rounded-lg bg-gray-100 text-sm" /></div></div></header>
        <div className="px-4 py-2 overflow-x-auto flex gap-2 border-b border-gray-200 bg-white">{statusOptions.map(opt => (<button key={opt.value} onClick={() => setStatusFilter(opt.value)} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${statusFilter === opt.value ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'}`}>{opt.label} ({opt.count})</button>))}</div>
        <main className="flex-1 p-4 space-y-4">{paginatedBookings.map(booking => (<BookingCard key={booking._id} booking={booking} />))}</main>
        {totalPages > 1 && (<div className="flex justify-center gap-2 p-4"><button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-lg border disabled:opacity-50"><FiChevronLeft /></button><span className="px-3 py-1 text-sm">{currentPage} / {totalPages}</span><button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-lg border disabled:opacity-50"><FiChevronRight /></button></div>)}
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-[calc(100vh-64px)]">
      <div className="flex items-center justify-between"><div><h2 className="text-2xl font-bold text-gray-900">My Bookings</h2><p className="text-gray-500 text-sm">Track and manage your service bookings</p></div><button onClick={fetchBookings} className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"><FiRefreshCw className="text-sm" />Refresh</button></div>
      <div className="flex flex-wrap items-center gap-4"><div className="flex-1 max-w-md relative"><FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by service or provider..." className="w-full h-10 pl-10 pr-4 rounded-lg border border-gray-200" /></div><div className="flex gap-2">{statusOptions.map(opt => (<button key={opt.value} onClick={() => setStatusFilter(opt.value)} className={`px-4 py-2 rounded-lg text-sm font-medium ${statusFilter === opt.value ? 'bg-blue-500 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>{opt.label} ({opt.count})</button>))}</div><select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"><option value="newest">Newest First</option><option value="oldest">Oldest First</option></select></div>
      {filteredBookings.length === 0 ? (<div className="bg-white rounded-xl border border-gray-200 p-12 text-center"><div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4"><FiCalendar className="text-4xl text-gray-300" /></div><p className="text-gray-500 text-lg font-medium">No bookings found</p><p className="text-gray-400 text-sm mt-2">You haven't made any bookings yet. Find a provider to get started!</p></div>) : (<><div className="grid grid-cols-1 lg:grid-cols-2 gap-6">{paginatedBookings.map(booking => (<BookingCard key={booking._id} booking={booking} />))}</div>{totalPages > 1 && (<div className="flex justify-center gap-2 mt-6">{/* pagination controls */}</div>)}</>)}
    </div>
  );
}