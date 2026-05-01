import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import RatingModal from './RatingModal';

const MyRequestsScreen = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedProviderForRating, setSelectedProviderForRating] = useState(null);
  const [selectedRequestForRating, setSelectedRequestForRating] = useState(null);

  const { showToast } = useToast();
  const navigate = useNavigate();

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : {};
  const isProvider = user?.role === 'provider';

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const result = await api.getClientServiceRequests();
      if (Array.isArray(result)) {
        setRequests(result);
      } else if (result.success && Array.isArray(result.data)) {
        setRequests(result.data);
      } else {
        setRequests([]);
      }
    } catch (error) {
      showToast('Failed to load requests', 'error');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleCompleteRequest = async (requestId, providerId) => {
    if (!confirm('Mark this request as completed? The provider will be notified and you can leave a review.')) return;
    try {
      const result = await api.completeServiceRequest(requestId);
      if (result.success) {
        showToast('Request marked as completed!', 'success');
        fetchRequests();
        setTimeout(() => {
          if (providerId && confirm('Would you like to leave a review for the provider?')) {
            handleOpenRatingModal(requestId, providerId);
          }
        }, 500);
      } else {
        showToast(result.error || 'Failed to complete', 'error');
      }
    } catch (error) {
      showToast('Failed to complete request', 'error');
    }
  };

  const handleOpenRatingModal = async (requestId, providerId) => {
    try {
      const request = requests.find(r => (r._id || r.id) === requestId);
      if (request) {
        setSelectedRequestForRating(request);
        setSelectedProviderForRating(providerId);
        setShowRatingModal(true);
      }
    } catch (err) {
      showToast('Could not load rating information', 'error');
    }
  };

  const handleAcceptApplication = async (requestId, applicationId, providerId) => {
    if (!confirm('Accept this application? Other applicants will be notified they were not selected.')) return;
    try {
      const result = await api.updateApplicationStatus(requestId, applicationId, 'accepted');
      if (result.success) {
        showToast('Application accepted! The provider has been notified.', 'success');
        fetchRequests();
      } else {
        showToast(result.error || 'Failed to accept application', 'error');
      }
    } catch (err) {
      showToast('Failed to accept application', 'error');
    }
  };

  const handleRejectApplication = async (requestId, applicationId) => {
    try {
      const result = await api.updateApplicationStatus(requestId, applicationId, 'rejected');
      if (result.success) {
        showToast('Application rejected', 'info');
        fetchRequests();
      } else {
        showToast(result.error || 'Failed to reject application', 'error');
      }
    } catch (err) {
      showToast('Failed to reject application', 'error');
    }
  };

  if (loading) {
    return <div className="p-4 text-center text-slate-500">Loading...</div>;
  }

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-slate-800 dark:text-slate-100">My Requests</h1>
      {requests.length === 0 ? (
        <p className="text-center text-slate-500 py-8">No requests found.</p>
      ) : (
        <div className="space-y-4">
          {requests.map(request => (
            <div key={request._id || request.id} className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow">
              <h2 className="font-semibold text-slate-800 dark:text-slate-100">{request.title}</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{request.description}</p>
              <div className="mt-2 flex gap-2 items-center">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  request.status === 'open' ? 'bg-green-100 text-green-700' :
                  request.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                  request.status === 'completed' ? 'bg-slate-100 text-slate-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {request.status}
                </span>
                {request.budget && <span className="text-xs text-slate-500">{request.budget} MAD</span>}
              </div>

              {!isProvider && request.status === 'open' && request.applications?.length > 0 && (
                <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                    {request.applications.length} application(s)
                  </p>
                  <div className="space-y-3">
                    {request.applications.map((app, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-white dark:bg-slate-600 rounded-lg">
                        <div className="flex items-center gap-2">
                          {app.providerAvatar ? (
                            <img src={app.providerAvatar} className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center">
                              <span className="text-xs font-bold">{app.providerName?.charAt(0)}</span>
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{app.providerName}</p>
                            {app.proposedPrice && (
                              <p className="text-xs text-green-600">Proposed: {app.proposedPrice} MAD</p>
                            )}
                            {app.message && (
                              <p className="text-xs text-slate-500 mt-0.5 max-w-[200px] truncate">"{app.message}"</p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {app.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleAcceptApplication(request._id || request.id, app._id || app.id, app.providerId)}
                                className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => handleRejectApplication(request._id || request.id, app._id || app.id)}
                                className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {app.status === 'accepted' && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">✓ Accepted</span>
                          )}
                          {app.status === 'rejected' && (
                            <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">✗ Rejected</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {request.status === 'in_progress' && (
                <button
                  onClick={() => handleCompleteRequest(request._id || request.id, request.acceptedProviderId)}
                  className="mt-3 px-3 py-1.5 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                >
                  Mark as Completed
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {showRatingModal && selectedProviderForRating && selectedRequestForRating && (
        <RatingModal
          isOpen={showRatingModal}
          onClose={() => {
            setShowRatingModal(false);
            setSelectedProviderForRating(null);
            setSelectedRequestForRating(null);
            fetchRequests();
          }}
          provider={{ id: selectedProviderForRating }}
          serviceRequest={selectedRequestForRating}
          onReviewSubmitted={() => {
            showToast('Review submitted! Thank you for your feedback.', 'success');
            setShowRatingModal(false);
            fetchRequests();
          }}
        />
      )}
    </div>
  );
};

export default MyRequestsScreen;
