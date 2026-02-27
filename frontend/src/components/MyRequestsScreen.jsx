import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

export default function MyRequestsScreen({ isDesktop }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRequests = async () => {
      const data = await api.getServiceRequests();
      setRequests(data);
      setLoading(false);
    };
    fetchRequests();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'accepted': return 'bg-green-100 text-green-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      case 'completed': return 'bg-blue-100 text-blue-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  if (!isDesktop) {
    return (
      <div className="p-4 pb-24 max-w-md mx-auto">
        <h2 className="text-xl font-bold text-slate-900 mb-4">My Service Requests</h2>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-8">
            <span className="material-symbols-outlined text-4xl text-slate-300">inbox</span>
            <p className="text-slate-500 mt-2">No service requests yet.</p>
            <button 
              onClick={() => navigate('/search')}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium"
            >
              Find Services
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((request) => (
              <div key={request.id} className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-slate-900">{request.serviceName}</h3>
                    <p className="text-sm text-slate-500">{request.description}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(request.status)}`}>
                    {request.status}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <div className="w-8 h-8 rounded-full bg-cover bg-center" style={{ backgroundImage: `url("${request.otherUserAvatar}")` }} />
                  <span className="text-sm text-slate-600">{request.otherUserName}</span>
                  {request.otherUserProfession && (
                    <span className="text-xs text-slate-400">• {request.otherUserProfession}</span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  {new Date(request.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">My Service Requests</h2>
        <button 
          onClick={() => navigate('/search')}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium"
        >
          <span className="material-symbols-outlined">search</span>
          Find Services
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <span className="material-symbols-outlined text-6xl text-slate-200">inbox</span>
          <p className="text-slate-500 mt-4 text-lg">No service requests yet.</p>
          <p className="text-slate-400 text-sm mt-1">Find a service provider and request their services.</p>
          <button 
            onClick={() => navigate('/search')}
            className="mt-6 px-6 py-3 bg-primary text-white rounded-lg text-sm font-medium"
          >
            Browse Services
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {requests.map((request) => (
            <div key={request.id} className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-slate-900">{request.serviceName}</h3>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(request.status)}`}>
                  {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                </span>
              </div>
              <p className="text-slate-500 text-sm mb-4">{request.description}</p>
              <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                <div className="w-10 h-10 rounded-full bg-cover bg-center" style={{ backgroundImage: `url("${request.otherUserAvatar}")` }} />
                <div>
                  <p className="font-medium text-slate-900 text-sm">{request.otherUserName}</p>
                  <p className="text-xs text-slate-500">{request.otherUserProfession}</p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4">
                <span className="text-xs text-slate-400">
                  {new Date(request.createdAt).toLocaleDateString()}
                </span>
                <button 
                  onClick={() => navigate(`/messages/${request.providerId}`)}
                  className="text-primary text-sm font-medium hover:underline"
                >
                  Message
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
