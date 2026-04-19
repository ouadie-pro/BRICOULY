import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { FiInbox, FiPlus, FiClock, FiCheckCircle, FiXCircle, FiTool, FiFileText, FiX, FiMapPin, FiCalendar, FiDollarSign, FiAlertCircle } from 'react-icons/fi';
import RatingModal from './RatingModal';

const SERVICE_TYPES = [
  { value: 'plumber', label: 'Plumber' },
  { value: 'electrician', label: 'Electrician' },
  { value: 'painter', label: 'Painter' },
  { value: 'carpenter', label: 'Carpenter' },
  { value: 'cleaner', label: 'Home Cleaner' },
  { value: 'mover', label: 'Mover' },
  { value: 'hvac', label: 'HVAC Technician' },
  { value: 'landscaper', label: 'Landscaper' },
  { value: 'roofer', label: 'Roofer' },
  { value: 'appliance_repair', label: 'Appliance Repair' },
  { value: 'general', label: 'General' },
];

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h3 className="text-xl font-bold text-slate-900">New Service Request</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <FiX className="text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <FiAlertCircle />
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
                  {type.label}
                </option>
              ))}
            </select>
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
              placeholder="e.g., Fix kitchen sink leak"
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
              placeholder="Describe the problem or service needed..."
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
            />
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
              placeholder="Your address or area"
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
              placeholder="Max budget"
              min="0"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
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
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function MyRequestsScreen({ isDesktop }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);
  const [canReviewMap, setCanReviewMap] = useState({});
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const navigate = useNavigate();
  
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isProvider = currentUser.role === 'provider';

  const checkCanReviewForProvider = async (providerId, requestId) => {
    try {
      const result = await api.checkCanReview(providerId);
      setCanReviewMap(prev => ({
        ...prev,
        [requestId]: result
      }));
    } catch (error) {
      console.error('Error checking can review:', error);
    }
  };

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      let result;
      
      if (currentUser.role === 'provider') {
        // For providers: fetch available jobs they can apply to
        result = await api.getProviderServiceRequests();
      } else {
        // For clients: fetch their own service requests
        result = await api.getClientServiceRequests();
      }
      
      const requestsData = result?.requests || result || [];
      setRequests(requestsData);
      
      // Check can review for completed requests (only for clients)
      if (currentUser.role === 'client') {
        requestsData.forEach(request => {
          if (request.status === 'completed' && request.acceptedProviderId) {
            checkCanReviewForProvider(
              request.acceptedProviderId._id || request.acceptedProviderId, 
              request._id || request.id
            );
          }
        });
      }
      
    } catch (error) {
      console.error('Error fetching requests:', error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleRequestSuccess = () => {
    fetchRequests();
  };

  const handleApply = async (requestId) => {
    try {
      const result = await api.applyForServiceRequest(requestId);
      if (result.success) {
        fetchRequests(); // Refresh the list
      } else {
        alert(result.error || 'Failed to apply for this request');
      }
    } catch (error) {
      console.error('Error applying for request:', error);
      alert('Failed to apply for this request');
    }
  };

  const handleReviewClick = async (request) => {
    const requestId = request._id || request.id;
    const canReviewData = canReviewMap[requestId];
    
    if (canReviewData?.canReview) {
      setSelectedProvider(request.acceptedProviderId);
      setSelectedRequest(request);
      setShowRatingModal(true);
    } else {
      alert(canReviewData?.reason || 'You cannot review this provider.');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-yellow-100 text-yellow-700';
      case 'in_progress': return 'bg-blue-100 text-blue-700';
      case 'completed': return 'bg-purple-100 text-purple-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open': return FiClock;
      case 'in_progress': return FiTool;
      case 'completed': return FiCheckCircle;
      default: return FiClock;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'open': return 'Open';
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed';
      default: return status;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getServiceTypeLabel = (type) => {
    const found = SERVICE_TYPES.find(t => t.value === type);
    return found ? found.label : type;
  };

  if (!isDesktop) {
    return (
      <div className="p-4 pb-24 max-w-md mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-900">
            {isProvider ? 'Available Jobs' : 'My Service Requests'}
          </h1>
          {!isProvider && (
            <button 
              onClick={() => setShowNewRequestModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-sm font-medium"
            >
              <FiPlus style={{ fontSize: '16px' }} />
              New Request
            </button>
          )}
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto">
              <FiInbox style={{ fontSize: '32px' }} className="text-slate-300" />
            </div>
            <p className="text-slate-500 mt-3 font-medium">
              {isProvider ? 'No available jobs yet' : 'No service requests yet'}
            </p>
            <p className="text-slate-400 text-sm mt-1">
              {isProvider ? 'Check back later for new job opportunities' : 'Create a new request to find a provider'}
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
          <div className="space-y-3">
            {requests.map((request) => {
              const StatusIcon = getStatusIcon(request.status);
              return (
                <div key={request.id} className="bg-white rounded-xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="text-xs text-primary font-medium">{getServiceTypeLabel(request.serviceType)}</span>
                      <h3 className="font-semibold text-slate-900">{request.title}</h3>
                      <p className="text-sm text-slate-500 line-clamp-2">{request.description}</p>
                    </div>
                    <span className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getStatusColor(request.status)}`}>
                      <StatusIcon style={{ fontSize: '12px' }} />
                      {getStatusLabel(request.status)}
                    </span>
                  </div>
                  {(request.preferredDate || request.location || request.budget) && (
                    <div className="flex flex-wrap gap-2 mt-2 text-xs text-slate-500">
                      {request.preferredDate && (
                        <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded">
                          <FiCalendar style={{ fontSize: '12px' }} />
                          {formatDate(request.preferredDate)}
                        </span>
                      )}
                      {request.location && (
                        <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded">
                          <FiMapPin style={{ fontSize: '12px' }} />
                          {request.location}
                        </span>
                      )}
                      {request.budget && (
                        <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded">
                          <FiDollarSign style={{ fontSize: '12px' }} />
                          {request.budget} MAD
                        </span>
                      )}
                    </div>
                  )}
                  {request.acceptedProviderId && (
                    <div className="flex items-center gap-2 mt-3">
                      <div className="w-8 h-8 rounded-full bg-cover bg-center bg-slate-200" style={{ backgroundImage: request.acceptedProviderId?.avatar ? `url("${request.acceptedProviderId.avatar}")` : undefined }} />
                      <span className="text-sm text-slate-600">{request.acceptedProviderId?.name || 'Provider'}</span>
                    </div>
                  )}
                  {request.applicationDetails && request.applicationDetails.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <p className="text-xs text-slate-500 mb-2">{request.applicationDetails.length} application(s)</p>
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-slate-400">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                    <div className="flex gap-2">
                      {isProvider && request.status === 'pending' && (
                        <button 
                          onClick={() => handleApply(request._id || request.id)}
                          className="text-xs bg-primary text-white px-3 py-1 rounded-lg font-medium hover:bg-primary/90"
                        >
                          Apply
                        </button>
                      )}
                      {!isProvider && request.status === 'completed' && request.acceptedProviderId && (
                        <button 
                          onClick={() => handleReviewClick(request)}
                          className="text-xs text-primary font-medium hover:underline"
                        >
                          Rate Provider
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
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
              setSelectedProvider(null);
              setSelectedRequest(null);
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">
          {isProvider ? 'Available Jobs' : 'My Service Requests'}
        </h2>
        {!isProvider && (
          <button 
            onClick={() => setShowNewRequestModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium"
          >
            <FiPlus />
            New Request
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto">
            <FiInbox style={{ fontSize: '40px' }} className="text-slate-300" />
          </div>
          <p className="text-slate-500 mt-4 text-lg font-medium">
            {isProvider ? 'No available jobs yet' : 'No service requests yet'}
          </p>
          <p className="text-slate-400 text-sm mt-2">
            {isProvider ? 'Check back later for new job opportunities' : 'Create a new request to find a service provider.'}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {requests.map((request) => {
            const StatusIcon = getStatusIcon(request.status);
            return (
              <div key={request.id} className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="text-xs text-primary font-medium">{getServiceTypeLabel(request.serviceType)}</span>
                    <h3 className="font-semibold text-slate-900">{request.title}</h3>
                  </div>
                  <span className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getStatusColor(request.status)}`}>
                    <StatusIcon style={{ fontSize: '12px' }} />
                    {getStatusLabel(request.status)}
                  </span>
                </div>
                <p className="text-slate-500 text-sm mb-3 line-clamp-2">{request.description}</p>
                
                {(request.preferredDate || request.preferredTime || request.location || request.budget) && (
                  <div className="flex flex-wrap gap-2 mb-3 text-xs">
                    {request.preferredDate && (
                      <span className="flex items-center gap-1 bg-slate-50 text-slate-600 px-2 py-1 rounded">
                        <FiCalendar style={{ fontSize: '12px' }} />
                        {formatDate(request.preferredDate)}
                        {request.preferredTime && request.preferredTime !== 'anytime' && ` • ${request.preferredTime}`}
                      </span>
                    )}
                    {request.location && (
                      <span className="flex items-center gap-1 bg-slate-50 text-slate-600 px-2 py-1 rounded">
                        <FiMapPin style={{ fontSize: '12px' }} />
                        {request.location}
                      </span>
                    )}
                    {request.budget && (
                      <span className="flex items-center gap-1 bg-slate-50 text-slate-600 px-2 py-1 rounded">
                        <FiDollarSign style={{ fontSize: '12px' }} />
                        {request.budget} MAD
                      </span>
                    )}
                  </div>
                )}
                
                {request.applicationDetails && request.applicationDetails.length > 0 && (
                  <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                    <div className="w-10 h-10 rounded-full bg-cover bg-center bg-slate-200" style={{ backgroundImage: request.applicationDetails[0]?.providerAvatar ? `url("${request.applicationDetails[0].providerAvatar}")` : undefined }} />
                    <div>
                      <p className="font-medium text-slate-900 text-sm">{request.applicationDetails[0]?.providerName}</p>
                      <p className="text-xs text-slate-500">{request.applicationDetails.length} application(s)</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-between mt-4">
                  <span className="text-xs text-slate-400">
                    {new Date(request.createdAt).toLocaleDateString()}
                  </span>
                  <div className="flex gap-2">
                    {isProvider && request.status === 'pending' && (
                      <button 
                        onClick={() => handleApply(request._id || request.id)}
                        className="text-xs bg-primary text-white px-3 py-1 rounded-lg font-medium hover:bg-primary/90"
                      >
                        Apply
                      </button>
                    )}
                    {!isProvider && request.acceptedProviderId && request.status !== 'completed' && (
                      <button 
                        onClick={() => navigate(`/messages/${request.acceptedProviderId._id || request.acceptedProviderId}`)}
                        className="text-primary text-sm font-medium hover:underline"
                      >
                        Message
                      </button>
                    )}
                  </div>
                </div>
                {request.status === 'completed' && request.acceptedProviderId && !isProvider && (
                  <button 
                    onClick={() => handleReviewClick(request)}
                    className="w-full mt-3 py-2 text-sm text-primary font-medium hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    Rate Provider
                  </button>
                )}
              </div>
            );
          })}
        </div>
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
            setSelectedProvider(null);
            setSelectedRequest(null);
          }}
        />
      )}
    </div>
  );
}
