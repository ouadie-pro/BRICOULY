// frontend/src/components/MyRequestsScreen.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { 
  FiInbox, FiPlus, FiClock, FiCheckCircle, FiXCircle, FiTool, 
  FiX, FiMapPin, FiCalendar, FiDollarSign, FiAlertCircle, FiSearch,
  FiFilter, FiChevronLeft, FiChevronRight, FiRefreshCw, FiUser,
  FiMessageCircle, FiStar, FiTrash2, FiLoader
} from 'react-icons/fi';
import RatingModal from './RatingModal';

const SERVICE_TYPES = [
  { value: 'plumber', label: 'Plumber', icon: '🔧' },
  { value: 'electrician', label: 'Electrician', icon: '⚡' },
  { value: 'painter', label: 'Painter', icon: '🎨' },
  { value: 'carpenter', label: 'Carpenter', icon: '🪚' },
  { value: 'cleaner', label: 'Cleaner', icon: '🧹' },
  { value: 'mover', label: 'Mover', icon: '🚚' },
  { value: 'hvac', label: 'HVAC', icon: '❄️' },
  { value: 'landscaper', label: 'Landscaper', icon: '🌿' },
  { value: 'roofer', label: 'Roofer', icon: '🏠' },
  { value: 'appliance_repair', label: 'Appliance Repair', icon: '🔌' },
  { value: 'general', label: 'General', icon: '🛠️' },
];

const STATUS_CONFIG = {
  open: { color: 'bg-green-100 text-green-800', label: 'Open', icon: FiCheckCircle },
  pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending', icon: FiClock },
  in_progress: { color: 'bg-blue-100 text-blue-800', label: 'In Progress', icon: FiTool },
  completed: { color: 'bg-purple-100 text-purple-800', label: 'Completed', icon: FiCheckCircle },
  cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelled', icon: FiXCircle }
};

function NewRequestModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({ serviceType: '', title: '', description: '', preferredDate: '', preferredTime: 'anytime', location: '', budget: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.serviceType || !formData.title.trim()) { setError('Please select a service type and enter a title'); return; }
    setLoading(true);
    try {
      const result = await api.createServiceRequest({ serviceType: formData.serviceType, title: formData.title, description: formData.description, preferredDate: formData.preferredDate || null, preferredTime: formData.preferredTime, location: formData.location, budget: formData.budget ? parseFloat(formData.budget) : null });
      if (result.success) { showToast('Request created successfully!', 'success'); onSuccess(); onClose(); setFormData({ serviceType: '', title: '', description: '', preferredDate: '', preferredTime: 'anytime', location: '', budget: '' }); }
      else setError(result.error || 'Failed to create request');
    } catch (err) { setError('Failed to create request'); } finally { setLoading(false); }
  };

  if (!isOpen) return null;
  const today = new Date().toISOString().split('T')[0];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between"><div><h3 className="text-xl font-bold">New Service Request</h3><p className="text-sm text-gray-500">Get quotes from qualified providers</p></div><button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><FiX /></button></div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"><FiAlertCircle />{error}</div>}
          <div><label className="block text-sm font-medium mb-1.5">Service Type *</label><select name="serviceType" value={formData.serviceType} onChange={(e) => setFormData({...formData, serviceType: e.target.value})} className="w-full p-2.5 border rounded-lg"><option value="">Select a service...</option>{SERVICE_TYPES.map(t => (<option key={t.value} value={t.value}>{t.icon} {t.label}</option>))}</select></div>
          <div><label className="block text-sm font-medium mb-1.5">Title *</label><input type="text" name="title" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="e.g., Fix kitchen sink leak" className="w-full p-2.5 border rounded-lg" /></div>
          <div><label className="block text-sm font-medium mb-1.5">Description</label><textarea name="description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={3} placeholder="Describe the problem..." className="w-full p-2.5 border rounded-lg resize-none" /></div>
          <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium mb-1.5">Preferred Date</label><input type="date" name="preferredDate" value={formData.preferredDate} onChange={(e) => setFormData({...formData, preferredDate: e.target.value})} min={today} className="w-full p-2.5 border rounded-lg" /></div><div><label className="block text-sm font-medium mb-1.5">Preferred Time</label><select name="preferredTime" value={formData.preferredTime} onChange={(e) => setFormData({...formData, preferredTime: e.target.value})} className="w-full p-2.5 border rounded-lg"><option value="anytime">Any time</option><option value="morning">Morning</option><option value="afternoon">Afternoon</option><option value="evening">Evening</option></select></div></div>
          <div><label className="block text-sm font-medium mb-1.5">Location</label><input type="text" name="location" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} placeholder="Your address or area" className="w-full p-2.5 border rounded-lg" /></div>
          <div><label className="block text-sm font-medium mb-1.5">Budget (MAD)</label><input type="number" name="budget" value={formData.budget} onChange={(e) => setFormData({...formData, budget: e.target.value})} placeholder="Your maximum budget" min="0" className="w-full p-2.5 border rounded-lg" /></div>
          <div className="flex gap-3 pt-4"><button type="button" onClick={onClose} className="flex-1 py-2.5 border rounded-lg">Cancel</button><button type="submit" disabled={loading} className="flex-1 py-2.5 bg-blue-500 text-white rounded-lg">{loading ? 'Submitting...' : 'Submit Request'}</button></div>
        </form>
      </div>
    </div>
  );
}

