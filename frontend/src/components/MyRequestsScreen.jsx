// frontend/src/components/MyRequestsScreen.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { 
  FiInbox, FiPlus, FiClock, FiCheckCircle, FiXCircle, FiTool, 
  FiX, FiMapPin, FiCalendar, FiDollarSign, FiAlertCircle, FiSearch,
  FiFilter, FiChevronLeft, FiChevronRight, FiRefreshCw, FiUser,
  FiMessageCircle, FiStar, FiTrash2, FiEdit2, FiLoader
} from 'react-icons/fi';
import RatingModal from './RatingModal';

const SERVICE_TYPES = [
  { value: 'plumber', label: 'Plumber', icon: '🔧' },
  { value: 'electrician', label: 'Electrician', icon: '⚡' },
  { value: 'painter', label: 'Painter', icon: '🎨' },
  { value: 'carpenter', label: 'Carpenter', icon: '🪚' },
  { value: 'cleaner', label: 'Home Cleaner', icon: '🧹' },
  { value: 'mover', label: 'Mover', icon: '🚚' },
  { value: 'hvac', label: 'HVAC Technician', icon: '❄️' },
  { value: 'landscaper', label: 'Landscaper', icon: '🌿' },
  { value: 'roofer', label: 'Roofer', icon: '🏠' },
  { value: 'appliance_repair', label: 'Appliance Repair', icon: '🔌' },
  { value: 'general', label: 'General', icon: '🛠️' },
];

const STATUS_CONFIG = {
  open: { color: 'bg-green-100 text-green-800', label: 'Open', icon: FiCheckCircle, badge: 'Available' },
  pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending', icon: FiClock, badge: 'Under Review' },
  in_progress: { color: 'bg-blue-100 text-blue-800', label: 'In Progress', icon: FiTool, badge: 'Active' },
  completed: { color: 'bg-purple-100 text-purple-800', label: 'Completed', icon: FiCheckCircle, badge: 'Done' },
  cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelled', icon: FiXCircle, badge: 'Cancelled' }
};

function NewRequestModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    serviceType: '',
    title: '',
    description: '',
    preferredDate: '',
    preferredTime: 'anytime',
    location: '',
    budget: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { showToast } = useToast();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.serviceType) {
      setError('Please select a service type');
      return;
    }
    if (!formData.title.trim()) {
      setError('Please enter a title');
      return;
    }

    setLoading(true);
    try {
      const requestData = {
        serviceType: formData.serviceType,
        title: formData.title,
        description: formData.description,
        preferredDate: formData.preferredDate || null,
        preferredTime: formData.preferredTime,
        location: formData.location,
        budget: formData.budget ? parseFloat(formData.budget) : null,
      };

      const result = await api.createServiceRequest(requestData);

      if (result.success) {
        showToast('Service request created successfully!', 'success');
        onSuccess();
        onClose();
        setFormData({
          serviceType: '',
          title: '',
          description: '',
          preferredDate: '',
          preferredTime: 'anytime',
          location: '',
          budget: '',
        });
      } else {
        setError(result.error || 'Failed to create request');
      }
    } catch (err) {
      console.error('Error creating request:', err);
      setError('Failed to create request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const today = new Date().toISOString().split('T')[0];
  const selectedService = SERVICE_TYPES.find(s => s.value === formData.serviceType);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div>
            <h3 className="text-xl font-bold text-slate-900">New Service Request</h3>
            <p className="text-sm text-slate-500 mt-0.5">Get quotes from qualified providers</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <FiX className="text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <FiAlertCircle className="text-red-500" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Service Type *
            </label>
            <select
              name="serviceType"
              value={formData.serviceType}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            >
              <option value="">Select a service...</option>
              {SERVICE_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.icon} {type.label}
                </option>
              ))}
            </select>
            {selectedService && (
              <p className="text-xs text-slate-400 mt-1">
                You'll receive quotes from {selectedService.label}s in your area
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Title / Subject *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Fix kitchen sink leak, Install ceiling fan..."
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              placeholder="Describe the problem or service needed in detail..."
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
            />
            <p className="text-xs text-slate-400 mt-1">
              {formData.description.length}/500 characters
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                <span className="flex items-center gap-1">
                  <FiCalendar className="text-slate-400" />
                  Preferred Date
                </span>
              </label>
              <input
                type="date"
                name="preferredDate"
                value={formData.preferredDate}
                onChange={handleChange}
                min={today}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Preferred Time
              </label>
              <select
                name="preferredTime"
                value={formData.preferredTime}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              >
                <option value="anytime">Any time</option>
                <option value="morning">Morning (8AM - 12PM)</option>
                <option value="afternoon">Afternoon (12PM - 5PM)</option>
                <option value="evening">Evening (5PM - 8PM)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              <span className="flex items-center gap-1">
                <FiMapPin className="text-slate-400" />
                Location
              </span>
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="Your address or area (e.g., Casablanca, Rabat...)"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              <span className="flex items-center gap-1">
                <FiDollarSign className="text-slate-400" />
                Budget (MAD)
              </span>
            </label>
            <input
              type="number"
              name="budget"
              value={formData.budget}
              onChange={handleChange}
              placeholder="Your maximum budget"
              min="0"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
            <p className="text-xs text-slate-400 mt-1">Optional - helps providers understand your budget range</p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? <FiLoader className="animate-spin inline mr-2" /> : null}
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
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
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [serviceTypeFilter, setServiceTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [minBudget, setMinBudget] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(isDesktop ? 9 : 6);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      let result;
      
      if (isProvider) {
        const filterParams = {};
        if (cityFilter) filterParams.city = cityFilter;
        if (minBudget) filterParams.minBudget = minBudget;
        if (maxBudget) filterParams.maxBudget = maxBudget;
        result = await api.getProviderServiceRequests(filterParams);
        const requestsData = result.requests || result || [];
        setRequests(requestsData);
      } else {
        // For clients, fetch service requests they created
        result = await api.getClientServiceRequests();
        const requestsData = result.requests || result || [];
        setRequests(requestsData);
      }
      
    } catch (error) {
      console.error('Error fetching requests:', error);
      showToast('Failed to load requests', 'error');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [isProvider, cityFilter, minBudget, maxBudget, showToast]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Apply filters
  useEffect(() => {
    let filtered = [...requests];
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === statusFilter);
    }
    
    if (serviceTypeFilter !== 'all') {
      filtered = filtered.filter(r => r.serviceType === serviceTypeFilter);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r => 
        r.title?.toLowerCase().includes(query) ||
        r.description?.toLowerCase().includes(query)
      );
    }
    
    setFilteredRequests(filtered);
    setCurrentPage(1);
  }, [requests, statusFilter, serviceTypeFilter, searchQuery]);

  const handleRequestSuccess = () => {
    fetchRequests();
  };

  const handleApply = async (requestId) => {
    try {
      const result = await api.applyForServiceRequest(requestId);
      if (result.success) {
        showToast('Application submitted successfully!', 'success');
        fetchRequests();
      } else {
        showToast(result.error || 'Failed to apply', 'error');
      }
    } catch (error) {
      console.error('Error applying for request:', error);
      showToast('Failed to apply for this request', 'error');
    }
  };

  const handleCancelRequest = async (requestId) => {
    if (!confirm('Are you sure you want to cancel this request?')) return;
    
    try {
      const result = await api.deleteServiceRequest(requestId);
      if (result.success) {
        showToast('Request cancelled successfully', 'success');
        fetchRequests();
      } else {
        showToast(result.error || 'Failed to cancel request', 'error');
      }
    } catch (error) {
      console.error('Error cancelling request:', error);
      showToast('Failed to cancel request', 'error');
    }
  };

  const handleCompleteRequest = async (requestId) => {
    if (!confirm('Mark this request as completed?')) return;
    
    try {
      const result = await api.completeServiceRequest(requestId);
      if (result.success) {
        showToast('Request marked as completed!', 'success');
        fetchRequests();
      } else {
        showToast(result.error || 'Failed to complete request', 'error');
      }
    } catch (error) {
      console.error('Error completing request:', error);
      showToast('Failed to complete request', 'error');
    }
  };

  const handleReviewClick = (request) => {
    const provider = request.acceptedProviderId;
    if (provider) {
      setSelectedProvider(provider);
      setSelectedRequest(request);
      setShowRatingModal(true);
    } else {
      showToast('Provider information not available', 'error');
    }
  };

  const handleMessageProvider = (providerId) => {
    navigate(`/messages/${providerId}`);
  };

  const getStatusBadge = (status) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.open;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getServiceTypeLabel = (type) => {
    const found = SERVICE_TYPES.find(t => t.value === type);
    return found ? `${found.icon} ${found.label}` : type;
  };

  // Pagination
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const statusOptions = [
    { value: 'all', label: 'All' },
    { value: 'open', label: 'Open' },
    { value: 'pending', label: 'Pending' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  const RequestCard = ({ request }) => {
    const isClient = !isProvider;
    const canApply = isProvider && request.status === 'open';
    const canMessage = isClient && request.status === 'in_progress' && request.acceptedProviderId;
    const canComplete = (isClient || isProvider) && request.status === 'in_progress';
    const canReview = isClient && request.status === 'completed' && request.acceptedProviderId;
    const canCancel = isClient && request.status === 'open';
    
    return (
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
        <div className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-primary">
                  {getServiceTypeLabel(request.serviceType)}
                </span>
                {getStatusBadge(request.status)}
              </div>
              <h3 className="font-bold text-slate-900 text-lg">{request.title}</h3>
              {request._matchScore != null && (
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">
                    ⭐ {request._matchScore}% match
                  </span>
                </div>
              )}
            </div>
            {canCancel && (
              <button
                onClick={() => handleCancelRequest(request._id || request.id)}
                className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50"
                title="Cancel Request"
              >
                <FiTrash2 className="text-sm" />
              </button>
            )}
          </div>
          
          <p className="text-slate-600 text-sm mb-4 line-clamp-2">{request.description}</p>
          
          {/* Details */}
          <div className="flex flex-wrap gap-2 mb-4 text-xs">
            {request.preferredDate && (
              <span className="flex items-center gap-1 bg-slate-50 text-slate-600 px-2 py-1 rounded">
                <FiCalendar className="text-slate-400 text-xs" />
                {formatDate(request.preferredDate)}
                {request.preferredTime && request.preferredTime !== 'anytime' && ` • ${request.preferredTime}`}
              </span>
            )}
            {request.location && (
              <span className="flex items-center gap-1 bg-slate-50 text-slate-600 px-2 py-1 rounded">
                <FiMapPin className="text-slate-400 text-xs" />
                {request.location}
              </span>
            )}
            {request.budget && (
              <span className="flex items-center gap-1 bg-slate-50 text-slate-600 px-2 py-1 rounded">
                <FiDollarSign className="text-slate-400 text-xs" />
                {request.budget} MAD
              </span>
            )}
          </div>
          
          {/* Applications Info (for clients) */}
          {!isProvider && request.applicationDetails && request.applicationDetails.length > 0 && (
            <div className="mb-4 p-3 bg-slate-50 rounded-lg">
              <p className="text-xs font-medium text-slate-700 mb-2">
                {request.applicationDetails.length} application{request.applicationDetails.length !== 1 ? 's' : ''}
              </p>
              <div className="space-y-2">
                {request.applicationDetails.slice(0, 2).map((app, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      {app.providerAvatar ? (
                        <img src={app.providerAvatar} className="w-5 h-5 rounded-full" />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-slate-300 flex items-center justify-center">
                          <span className="text-[10px]">{app.providerName?.charAt(0)}</span>
                        </div>
                      )}
                      <span>{app.providerName}</span>
                    </div>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                      app.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      app.status === 'accepted' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {app.status}
                    </span>
                  </div>
                ))}
                {request.applicationDetails.length > 2 && (
                  <p className="text-xs text-slate-400">+{request.applicationDetails.length - 2} more</p>
                )}
              </div>
            </div>
          )}
          
          {/* Accepted Provider Info */}
          {request.acceptedProviderId && (
            <div className="flex items-center gap-3 mb-4 p-3 bg-green-50 rounded-lg">
              {request.acceptedProviderId.avatar ? (
                <img 
                  src={request.acceptedProviderId.avatar} 
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-green-200 flex items-center justify-center">
                  <FiUser className="text-green-600" />
                </div>
              )}
              <div className="flex-1">
                <p className="font-medium text-slate-900 text-sm">{request.acceptedProviderId.name}</p>
                <p className="text-xs text-green-600">Accepted Provider</p>
              </div>
            </div>
          )}
          
          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100">
            {canApply && (
              <button
                onClick={() => handleApply(request._id || request.id)}
                className="flex-1 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90"
              >
                Apply Now
              </button>
            )}
            {canMessage && (
              <button
                onClick={() => handleMessageProvider(request.acceptedProviderId._id || request.acceptedProviderId)}
                className="flex-1 py-2 bg-white border border-primary text-primary rounded-lg text-sm font-medium hover:bg-primary/5"
              >
                <FiMessageCircle className="inline mr-1 text-sm" /> Message Provider
              </button>
            )}
            {canComplete && (
              <button
                onClick={() => handleCompleteRequest(request._id || request.id)}
                className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
              >
                Mark as Complete
              </button>
            )}
            {canReview && (
              <button
                onClick={() => handleReviewClick(request)}
                className="flex-1 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
              >
                <FiStar className="inline mr-1 text-sm" /> Leave Review
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading && requests.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <FiLoader className="animate-spin text-4xl text-primary mx-auto mb-4" />
          <p className="text-slate-500">Loading {isProvider ? 'jobs' : 'requests'}...</p>
        </div>
      </div>
    );
  }

  const FilterPanel = () => (
    <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-900">Filters</h3>
        <button onClick={() => {
          setStatusFilter('all');
          setServiceTypeFilter('all');
          setSearchQuery('');
          setCityFilter('');
          setMinBudget('');
          setMaxBudget('');
        }} className="text-xs text-primary hover:underline">
          Clear All
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full p-2 border border-slate-200 rounded-lg text-sm"
          >
            {statusOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Service Type</label>
          <select
            value={serviceTypeFilter}
            onChange={(e) => setServiceTypeFilter(e.target.value)}
            className="w-full p-2 border border-slate-200 rounded-lg text-sm"
          >
            <option value="all">All Services</option>
            {SERVICE_TYPES.map(type => (
              <option key={type.value} value={type.value}>{type.icon} {type.label}</option>
            ))}
          </select>
        </div>
        
        {isProvider && (
          <>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">City</label>
              <input
                type="text"
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                placeholder="Filter by city..."
                className="w-full p-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>
            <div className="flex gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Min Budget</label>
                <input
                  type="number"
                  value={minBudget}
                  onChange={(e) => setMinBudget(e.target.value)}
                  placeholder="Min"
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Max Budget</label>
                <input
                  type="number"
                  value={maxBudget}
                  onChange={(e) => setMaxBudget(e.target.value)}
                  placeholder="Max"
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>
            </div>
          </>
        )}
      </div>
      
      <div className="mt-4">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title or description..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm"
          />
        </div>
      </div>
      
      <div className="flex gap-2 mt-4">
        <button onClick={fetchRequests} className="flex-1 py-2 bg-primary text-white rounded-lg text-sm font-medium">
          Apply Filters
        </button>
        <button onClick={() => setShowFilters(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm">
          Close
        </button>
      </div>
    </div>
  );

  // Mobile Layout
  if (!isDesktop) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50 pb-24">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
          <div className="flex items-center justify-between p-4">
            <h1 className="text-xl font-bold text-slate-900">
              {isProvider ? 'Available Jobs' : 'My Requests'}
            </h1>
            <div className="flex gap-2">
              <button onClick={() => setShowFilters(!showFilters)} className="p-2 relative">
                <FiFilter className="text-xl" />
                {(statusFilter !== 'all' || serviceTypeFilter !== 'all' || searchQuery) && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
                )}
              </button>
              {!isProvider && (
                <button
                  onClick={() => setShowNewRequestModal(true)}
                  className="p-2 bg-primary text-white rounded-full"
                >
                  <FiPlus className="text-xl" />
                </button>
              )}
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="px-4 pb-3">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${isProvider ? 'jobs' : 'requests'}...`}
                className="w-full h-10 pl-10 pr-4 rounded-lg bg-slate-100 text-sm"
              />
            </div>
          </div>
        </header>
        
        {/* Filters */}
        {showFilters && <FilterPanel />}
        
        {/* Results */}
        <main className="flex-1 p-4">
          {filteredRequests.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <FiInbox className="text-3xl text-slate-300" />
              </div>
              <p className="text-slate-500 font-medium">
                {isProvider ? 'No available jobs' : 'No requests yet'}
              </p>
              <p className="text-slate-400 text-sm mt-1">
                {isProvider 
                  ? 'Check back later for new opportunities' 
                  : 'Create your first request to find a provider'}
              </p>
              {!isProvider && (
                <button
                  onClick={() => setShowNewRequestModal(true)}
                  className="mt-4 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium"
                >
                  + New Request
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedRequests.map(request => (
                <RequestCard key={request._id || request.id} request={request} />
              ))}
            </div>
          )}
          
          {/* Pagination */}
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
        
        <NewRequestModal
          isOpen={showNewRequestModal}
          onClose={() => setShowNewRequestModal(false)}
          onSuccess={handleRequestSuccess}
        />
        
        {showRatingModal && selectedProvider && (
          <RatingModal
            isOpen={showRatingModal}
            onClose={() => {
              setShowRatingModal(false);
              setSelectedProvider(null);
              setSelectedRequest(null);
            }}
            provider={selectedProvider}
            booking={selectedRequest}
            onReviewSubmitted={() => {
              fetchRequests();
              setShowRatingModal(false);
            }}
          />
        )}
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            {isProvider ? 'Available Jobs' : 'My Service Requests'}
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            {isProvider 
              ? 'Browse and apply for service requests from clients'
              : 'Track and manage your service requests'}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              showFilters ? 'bg-primary text-white' : 'bg-white border border-slate-200 text-slate-600'
            }`}
          >
            <FiFilter /> Filters
          </button>
          <button onClick={fetchRequests} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
            <FiRefreshCw className={`text-lg ${loading ? 'animate-spin' : ''}`} />
          </button>
          {!isProvider && (
            <button
              onClick={() => setShowNewRequestModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium"
            >
              <FiPlus /> New Request
            </button>
          )}
        </div>
      </div>
      
      {/* Filters Panel */}
      {showFilters && <FilterPanel />}
      
      {/* Results Count */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-slate-500">
          Showing {paginatedRequests.length} of {filteredRequests.length} {isProvider ? 'jobs' : 'requests'}
        </p>
      </div>
      
      {/* Results Grid */}
      {filteredRequests.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <FiInbox className="text-4xl text-slate-300" />
          </div>
          <p className="text-slate-500 text-lg font-medium">
            {isProvider ? 'No available jobs' : 'No requests yet'}
          </p>
          <p className="text-slate-400 text-sm mt-2">
            {isProvider 
              ? 'Check back later for new job opportunities' 
              : 'Create your first request to find a service provider'}
          </p>
          {!isProvider && (
            <button
              onClick={() => setShowNewRequestModal(true)}
              className="mt-6 px-6 py-3 bg-primary text-white rounded-lg text-sm font-medium"
            >
              + New Request
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
            {paginatedRequests.map(request => (
              <RequestCard key={request._id || request.id} request={request} />
            ))}
          </div>
          
          {/* Pagination */}
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
                    className={`w-10 h-10 rounded-lg font-medium transition-colors ${
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
      
      <NewRequestModal
        isOpen={showNewRequestModal}
        onClose={() => setShowNewRequestModal(false)}
        onSuccess={handleRequestSuccess}
      />
      
      {showRatingModal && selectedProvider && (
        <RatingModal
          isOpen={showRatingModal}
          onClose={() => {
            setShowRatingModal(false);
            setSelectedProvider(null);
            setSelectedRequest(null);
          }}
          provider={selectedProvider}
          booking={selectedRequest}
          onReviewSubmitted={() => {
            fetchRequests();
            setShowRatingModal(false);
          }}
        />
      )}
    </div>
  );
}