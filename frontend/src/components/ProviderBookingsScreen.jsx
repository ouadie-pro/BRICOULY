// frontend/src/components/ProviderBookingsScreen.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { 
  FiCalendar, FiClock, FiMapPin, FiDollarSign, FiUser, FiCheckCircle, 
  FiXCircle, FiAlertCircle, FiMessageCircle, FiRefreshCw, FiLoader,
  FiArrowLeft, FiChevronLeft, FiChevronRight, FiFilter, FiSearch,
  FiPhone, FiMail, FiCheck, FiX
} from 'react-icons/fi';

const STATUS_CONFIG = {
  pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending', bgHover: 'hover:bg-yellow-50' },
  confirmed: { color: 'bg-blue-100 text-blue-800', label: 'Confirmed', bgHover: 'hover:bg-blue-50' },
  completed: { color: 'bg-green-100 text-green-800', label: 'Completed', bgHover: 'hover:bg-green-50' },
  cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelled', bgHover: 'hover:bg-red-50' }
};

const formatDate = (dateString) => {
  if (!dateString) return 'Date TBD';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

export default function ProviderBookingsScreen({ isDesktop }) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(isDesktop ? 6 : 5);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    if (currentUser.role !== 'provider') navigate('/home');
  }, [currentUser.role, navigate]);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.getBookings({ role: 'provider' });
      const bookingsData = result.bookings || [];
      const enhancedBookings = bookingsData.map(booking => ({
        ...booking,
        displayDate: formatDate(booking.date),
        displayTime: booking.time,
        canAccept: booking.status === 'pending',
        canComplete: booking.status === 'confirmed',
        canMessage: ['pending', 'confirmed', 'completed'].includes(booking.status)
      }));
      setBookings(enhancedBookings);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError('Failed to load bookings');
      showToast('Failed to load bookings', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  useEffect(() => {
    let filtered = [...bookings];
    if (statusFilter !== 'all') filtered = filtered.filter(b => b.status === statusFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(b => b.service?.toLowerCase().includes(q) || b.user?.name?.toLowerCase().includes(q));
    }
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    setFilteredBookings(filtered);
    setCurrentPage(1);
  }, [bookings, statusFilter, searchQuery]);

  const handleStatusUpdate = async (bookingId, newStatus) => {
    setProcessingId(bookingId);
    try {
      const result = await api.updateBookingStatus(bookingId, newStatus);
      if (result.success) {
        showToast(`Booking ${newStatus} successfully`, 'success');
        fetchBookings();
      } else {
        showToast(result.error || 'Failed to update status', 'error');
      }
    } catch (err) {
      showToast('Failed to update booking status', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleMessageClient = (clientId) => navigate(`/messages/${clientId}`);

  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const paginatedBookings = filteredBookings.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const statusOptions = [
    { value: 'pending', label: 'Pending', count: bookings.filter(b => b.status === 'pending').length },
    { value: 'confirmed', label: 'Confirmed', count: bookings.filter(b => b.status === 'confirmed').length },
    { value: 'completed', label: 'Completed', count: bookings.filter(b => b.status === 'completed').length },
    { value: 'cancelled', label: 'Cancelled', count: bookings.filter(b => b.status === 'cancelled').length },
    { value: 'all', label: 'All', count: bookings.length },
  ];

  const BookingCard = ({ booking }) => {
    const client = booking.user;
    const config = STATUS_CONFIG[booking.status] || STATUS_CONFIG.pending;
    const isProcessing = processingId === booking._id;
    const isPending = booking.status === 'pending';
    const isConfirmed = booking.status === 'confirmed';

    return (
      <div className={`bg-white rounded-xl border overflow-hidden transition-all ${config.bgHover} ${booking.status === 'cancelled' ? 'border-red-200 bg-red-50/30' : 'border-gray-200'}`}>
        <div className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div><div className="flex items-center gap-2 mb-1"><span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>{config.label}</span><span className="text-xs text-gray-400">#{booking._id?.slice(-8)}</span></div><h3 className="font-semibold text-gray-900">{booking.service}</h3></div>
            <div className="text-right"><p className="text-sm text-gray-500">Total</p><p className="text-lg font-bold text-blue-600">{booking.price} MAD</p></div>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3 text-sm text-gray-600"><div className="flex items-center gap-2"><FiCalendar className="text-gray-400" />{booking.displayDate}</div><div className="flex items-center gap-2"><FiClock className="text-gray-400" />{booking.displayTime}</div></div>
          {booking.address && <div className="flex items-center gap-2 text-sm text-gray-600 mb-3"><FiMapPin className="text-gray-400" /><span>{booking.address}</span></div>}
          <div className="flex items-center justify-between pt-3 mt-2 border-t border-gray-100"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">{client?.avatar ? <img src={client.avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><span className="font-bold">{client?.name?.charAt(0)}</span></div>}</div><div><p className="font-medium text-gray-900">{client?.name || 'Client'}</p>{client?.phone && <p className="text-xs text-gray-500 flex items-center gap-1"><FiPhone className="text-xs" />{client.phone}</p>}</div></div><button onClick={() => handleMessageClient(client?._id)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><FiMessageCircle className="text-lg" /></button></div>
          <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
            {isPending && (<><button onClick={() => handleStatusUpdate(booking._id, 'confirmed')} disabled={isProcessing} className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">{isProcessing ? <FiLoader className="animate-spin inline" /> : <><FiCheck className="inline mr-1" />Accept</>}</button><button onClick={() => handleStatusUpdate(booking._id, 'cancelled')} disabled={isProcessing} className="px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-50"><FiX className="inline mr-1" />Decline</button></>)}
            {isConfirmed && (<button onClick={() => handleStatusUpdate(booking._id, 'completed')} disabled={isProcessing} className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">{isProcessing ? <FiLoader className="animate-spin inline" /> : 'Mark Completed'}</button>)}
          </div>
          {booking.notes && (<div className="mt-3 p-2 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500 italic">"{booking.notes}"</p></div>)}
          {booking.status === 'cancelled' && (<p className="text-xs text-red-500 mt-3 text-center">This booking has been cancelled</p>)}
        </div>
      </div>
    );
  };

  if (loading) return (<div className="flex items-center justify-center min-h-[60vh]"><FiLoader className="animate-spin text-4xl text-blue-500" /></div>);

  if (!isDesktop) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50 pb-24">
        <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
          <div className="flex items-center gap-3 p-4"><button onClick={() => navigate(-1)} className="p-1 -ml-2"><FiArrowLeft className="text-xl" /></button><h1 className="flex-1 text-lg font-bold">Booking Requests</h1><button onClick={fetchBookings}><FiRefreshCw className={`text-gray-500 ${loading ? 'animate-spin' : ''}`} /></button></div>
          <div className="px-4 pb-3"><div className="relative"><FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by service or client..." className="w-full h-10 pl-10 pr-4 rounded-lg bg-gray-100 text-sm" /></div></div>
        </header>
        <div className="px-4 py-2 overflow-x-auto flex gap-2 border-b border-gray-200 bg-white">{statusOptions.map(opt => (<button key={opt.value} onClick={() => setStatusFilter(opt.value)} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${statusFilter === opt.value ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'}`}>{opt.label} ({opt.count})</button>))}</div>
        <main className="flex-1 p-4 space-y-4">{paginatedBookings.map(booking => (<BookingCard key={booking._id} booking={booking} />))}</main>
        {totalPages > 1 && (<div className="flex justify-center gap-2 p-4"><button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-lg border disabled:opacity-50"><FiChevronLeft /></button><span className="px-3 py-1 text-sm">{currentPage} / {totalPages}</span><button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-lg border disabled:opacity-50"><FiChevronRight /></button></div>)}
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-[calc(100vh-64px)]">
      <div className="flex items-center justify-between"><div><h2 className="text-2xl font-bold text-gray-900">Booking Requests</h2><p className="text-gray-500 text-sm">Manage incoming booking requests from clients</p></div><button onClick={fetchBookings} className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"><FiRefreshCw className="text-sm" />Refresh</button></div>
      <div className="flex flex-wrap items-center gap-4"><div className="flex-1 max-w-md relative"><FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by service or client..." className="w-full h-10 pl-10 pr-4 rounded-lg border border-gray-200" /></div><div className="flex gap-2">{statusOptions.map(opt => (<button key={opt.value} onClick={() => setStatusFilter(opt.value)} className={`px-4 py-2 rounded-lg text-sm font-medium ${statusFilter === opt.value ? 'bg-blue-500 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>{opt.label} ({opt.count})</button>))}</div></div>
      {filteredBookings.length === 0 ? (<div className="bg-white rounded-xl border border-gray-200 p-12 text-center"><div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4"><FiCalendar className="text-4xl text-gray-300" /></div><p className="text-gray-500 text-lg font-medium">No booking requests</p><p className="text-gray-400 text-sm mt-2">When clients book your services, they'll appear here</p></div>) : (<><div className="grid grid-cols-1 lg:grid-cols-2 gap-6">{paginatedBookings.map(booking => (<BookingCard key={booking._id} booking={booking} />))}</div>{totalPages > 1 && (<div className="flex justify-center gap-2 mt-6">{/* pagination - same as above */}</div>)}</>)}
    </div>
  );
}