export default function MyRequestsScreen({ isDesktop }) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isProvider = currentUser.role === 'provider';
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [serviceTypeFilter, setServiceTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(isDesktop ? 9 : 6);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      let result;
      if (isProvider) result = await api.getProviderServiceRequests();
      else result = await api.getClientServiceRequests();
      setRequests(result.requests || result || []);
    } catch (error) { console.error('Error fetching requests:', error); showToast('Failed to load requests', 'error'); setRequests([]); } 
    finally { setLoading(false); }
  }, [isProvider, showToast]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);
  useEffect(() => {
    let filtered = [...requests];
    if (statusFilter !== 'all') filtered = filtered.filter(r => r.status === statusFilter);
    if (serviceTypeFilter !== 'all') filtered = filtered.filter(r => r.serviceType === serviceTypeFilter);
    if (searchQuery) { const q = searchQuery.toLowerCase(); filtered = filtered.filter(r => r.title?.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q)); }
    setFilteredRequests(filtered); setCurrentPage(1);
  }, [requests, statusFilter, serviceTypeFilter, searchQuery]);

  const handleApply = async (requestId) => { try { const result = await api.applyForServiceRequest(requestId); if (result.success) { showToast('Application submitted!', 'success'); fetchRequests(); } else showToast(result.error || 'Failed to apply', 'error'); } catch (error) { showToast('Failed to apply', 'error'); } };
  const handleCancelRequest = async (requestId) => { if (!confirm('Cancel this request?')) return; try { const result = await api.deleteServiceRequest(requestId); if (result.success) { showToast('Request cancelled', 'success'); fetchRequests(); } else showToast(result.error || 'Failed to cancel', 'error'); } catch (error) { showToast('Failed to cancel', 'error'); } };
  const handleCompleteRequest = async (requestId) => { if (!confirm('Mark as completed?')) return; try { const result = await api.completeServiceRequest(requestId); if (result.success) { showToast('Request completed!', 'success'); fetchRequests(); } else showToast(result.error || 'Failed to complete', 'error'); } catch (error) { showToast('Failed to complete', 'error'); } };
  const handleReviewClick = (request) => { if (request.acceptedProviderId) { setSelectedProvider(request.acceptedProviderId); setSelectedRequest(request); setShowRatingModal(true); } else showToast('Provider info not available', 'error'); };
  const handleMessageProvider = (providerId) => navigate(`/messages/${providerId}`);

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const paginatedRequests = filteredRequests.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const RequestCard = ({ request }) => {
    const isClient = !isProvider;
    const canApply = isProvider && request.status === 'open';
    const canMessage = isClient && request.status === 'in_progress' && request.acceptedProviderId;
    const canComplete = (isClient || isProvider) && request.status === 'in_progress';
    const canReview = isClient && request.status === 'completed' && request.acceptedProviderId;
    const canCancel = isClient && request.status === 'open';
    const config = STATUS_CONFIG[request.status] || STATUS_CONFIG.open;
    const Icon = config.icon;

    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
        <div className="p-5"><div className="flex items-start justify-between mb-3"><div><div className="flex items-center gap-2 mb-2"><span className="text-sm font-medium text-blue-600">{SERVICE_TYPES.find(t => t.value === request.serviceType)?.label || request.serviceType}</span><span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}><Icon className="w-3 h-3" />{config.label}</span></div><h3 className="font-bold text-gray-900 text-lg">{request.title}</h3>{request._matchScore != null && <div className="flex items-center gap-1 mt-1"><span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">⭐ {request._matchScore}% match</span></div>}</div>{canCancel && <button onClick={() => handleCancelRequest(request._id || request.id)} className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50"><FiTrash2 className="text-sm" /></button>}</div>
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">{request.description}</p>
          <div className="flex flex-wrap gap-2 mb-4 text-xs">{request.preferredDate && <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded"><FiCalendar className="text-xs" />{new Date(request.preferredDate).toLocaleDateString()}{request.preferredTime !== 'anytime' && ` • ${request.preferredTime}`}</span>}{request.location && <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded"><FiMapPin className="text-xs" />{request.location}</span>}{request.budget && <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded"><FiDollarSign className="text-xs" />{request.budget} MAD</span>}</div>
          {!isProvider && request.applicationDetails?.length > 0 && (<div className="mb-4 p-3 bg-gray-50 rounded-lg"><p className="text-xs font-medium text-gray-700 mb-2">{request.applicationDetails.length} application(s)</p><div className="space-y-2">{request.applicationDetails.slice(0, 2).map((app, idx) => (<div key={idx} className="flex items-center justify-between text-xs"><div className="flex items-center gap-2">{app.providerAvatar ? <img src={app.providerAvatar} className="w-5 h-5 rounded-full" /> : <div className="w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center"><span className="text-[10px]">{app.providerName?.charAt(0)}</span></div>}<span>{app.providerName}</span></div><span className={`px-1.5 py-0.5 rounded text-[10px] ${app.status === 'pending' ? 'bg-yellow-100' : app.status === 'accepted' ? 'bg-green-100' : 'bg-red-100'}`}>{app.status}</span></div>))}{request.applicationDetails.length > 2 && <p className="text-xs text-gray-400">+{request.applicationDetails.length - 2} more</p>}</div></div>)}
          {request.acceptedProviderId && (<div className="flex items-center gap-3 mb-4 p-3 bg-green-50 rounded-lg"><div className="w-10 h-10 rounded-full bg-green-200 flex items-center justify-center"><FiUser className="text-green-600" /></div><div className="flex-1"><p className="font-medium text-sm">{request.acceptedProviderId.name}</p><p className="text-xs text-green-600">Accepted Provider</p></div></div>)}
          <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">{canApply && <button onClick={() => handleApply(request._id || request.id)} className="flex-1 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium">Apply Now</button>}{canMessage && <button onClick={() => handleMessageProvider(request.acceptedProviderId._id || request.acceptedProviderId)} className="flex-1 py-2 bg-white border border-blue-500 text-blue-500 rounded-lg text-sm font-medium"><FiMessageCircle className="inline mr-1" />Message</button>}{canComplete && <button onClick={() => handleCompleteRequest(request._id || request.id)} className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-medium">Mark Complete</button>}{canReview && <button onClick={() => handleReviewClick(request)} className="flex-1 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium"><FiStar className="inline mr-1" />Leave Review</button>}</div>
        </div>
      </div>
    );
  };

  if (loading && !requests.length) return (<div className="flex items-center justify-center min-h-[60vh]"><FiLoader className="animate-spin text-4xl text-blue-500" /></div>);

  return (
    <div className={`space-y-6 ${isDesktop ? 'p-6' : 'p-4 pb-24'}`}>
      <div className="flex items-center justify-between"><div><h2 className="text-2xl font-bold text-gray-900">{isProvider ? 'Available Jobs' : 'My Service Requests'}</h2><p className="text-gray-500 text-sm">{isProvider ? 'Browse and apply for service requests' : 'Track your service requests'}</p></div><div className="flex gap-3"><button onClick={fetchRequests} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"><FiRefreshCw className={`text-lg ${loading ? 'animate-spin' : ''}`} /></button>{!isProvider && <button onClick={() => setShowNewRequestModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium"><FiPlus />New Request</button>}</div></div>
      <div className="flex flex-wrap items-center gap-4"><div className="flex-1 max-w-md relative"><FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by title..." className="w-full h-10 pl-10 pr-4 rounded-lg border border-gray-200" /></div><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"><option value="all">All Status</option><option value="open">Open</option><option value="in_progress">In Progress</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select><select value={serviceTypeFilter} onChange={(e) => setServiceTypeFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"><option value="all">All Services</option>{SERVICE_TYPES.map(t => (<option key={t.value} value={t.value}>{t.label}</option>))}</select></div>
      {filteredRequests.length === 0 ? (<div className="bg-white rounded-xl border border-gray-200 p-12 text-center"><div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4"><FiInbox className="text-4xl text-gray-300" /></div><p className="text-gray-500 text-lg font-medium">{isProvider ? 'No available jobs' : 'No requests yet'}</p><p className="text-gray-400 text-sm mt-2">{isProvider ? 'Check back later' : 'Create your first request to find a provider'}</p>{!isProvider && <button onClick={() => setShowNewRequestModal(true)} className="mt-6 px-6 py-3 bg-blue-500 text-white rounded-lg">+ New Request</button>}</div>) : (<><div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">{paginatedRequests.map(req => (<RequestCard key={req._id || req.id} request={req} />))}</div>{totalPages > 1 && (<div className="flex justify-center gap-2 mt-6">{/* pagination controls */}</div>)}</>)}
      <NewRequestModal isOpen={showNewRequestModal} onClose={() => setShowNewRequestModal(false)} onSuccess={fetchRequests} />
      {showRatingModal && selectedProvider && (<RatingModal isOpen={showRatingModal} onClose={() => { setShowRatingModal(false); setSelectedProvider(null); setSelectedRequest(null); }} provider={selectedProvider} booking={selectedRequest} onReviewSubmitted={() => { fetchRequests(); setShowRatingModal(false); }} />)}
    </div>
  );
}