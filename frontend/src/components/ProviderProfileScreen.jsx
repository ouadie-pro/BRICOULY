import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { 
  FiArrowLeft, FiStar, FiMapPin, FiClock, FiTool, FiMessageCircle, 
  FiCalendar, FiCheckCircle, FiAward, FiUsers, FiBriefcase,
  FiMail, FiPhone, FiGlobe, FiThumbsUp, FiShare2, FiBookmark,
  FiCheck, FiX, FiEdit2, FiPlus, FiTrash2, FiLoader
} from 'react-icons/fi';

const StarRating = ({ rating, count, size = 'md' }) => {
  const fullStars = Math.floor(rating || 0);
  const hasHalfStar = (rating || 0) - fullStars >= 0.5;
  const starSize = size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-2xl' : 'text-base';
  
  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <FiStar
            key={star}
            className={`${starSize} ${star <= fullStars ? 'text-yellow-400 fill-yellow-400' : 
              star === fullStars + 1 && hasHalfStar ? 'text-yellow-400' : 'text-gray-300'}`}
          />
        ))}
      </div>
      {rating > 0 && (
        <span className="text-sm font-medium text-gray-700">{rating.toFixed(1)}</span>
      )}
      {count > 0 && (
        <span className="text-sm text-gray-500">({count} reviews)</span>
      )}
    </div>
  );
};

const formatPhone = (phone) => {
  if (!phone) return 'Not provided';
  if (phone.startsWith('+')) return phone;
  if (phone.startsWith('0')) return `+212 ${phone.slice(1)}`;
  return phone;
};

