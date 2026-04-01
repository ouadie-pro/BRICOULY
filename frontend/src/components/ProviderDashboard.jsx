import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { FiEdit, FiPlus, FiTrash2 } from 'react-icons/fi';

export default function ProviderDashboard({ isDesktop }) {
  const [user, setUser] = useState(null);
  const [services, setServices] = useState([]);
  const [requests, setRequests] = useState([]);
  const [showAddService, setShowAddService] = useState(false);
  const [newService, setNewService] = useState({ name: '', description: '', price: '', category: 'other' });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadData = async (userId) => {
    if (!userId) return;
    setLoading(true);
    try {
      const [servicesData, requestsData] = await Promise.all([
        api.getProviderServices(userId),
        api.getServiceRequests(),
      ]);
      setServices(servicesData || []);
      setRequests(requestsData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      setServices([]);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(storedUser);
    
    if (storedUser.role === 'provider' && storedUser.id) {
      loadData(storedUser.id);
    } else {
      setLoading(false);
    }
  }, []);

  const handleAddService = async (e) => {
    e.preventDefault();
    const res = await api.addService(newService);
    if (res.success) {
      setServices([...services, res.service]);
      setShowAddService(false);
      setNewService({ name: '', description: '', price: '', category: 'other' });
    }
  };

  const handleDeleteService = async (serviceId) => {
    const res = await api.deleteService(serviceId);
    if (res.success) {
      setServices(services.filter(s => s.id !== serviceId));
    }
  };

  const handleUpdateRequest = async (requestId, status) => {
    await api.updateServiceRequest(requestId, status);
    loadData(user.id);
  };

  if (!user || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isDesktop) {
    return (
      <div className="p-4 pb-24 max-w-md mx-auto">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Provider Dashboard</h2>
        
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4">
          <h3 className="font-semibold text-slate-900 mb-3">My Services</h3>
          {services.length === 0 ? (
            <p className="text-slate-500 text-sm">No services added yet.</p>
          ) : (
            <div className="space-y-2">
              {services.map((service, index) => (
                <div key={service._id || service.id || `service-${index}`} className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900">{service.name}</p>
                    <p className="text-sm text-slate-500">${service.price}</p>
                  </div>
                  <button 
                    onClick={() => handleDeleteService(service.id)}
                    className="text-red-500 text-sm"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
          <button 
            onClick={() => setShowAddService(!showAddService)}
            className="mt-3 w-full py-2 bg-primary text-white rounded-lg text-sm font-medium"
          >
            {showAddService ? 'Cancel' : 'Add Service'}
          </button>
          
          {showAddService && (
            <form onSubmit={handleAddService} className="mt-3 space-y-2">
              <input
                type="text"
                placeholder="Service name"
                value={newService.name}
                onChange={(e) => setNewService({...newService, name: e.target.value})}
                className="w-full p-2 border rounded-lg text-sm"
                required
              />
              <textarea
                placeholder="Description"
                value={newService.description}
                onChange={(e) => setNewService({...newService, description: e.target.value})}
                className="w-full p-2 border rounded-lg text-sm"
              />
              <input
                type="number"
                placeholder="Price ($)"
                value={newService.price}
                onChange={(e) => setNewService({...newService, price: e.target.value})}
                className="w-full p-2 border rounded-lg text-sm"
                required
              />
              <button type="submit" className="w-full py-2 bg-green-600 text-white rounded-lg text-sm font-medium">
                Save Service
              </button>
            </form>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="font-semibold text-slate-900 mb-3">Service Requests</h3>
          {requests.length === 0 ? (
            <p className="text-slate-500 text-sm">No requests yet.</p>
          ) : (
            <div className="space-y-2">
              {requests.map((request, index) => (
                <div key={request._id || request.id || `request-${index}`} className="p-2 bg-slate-50 rounded-lg">
                  <p className="font-medium text-slate-900">{request.serviceName}</p>
                  <p className="text-sm text-slate-500">{request.description}</p>
                  <div className="flex gap-2 mt-2">
                    <button 
                      onClick={() => handleUpdateRequest(request.id, 'accepted')}
                      className="px-3 py-1 bg-green-600 text-white rounded text-xs"
                    >
                      Accept
                    </button>
                    <button 
                      onClick={() => handleUpdateRequest(request.id, 'rejected')}
                      className="px-3 py-1 bg-red-600 text-white rounded text-xs"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Provider Dashboard</h2>
        <button
          onClick={() => navigate('/provider/edit')}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium"
        >
          <FiEdit />
          Edit Profile
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">My Services</h3>
            <button 
              onClick={() => setShowAddService(!showAddService)}
              className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-lg text-sm font-medium"
            >
              <FiPlus className="text-[18px]" />
              Add
            </button>
          </div>
          
          {services.length === 0 ? (
            <p className="text-slate-500 text-sm py-4">No services added yet. Add your first service!</p>
          ) : (
            <div className="space-y-3">
              {services.map((service, index) => (
                <div key={service._id || service.id || `service-${index}`} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{service.name}</p>
                    <p className="text-sm text-slate-500">{service.description}</p>
                    <p className="text-primary font-semibold mt-1">${service.price}</p>
                  </div>
                  <button 
                    onClick={() => handleDeleteService(service.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <FiTrash2 className="text-[20px]" />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {showAddService && (
            <form onSubmit={handleAddService} className="mt-4 p-4 bg-slate-50 rounded-lg space-y-3">
              <input
                type="text"
                placeholder="Service name"
                value={newService.name}
                onChange={(e) => setNewService({...newService, name: e.target.value})}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm"
                required
              />
              <textarea
                placeholder="Description"
                value={newService.description}
                onChange={(e) => setNewService({...newService, description: e.target.value})}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm resize-none"
                rows={2}
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Price ($)"
                  value={newService.price}
                  onChange={(e) => setNewService({...newService, price: e.target.value})}
                  className="flex-1 p-2.5 border border-slate-200 rounded-lg text-sm"
                  required
                />
                <select
                  value={newService.category}
                  onChange={(e) => setNewService({...newService, category: e.target.value})}
                  className="p-2.5 border border-slate-200 rounded-lg text-sm"
                >
                  <option value="plumbing">Plumbing</option>
                  <option value="electrical">Electrical</option>
                  <option value="cleaning">Cleaning</option>
                  <option value="painting">Painting</option>
                  <option value="carpentry">Carpentry</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button 
                  type="button" 
                  onClick={() => setShowAddService(false)}
                  className="flex-1 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-medium">
                  Save Service
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Service Requests</h3>
          
          {requests.length === 0 ? (
            <p className="text-slate-500 text-sm py-4">No service requests yet.</p>
          ) : (
            <div className="space-y-3">
              {requests.map((request, index) => (
                <div key={request._id || request.id || `request-${index}`} className="p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-slate-900">{request.serviceName}</p>
                      <p className="text-sm text-slate-500">{request.description}</p>
                      <p className="text-xs text-slate-400 mt-1">From: {request.otherUserName}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      request.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      request.status === 'accepted' ? 'bg-green-100 text-green-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {request.status}
                    </span>
                  </div>
                  {request.status === 'pending' && (
                    <div className="flex gap-2 mt-3">
                      <button 
                        onClick={() => handleUpdateRequest(request.id, 'accepted')}
                        className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium"
                      >
                        Accept
                      </button>
                      <button 
                        onClick={() => handleUpdateRequest(request.id, 'rejected')}
                        className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
