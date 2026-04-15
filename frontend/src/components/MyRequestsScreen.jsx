import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { FiInbox, FiPlus, FiClock, FiCheckCircle, FiXCircle, FiTool, FiFileText, FiX, FiMapPin, FiCalendar, FiDollarSign, FiAlertCircle } from 'react-icons/fi';

const SERVICE_TYPES = [
  { value: 'Plumber', label: 'Plumber' },
  { value: 'Electrician', label: 'Electrician' },
  { value: 'Painter', label: 'Painter' },
  { value: 'Carpenter', label: 'Carpenter' },
  { value: 'Home Cleaner', label: 'Home Cleaner' },
  { value: 'Mover', label: 'Mover' },
  { value: 'HVAC Technician', label: 'HVAC Technician' },
  { value: 'Landscaper', label: 'Landscaper' },
  { value: 'Roofer', label: 'Roofer' },
  { value: 'Appliance Repair', label: 'Appliance Repair' },
];

function NewRequestModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    serviceName: '',
    title: '',
    description: '',
    preferredDate: '',
    preferredTime: '',
    location: '',
    budget: '',
    urgency: 'normal',
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

    if (!formData.serviceName) {
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
        serviceName: formData.title,
        description: formData.description,
        preferredDate: formData.preferredDate || null,
        preferredTime: formData.preferredTime,
        location: formData.location,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        urgency: formData.urgency,
      };

      const result = await api.createServiceRequest(requestData);

      if (result.success) {
        onSuccess();
        onClose();
        setFormData({
          serviceName: '',
          title: '',
          description: '',
          preferredDate: '',
          preferredTime: '',
          location: '',
          budget: '',
          urgency: 'normal',
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
              name="serviceName"
              value={formData.serviceName}
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
                <option value="">Any time</option>
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

          <div className="grid grid-cols-2 gap-4">
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

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Urgency
              </label>
              <div className="flex gap-3 mt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="urgency"
                    value="normal"
                    checked={formData.urgency === 'normal'}
                    onChange={handleChange}
                    className="w-4 h-4 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-slate-600">Normal</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="urgency"
                    value="urgent"
                    checked={formData.urgency === 'urgent'}
                    onChange={handleChange}
                    className="w-4 h-4 text-red-500 focus:ring-red-500"
                  />
                  <span className="text-sm text-red-600">Urgent</span>
                </label>
              </div>
            </div>
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
  const navigate = useNavigate();

  const fetchRequests = async () => {
    const data = await api.getServiceRequests();
    setRequests(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleRequestSuccess = () => {
    fetchRequests();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'accepted': return 'bg-green-100 text-green-700';
      case 'in_progress': return 'bg-blue-100 text-blue-700';
      case 'completed': return 'bg-purple-100 text-purple-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      case 'cancelled': return 'bg-slate-100 text-slate-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return FiClock;
      case 'accepted': return FiCheckCircle;
      case 'in_progress': return FiTool;
      case 'completed': return FiFileText;
      case 'rejected': return FiXCircle;
      default: return FiClock;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'accepted': return 'Accepted';
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed';
      case 'rejected': return 'Rejected';
      case 'cancelled': return 'Cancelled';
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

  if (!isDesktop) {
    return (
      <div className="p-4 pb-24 max-w-md mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900">My Service Requests</h2>
          <button 
            onClick={() => setShowNewRequestModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-sm font-medium"
          >
            <FiPlus style={{ fontSize: '16px' }} />
            New Request
          </button>
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
            <p className="text-slate-500 mt-3 font-medium">No service requests yet</p>
            <p className="text-slate-400 text-sm mt-1">Create a new request to find a provider</p>
            <button 
              onClick={() => setShowNewRequestModal(true)}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium"
            >
              + New Request
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((request) => {
              const StatusIcon = getStatusIcon(request.status);
              return (
                <div key={request.id} className="bg-white rounded-xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-slate-900">{request.serviceName}</h3>
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
                  {request.otherUserName && request.otherUserName !== 'Unknown' && (
                    <div className="flex items-center gap-2 mt-3">
                      <div className="w-8 h-8 rounded-full bg-cover bg-center bg-slate-200" style={{ backgroundImage: request.otherUserAvatar ? `url("${request.otherUserAvatar}")` : undefined }} />
                      <span className="text-sm text-slate-600">{request.otherUserName}</span>
                      {request.otherUserProfession && (
                        <span className="text-xs text-slate-400">• {request.otherUserProfession}</span>
                      )}
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-slate-400">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                    {request.status === 'completed' && (
                      <span className="text-xs text-primary font-medium">Leave a review</span>
                    )}
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
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">My Service Requests</h2>
        <button 
          onClick={() => setShowNewRequestModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium"
        >
          <FiPlus />
          New Request
        </button>
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
          <p className="text-slate-500 mt-4 text-lg font-medium">No service requests yet</p>
          <p className="text-slate-400 text-sm mt-2">Create a new request to find a service provider.</p>
          <button 
            onClick={() => setShowNewRequestModal(true)}
            className="mt-6 px-6 py-3 bg-primary text-white rounded-lg text-sm font-medium"
          >
            + New Request
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {requests.map((request) => {
            const StatusIcon = getStatusIcon(request.status);
            return (
              <div key={request.id} className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-slate-900">{request.serviceName}</h3>
                    <p className="text-xs text-primary mt-0.5">{request.urgency === 'urgent' ? 'Urgent' : 'Normal'}</p>
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
                        {request.preferredTime && ` • ${request.preferredTime}`}
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
                
                <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                  {request.otherUserName && request.otherUserName !== 'Unknown' ? (
                    <>
                      <div className="w-10 h-10 rounded-full bg-cover bg-center bg-slate-200" style={{ backgroundImage: request.otherUserAvatar ? `url("${request.otherUserAvatar}")` : undefined }} />
                      <div>
                        <p className="font-medium text-slate-900 text-sm">{request.otherUserName}</p>
                        <p className="text-xs text-slate-500">{request.otherUserProfession}</p>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-slate-400 italic">Waiting for provider response</p>
                  )}
                </div>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-xs text-slate-400">
                    {new Date(request.createdAt).toLocaleDateString()}
                  </span>
                  {request.providerId && request.status !== 'completed' && (
                    <button 
                      onClick={() => navigate(`/messages/${request.providerId}`)}
                      className="text-primary text-sm font-medium hover:underline"
                    >
                      Message
                    </button>
                  )}
                </div>
                {request.status === 'completed' && (
                  <button className="w-full mt-3 py-2 text-sm text-primary font-medium hover:bg-blue-50 rounded-lg transition-colors">
                    Leave a Review
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
    </div>
  );
}