export default function ProviderProfileScreen({ isDesktop }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isProviderOwner = currentUser.role === 'provider' && String(currentUser.id) === String(id);
  
  const [provider, setProvider] = useState(null);
  const [services, setServices] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddService, setShowAddService] = useState(false);
  const [newService, setNewService] = useState({ name: '', description: '', price: '' });
  const [editingService, setEditingService] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchProviderData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log('[ProviderProfile] Fetching provider with ID:', id);
        
        // Fetch provider details
        const providerData = await api.getProvider(id);
        console.log('[ProviderProfile] Provider data:', providerData);
        
        if (!providerData || providerData.error) {
          setError(providerData?.error || 'Provider not found');
          setLoading(false);
          return;
        }
        
        setProvider(providerData);
        
        // Fetch services
        const servicesData = await api.getProviderServices(id);
        console.log('[ProviderProfile] Services data:', servicesData);
        const normalizedServices = (servicesData || []).map(s => ({
          ...s,
          id: s._id || s.id
        }));
        setServices(normalizedServices);
        
        // Fetch reviews
        const reviewsData = await api.getProviderReviews(id);
        console.log('[ProviderProfile] Reviews data:', reviewsData);
        setReviews(Array.isArray(reviewsData) ? reviewsData : []);
        
      } catch (err) {
        console.error('[ProviderProfile] Error:', err);
        setError(err.message || 'Failed to load provider data');
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchProviderData();
    }
  }, [id]);

  const handleAddService = async (e) => {
    e.preventDefault();
    if (!newService.name || !newService.price) {
      alert('Please enter service name and price');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const result = await api.addService({
        name: newService.name,
        description: newService.description,
        price: parseFloat(newService.price)
      });
      
      if (result.success) {
        setServices([...services, result.service]);
        setNewService({ name: '', description: '', price: '' });
        setShowAddService(false);
      } else {
        alert(result.error || 'Failed to add service');
      }
    } catch (err) {
      console.error('Error adding service:', err);
      alert('Failed to add service');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateService = async (serviceId, updatedData) => {
    setIsSubmitting(true);
    try {
      const result = await api.updateService(serviceId, updatedData);
      if (result.success) {
        setServices(services.map(s => s.id === serviceId ? result.service : s));
        setEditingService(null);
      } else {
        alert(result.error || 'Failed to update service');
      }
    } catch (err) {
      console.error('Error updating service:', err);
      alert('Failed to update service');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteService = async (serviceId) => {
    if (!confirm('Are you sure you want to delete this service?')) return;
    
    setIsSubmitting(true);
    try {
      const result = await api.deleteService(serviceId);
      if (result.success) {
        setServices(services.filter(s => s.id !== serviceId));
      } else {
        alert(result.error || 'Failed to delete service');
      }
    } catch (err) {
      console.error('Error deleting service:', err);
      alert('Failed to delete service');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMessage = () => {
    navigate(`/messages/${id}`);
  };

  const handleBook = () => {
    navigate(`/book/${id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <FiLoader className="animate-spin text-4xl text-blue-500" />
      </div>
    );
  }

  if (error || !provider) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="text-center">
          <FiTool className="text-6xl text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Provider Not Found</h2>
          <p className="text-gray-500 mb-4">{error || 'The provider you are looking for does not exist.'}</p>
          <button
            onClick={() => navigate('/search')}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Find Other Providers
          </button>
        </div>
      </div>
    );
  }

  if (!isDesktop) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
          <div className="flex items-center p-4">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
              <FiArrowLeft className="text-2xl" />
            </button>
            <h1 className="flex-1 text-lg font-bold text-center">Provider Profile</h1>
            <div className="w-10" />
          </div>
        </header>

        {/* Profile Header */}
        <div className="bg-white p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            {provider.avatar ? (
              <img 
                src={provider.avatar} 
                alt={provider.name}
                className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-3xl font-bold text-blue-600">
                  {provider.name?.charAt(0)?.toUpperCase() || '?'}
                </span>
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">{provider.name}</h2>
              <p className="text-gray-600 text-sm">{provider.profession}</p>
              <StarRating rating={provider.rating} count={provider.reviewCount} size="sm" />
            </div>
          </div>
          
          <div className="mt-4 flex gap-2">
            {currentUser.role === 'client' && (
              <>
                <button
                  onClick={handleMessage}
                  className="flex-1 py-2 border border-blue-500 text-blue-500 rounded-lg font-medium"
                >
                  <FiMessageCircle className="inline mr-2" />
                  Message
                </button>
                <button
                  onClick={handleBook}
                  className="flex-1 py-2 bg-blue-500 text-white rounded-lg font-medium"
                >
                  Book Now
                </button>
              </>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white p-4 m-4 rounded-xl shadow-sm border border-gray-200">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900">{provider.jobsDone || 0}</div>
              <div className="text-xs text-gray-500">Jobs Done</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{provider.rating?.toFixed(1) || '0'}</div>
              <div className="text-xs text-gray-500">Rating</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{provider.hourlyRate || 0}</div>
              <div className="text-xs text-gray-500">MAD/hr</div>
            </div>
          </div>
        </div>

        {/* About */}
        <div className="bg-white p-4 m-4 rounded-xl shadow-sm border border-gray-200">
          <h3 className="font-bold text-gray-900 mb-3">About</h3>
          <p className="text-gray-600 text-sm">{provider.bio || 'No bio provided'}</p>
          
          <div className="mt-3 space-y-2 text-sm">
            {provider.location && (
              <div className="flex items-center gap-2 text-gray-500">
                <FiMapPin className="text-gray-400" />
                <span>{provider.location}</span>
              </div>
            )}
            {provider.phone && (
              <div className="flex items-center gap-2 text-gray-500">
                <FiPhone className="text-gray-400" />
                <span>{formatPhone(provider.phone)}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-gray-500">
              <FiClock className="text-gray-400" />
              <span>Response: {provider.responseTime || '< 1h'}</span>
            </div>
            {provider.verified && (
              <div className="flex items-center gap-2 text-green-600">
                <FiCheckCircle />
                <span>Verified Professional</span>
              </div>
            )}
          </div>
        </div>

        {/* Services */}
        <div className="bg-white p-4 m-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-gray-900">Services Offered</h3>
            {isProviderOwner && (
              <button
                onClick={() => setShowAddService(!showAddService)}
                className="text-blue-500 text-sm font-medium"
              >
                {showAddService ? 'Cancel' : '+ Add Service'}
              </button>
            )}
          </div>
          
          {showAddService && isProviderOwner && (
            <form onSubmit={handleAddService} className="mb-4 p-3 bg-gray-50 rounded-lg">
              <input
                type="text"
                placeholder="Service name"
                value={newService.name}
                onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                className="w-full p-2 mb-2 border rounded-lg"
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={newService.description}
                onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                className="w-full p-2 mb-2 border rounded-lg"
              />
              <input
                type="number"
                placeholder="Price (MAD)"
                value={newService.price}
                onChange={(e) => setNewService({ ...newService, price: e.target.value })}
                className="w-full p-2 mb-2 border rounded-lg"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2 bg-blue-500 text-white rounded-lg"
                >
                  {isSubmitting ? 'Adding...' : 'Add Service'}
                </button>
              </div>
            </form>
          )}
          
          {services.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">
              {isProviderOwner ? 'No services added yet. Click + to add.' : 'No services listed yet.'}
            </p>
          ) : (
            <div className="space-y-3">
              {services.map((service) => (
                <div key={service.id} className="border-b border-gray-100 pb-3 last:border-0">
                  {editingService === service.id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        defaultValue={service.name}
                        ref={(input) => input?.focus()}
                        onBlur={(e) => handleUpdateService(service.id, { name: e.target.value })}
                        className="w-full p-2 border rounded-lg"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingService(null)}
                          className="px-3 py-1 text-gray-500"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900">{service.name}</h4>
                        {service.description && (
                          <p className="text-sm text-gray-500">{service.description}</p>
                        )}
                        <p className="text-sm font-bold text-blue-600 mt-1">{service.price} MAD</p>
                      </div>
                      {isProviderOwner && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingService(service.id)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                          >
                            <FiEdit2 className="text-sm" />
                          </button>
                          <button
                            onClick={() => handleDeleteService(service.id)}
                            className="p-1 text-gray-400 hover:text-red-500"
                          >
                            <FiTrash2 className="text-sm" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reviews */}
        <div className="bg-white p-4 m-4 rounded-xl shadow-sm border border-gray-200 mb-24">
          <h3 className="font-bold text-gray-900 mb-3">Reviews ({reviews.length})</h3>
          {reviews.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">No reviews yet</p>
          ) : (
            <div className="space-y-4">
              {reviews.slice(0, 5).map((review) => (
                <div key={review.id} className="border-b border-gray-100 pb-3 last:border-0">
                  <div className="flex items-center gap-2 mb-1">
                    <StarRating rating={review.rating} size="sm" />
                  </div>
                  <p className="text-sm text-gray-600">{review.comment}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    — {review.clientName}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="max-w-6xl mx-auto p-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 mb-6">
        <FiArrowLeft /> Back
      </button>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Profile Info */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-20">
            <div className="text-center">
              {provider.avatar ? (
                <img 
                  src={provider.avatar} 
                  alt={provider.name}
                  className="w-32 h-32 rounded-full object-cover mx-auto border-4 border-gray-200"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-blue-100 flex items-center justify-center mx-auto">
                  <span className="text-4xl font-bold text-blue-600">
                    {provider.name?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                </div>
              )}
              <h2 className="text-2xl font-bold text-gray-900 mt-4">{provider.name}</h2>
              <p className="text-gray-600">{provider.profession}</p>
              <div className="flex justify-center mt-2">
                <StarRating rating={provider.rating} count={provider.reviewCount} />
              </div>
            </div>
            
            <div className="mt-6 flex gap-3">
              {currentUser.role === 'client' && (
                <>
                  <button
                    onClick={handleMessage}
                    className="flex-1 py-2 border border-blue-500 text-blue-500 rounded-lg font-medium hover:bg-blue-50"
                  >
                    <FiMessageCircle className="inline mr-2" />
                    Message
                  </button>
                  <button
                    onClick={handleBook}
                    className="flex-1 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600"
                  >
                    Book Now
                  </button>
                </>
              )}
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-gray-900">{provider.jobsDone || 0}</div>
                  <div className="text-xs text-gray-500">Jobs Done</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{provider.rating?.toFixed(1) || '0'}</div>
                  <div className="text-xs text-gray-500">Rating</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">{provider.hourlyRate || 0}</div>
                  <div className="text-xs text-gray-500">MAD/hr</div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 space-y-3">
              {provider.location && (
                <div className="flex items-center gap-2 text-gray-600 text-sm">
                  <FiMapPin className="text-gray-400" />
                  <span>{provider.location}</span>
                </div>
              )}
              {provider.phone && (
                <div className="flex items-center gap-2 text-gray-600 text-sm">
                  <FiPhone className="text-gray-400" />
                  <span>{formatPhone(provider.phone)}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-gray-600 text-sm">
                <FiClock className="text-gray-400" />
                <span>Response: {provider.responseTime || '< 1h'}</span>
              </div>
              {provider.serviceArea && (
                <div className="flex items-center gap-2 text-gray-600 text-sm">
                  <FiGlobe className="text-gray-400" />
                  <span>Service Area: {provider.serviceArea}</span>
                </div>
              )}
              {provider.verified && (
                <div className="flex items-center gap-2 text-green-600 text-sm">
                  <FiCheckCircle />
                  <span>Verified Professional</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Right Column - Services, Reviews, About */}
        <div className="lg:col-span-2 space-y-6">
          {/* About */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-3">About</h3>
            <p className="text-gray-600">{provider.bio || 'No bio provided'}</p>
          </div>
          
          {/* Services */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Services Offered</h3>
              {isProviderOwner && (
                <button
                  onClick={() => setShowAddService(!showAddService)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm"
                >
                  <FiPlus /> Add Service
                </button>
              )}
            </div>
            
            {showAddService && isProviderOwner && (
              <form onSubmit={handleAddService} className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <input
                    type="text"
                    placeholder="Service name *"
                    value={newService.name}
                    onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                    className="p-2 border rounded-lg"
                  />
                  <input
                    type="number"
                    placeholder="Price (MAD) *"
                    value={newService.price}
                    onChange={(e) => setNewService({ ...newService, price: e.target.value })}
                    className="p-2 border rounded-lg"
                  />
                </div>
                <textarea
                  placeholder="Description (optional)"
                  value={newService.description}
                  onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                  className="w-full p-2 mb-3 border rounded-lg"
                  rows={2}
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg"
                  >
                    {isSubmitting ? 'Adding...' : 'Add Service'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddService(false)}
                    className="px-4 py-2 border rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
            
            {services.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                {isProviderOwner ? 'No services added yet. Click "Add Service" to get started.' : 'No services listed yet.'}
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services.map((service) => (
                  <div key={service.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-gray-900">{service.name}</h4>
                        {service.description && (
                          <p className="text-sm text-gray-500 mt-1">{service.description}</p>
                        )}
                        <p className="text-lg font-bold text-blue-600 mt-2">{service.price} MAD</p>
                      </div>
                      {isProviderOwner && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => {
                              setEditingService(service.id);
                              setNewService({ name: service.name, description: service.description, price: service.price });
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600"
                          >
                            <FiEdit2 />
                          </button>
                          <button
                            onClick={() => handleDeleteService(service.id)}
                            className="p-1 text-gray-400 hover:text-red-500"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Reviews */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Reviews ({reviews.length})</h3>
            {reviews.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No reviews yet. Be the first to leave a review!</p>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="border-b border-gray-100 pb-4 last:border-0">
                    <div className="flex items-center gap-2 mb-2">
                      <StarRating rating={review.rating} size="sm" />
                      <span className="text-sm text-gray-500">· {new Date(review.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-gray-600">{review.comment}</p>
                    <p className="text-sm text-gray-400 mt-2">— {review.clientName}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}