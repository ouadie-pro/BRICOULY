// frontend/src/components/ProviderProfileScreen.jsx
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import {
  FiArrowLeft, FiStar, FiMapPin, FiClock, FiTool, FiMessageCircle,
  FiCalendar, FiCheckCircle, FiAward, FiUsers, FiBriefcase,
  FiMail, FiPhone, FiGlobe, FiThumbsUp, FiShare2, FiBookmark,
  FiCheck, FiX, FiEdit2, FiPlus, FiTrash2, FiLoader, FiHeart,
  FiSend, FiRefreshCw, FiAlertCircle, FiDollarSign, FiInfo, FiImage
} from 'react-icons/fi';

const StarRating = ({ rating, count, size = 'md', interactive = false, onChange }) => {
  const [hoverRating, setHoverRating] = useState(0);
  const fullStars = Math.floor(rating || 0);
  const hasHalfStar = (rating || 0) - fullStars >= 0.5;
  const starSize = size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-2xl' : 'text-base';
  
  const displayRating = interactive ? (hoverRating || rating) : rating;
  
  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onChange?.(star)}
            onMouseEnter={() => interactive && setHoverRating(star)}
            onMouseLeave={() => interactive && setHoverRating(0)}
            className={`${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}`}
          >
            <FiStar
              className={`${starSize} ${star <= displayRating ? 'text-yellow-400 fill-yellow-400' : 
                star === Math.floor(displayRating) + 1 && hasHalfStar && !interactive ? 'text-yellow-400' : 'text-gray-300'}`}
            />
          </button>
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

const ReviewModal = ({ isOpen, onClose, provider, onSubmit, existingReview = null }) => {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [punctuality, setPunctuality] = useState(existingReview?.punctuality || 5);
  const [professionalism, setProfessionalism] = useState(existingReview?.professionalism || 5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit({ rating, comment, punctuality, professionalism });
      onClose();
    } catch (err) {
      console.error('Error submitting review:', err);
      alert('Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">{existingReview ? 'Edit Review' : 'Write a Review'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FiX className="text-xl" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Overall Rating</p>
            <StarRating rating={rating} size="lg" interactive={true} onChange={setRating} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Punctuality</label>
              <StarRating rating={punctuality} size="sm" interactive={true} onChange={setPunctuality} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Professionalism</label>
              <StarRating rating={professionalism} size="sm" interactive={true} onChange={setProfessionalism} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your Review</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Share your experience with this provider..."
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 border border-gray-200 rounded-lg">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="flex-1 py-2 bg-blue-500 text-white rounded-lg">
              {isSubmitting ? 'Submitting...' : (existingReview ? 'Update Review' : 'Submit Review')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const PortfolioModal = ({ isOpen, onClose, onAdd, providerId }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const preview = URL.createObjectURL(file);
      setImagePreview(preview);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description || !imageFile) {
      alert('Please fill all fields and select an image');
      return;
    }
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('title', title);
      formData.append('description', description);
      await onAdd(formData);
      setTitle('');
      setDescription('');
      setImageFile(null);
      setImagePreview(null);
      onClose();
    } catch (err) {
      console.error('Error adding portfolio:', err);
      alert('Failed to add portfolio item');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Add Portfolio Item</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FiX className="text-xl" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div
            onClick={() => document.getElementById('portfolio-image-input').click()}
            className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-500 transition-colors"
          >
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" className="max-h-40 mx-auto rounded" />
            ) : (
              <>
                <FiImage className="text-4xl text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Click to select image</p>
              </>
            )}
          </div>
          <input
            id="portfolio-image-input"
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="w-full p-2 border border-gray-200 rounded-lg"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            rows={3}
            className="w-full p-2 border border-gray-200 rounded-lg"
          />
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 border border-gray-200 rounded-lg">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="flex-1 py-2 bg-blue-500 text-white rounded-lg">
              {isSubmitting ? 'Adding...' : 'Add to Portfolio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const EditServiceModal = ({ isOpen, onClose, service, onUpdate }) => {
  const [name, setName] = useState(service?.name || '');
  const [description, setDescription] = useState(service?.description || '');
  const [price, setPrice] = useState(service?.price || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !service) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !price) {
      alert('Please fill all required fields');
      return;
    }
    setIsSubmitting(true);
    try {
      await onUpdate(service.id, { name, description, price: parseFloat(price) });
      onClose();
    } catch (err) {
      console.error('Error updating service:', err);
      alert('Failed to update service');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Edit Service</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FiX className="text-xl" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Service name *"
            className="w-full p-2 border border-gray-200 rounded-lg"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            rows={3}
            className="w-full p-2 border border-gray-200 rounded-lg"
          />
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Price (MAD) *"
            className="w-full p-2 border border-gray-200 rounded-lg"
          />
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 border border-gray-200 rounded-lg">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="flex-1 py-2 bg-blue-500 text-white rounded-lg">
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function ProviderProfileScreen({ isDesktop }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isProviderOwner = currentUser.role === 'provider' && String(currentUser.id) === String(id);
  
  const [provider, setProvider] = useState(null);
  const [services, setServices] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isSavingFollow, setIsSavingFollow] = useState(false);
  
  // Modal states
  const [showAddService, setShowAddService] = useState(false);
  const [newService, setNewService] = useState({ name: '', description: '', price: '' });
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [editingReview, setEditingReview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Stats state
  const [stats, setStats] = useState({
    jobsDone: 0,
    activeJobs: 0,
    rating: 0,
    reviewCount: 0,
    profileViews: 0
  });

  // Fetch all provider data
  const fetchProviderData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch provider details
      const providerData = await api.getProvider(id);
      
      if (!providerData || providerData.error) {
        setError(providerData?.error || 'Provider not found');
        setLoading(false);
        return;
      }
      
      setProvider(providerData);
      
      // Update stats from provider data
      setStats({
        jobsDone: providerData.jobsDone || 0,
        activeJobs: providerData.activeJobs || 0,
        rating: providerData.rating || 0,
        reviewCount: providerData.reviewCount || 0,
        profileViews: providerData.profileViews || 0
      });
      
      // Fetch services
      const servicesData = await api.getProviderServices(id);
      const normalizedServices = (servicesData || []).map(s => ({
        id: s._id || s.id,
        name: s.name,
        description: s.description,
        price: s.price,
        createdAt: s.createdAt
      }));
      setServices(normalizedServices);
      
      // Fetch portfolio
      const portfolioData = await api.getPortfolio(id);
      const normalizedPortfolio = (portfolioData || []).map(p => ({
        id: p._id || p.id,
        imageUrl: p.imageUrl,
        title: p.title,
        description: p.description,
        createdAt: p.createdAt
      }));
      setPortfolio(normalizedPortfolio);
      
      // Fetch reviews
      const reviewsData = await api.getProviderReviews(id);
      const normalizedReviews = (reviewsData?.reviews || reviewsData || []).map(r => ({
        id: r._id || r.id,
        rating: r.rating,
        comment: r.comment,
        punctuality: r.punctuality,
        professionalism: r.professionalism,
        clientName: r.clientName || r.clientId?.name,
        clientAvatar: r.clientAvatar || r.clientId?.avatar,
        createdAt: r.createdAt
      }));
      setReviews(normalizedReviews);
      
      // Increment profile view (if not owner)
      if (!isProviderOwner && currentUser.id) {
        await api.incrementProfileView(id).catch(() => {});
      }
      
      // Check follow status
      if (currentUser.id && !isProviderOwner) {
        const followStatus = await api.checkFollowStatus(id);
        setIsFollowing(followStatus.following);
      }
      
    } catch (err) {
      console.error('[ProviderProfile] Error:', err);
      setError(err.message || 'Failed to load provider data');
    } finally {
      setLoading(false);
    }
  }, [id, currentUser.id, isProviderOwner]);

  useEffect(() => {
    if (id) {
      fetchProviderData();
    }
  }, [id, fetchProviderData]);

  const handleFollowToggle = async () => {
    if (!currentUser.id) {
      navigate('/auth');
      return;
    }
    
    setIsSavingFollow(true);
    try {
      const result = await api.followUser(id);
      setIsFollowing(result.following);
      showToast(result.following ? `Following ${provider.name}` : `Unfollowed ${provider.name}`, 'success');
    } catch (err) {
      console.error('Error toggling follow:', err);
      showToast('Failed to update follow status', 'error');
    } finally {
      setIsSavingFollow(false);
    }
  };

  const handleAddService = async (e) => {
    e.preventDefault();
    if (!newService.name || !newService.price) {
      showToast('Please enter service name and price', 'error');
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
        const addedService = {
          id: result.service.id,
          name: result.service.name,
          description: result.service.description,
          price: result.service.price,
          createdAt: new Date().toISOString()
        };
        setServices([...services, addedService]);
        setNewService({ name: '', description: '', price: '' });
        setShowAddService(false);
        showToast('Service added successfully', 'success');
      } else {
        showToast(result.error || 'Failed to add service', 'error');
      }
    } catch (err) {
      console.error('Error adding service:', err);
      showToast('Failed to add service', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateService = async (serviceId, updatedData) => {
    setIsSubmitting(true);
    try {
      const result = await api.updateService(serviceId, updatedData);
      if (result.success) {
        setServices(services.map(s => 
          s.id === serviceId ? { ...s, ...result.service } : s
        ));
        setEditingService(null);
        showToast('Service updated successfully', 'success');
      } else {
        showToast(result.error || 'Failed to update service', 'error');
      }
    } catch (err) {
      console.error('Error updating service:', err);
      showToast('Failed to update service', 'error');
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
        showToast('Service deleted successfully', 'success');
      } else {
        showToast(result.error || 'Failed to delete service', 'error');
      }
    } catch (err) {
      console.error('Error deleting service:', err);
      showToast('Failed to delete service', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddPortfolio = async (formData) => {
    const result = await api.addPortfolioItem(formData);
    if (result.success) {
      const newItem = {
        id: result.portfolio.id,
        imageUrl: result.portfolio.imageUrl,
        title: result.portfolio.title,
        description: result.portfolio.description,
        createdAt: new Date().toISOString()
      };
      setPortfolio([...portfolio, newItem]);
      showToast('Portfolio item added successfully', 'success');
    } else {
      throw new Error(result.error);
    }
  };

  const handleDeletePortfolio = async (itemId) => {
    if (!confirm('Are you sure you want to delete this portfolio item?')) return;
    
    try {
      const result = await api.deletePortfolioItem(itemId);
      if (result.success) {
        setPortfolio(portfolio.filter(p => p.id !== itemId));
        showToast('Portfolio item deleted', 'success');
      } else {
        showToast(result.error || 'Failed to delete portfolio item', 'error');
      }
    } catch (err) {
      console.error('Error deleting portfolio:', err);
      showToast('Failed to delete portfolio item', 'error');
    }
  };

  const handleSubmitReview = async (reviewData) => {
    try {
      const result = await api.submitReview({
        providerId: id,
        ...reviewData
      });
      
      if (result.success) {
        const newReview = {
          id: result.review?.id,
          rating: reviewData.rating,
          comment: reviewData.comment,
          punctuality: reviewData.punctuality,
          professionalism: reviewData.professionalism,
          clientName: currentUser.name,
          clientAvatar: currentUser.avatar,
          createdAt: new Date().toISOString()
        };
        setReviews([newReview, ...reviews]);
        
        // Update provider rating
        if (result.providerStats) {
          setStats(prev => ({
            ...prev,
            rating: result.providerStats.rating,
            reviewCount: result.providerStats.reviewCount
          }));
          setProvider(prev => ({
            ...prev,
            rating: result.providerStats.rating,
            reviewCount: result.providerStats.reviewCount
          }));
        }
        
        showToast('Review submitted successfully', 'success');
      } else {
        showToast(result.error || 'Failed to submit review', 'error');
      }
    } catch (err) {
      console.error('Error submitting review:', err);
      showToast('Failed to submit review', 'error');
    }
  };

  const handleMessage = () => {
    navigate(`/messages/${id}`);
  };

  const handleBook = () => {
    navigate(`/book/${id}`);
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: provider.name,
        text: `Check out ${provider.name} on Bricouly`,
        url: window.location.href
      });
    } catch (err) {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      showToast('Link copied to clipboard!', 'success');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <FiLoader className="animate-spin text-4xl text-blue-500 mx-auto mb-4" />
          <p className="text-gray-500">Loading provider profile...</p>
        </div>
      </div>
    );
  }

  if (error || !provider) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="text-center">
          <FiAlertCircle className="text-6xl text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Provider Not Found</h2>
          <p className="text-gray-500 mb-4">{error || 'The provider you are looking for does not exist.'}</p>
          <button
            onClick={() => navigate('/search')}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Find Other Providers
          </button>
        </div>
      </div>
    );
  }

  const formatPhone = (phone) => {
    if (!phone) return 'Not provided';
    if (phone.startsWith('+')) return phone;
    if (phone.startsWith('0')) return `+212 ${phone.slice(1)}`;
    return phone;
  };

  const getProviderLocation = () => {
    if (provider.location && provider.location !== '10km radius') {
      return provider.location;
    }
    if (provider.city) {
      return `${provider.city}, Morocco`;
    }
    return 'Morocco';
  };

  // Mobile Layout
  if (!isDesktop) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between p-4">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
              <FiArrowLeft className="text-2xl" />
            </button>
            <h1 className="text-lg font-bold text-center">Provider Profile</h1>
            <div className="flex gap-1">
              <button onClick={handleShare} className="p-2 hover:bg-gray-100 rounded-full">
                <FiShare2 className="text-xl" />
              </button>
            </div>
          </div>
        </header>

        {/* Profile Header */}
        <div className="bg-white p-6 border-b border-gray-200">
          <div className="flex items-start gap-4">
            <div className="relative">
              {provider.avatar ? (
                <img 
                  src={provider.avatar.startsWith('http') ? provider.avatar : window.location.origin + provider.avatar} 
                  alt={provider.name}
                  className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <span className="text-3xl font-bold text-white">
                    {provider.name?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                </div>
              )}
              {provider.verified && (
                <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1 border-2 border-white">
                  <FiCheckCircle className="text-white text-xs" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">{provider.name}</h2>
                {currentUser.id && !isProviderOwner && (
                  <button
                    onClick={handleFollowToggle}
                    disabled={isSavingFollow}
                    className={`p-2 rounded-full transition-colors ${
                      isFollowing ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {isSavingFollow ? (
                      <FiLoader className="animate-spin text-sm" />
                    ) : (
                      <FiUsers className="text-lg" />
                    )}
                  </button>
                )}
              </div>
              <p className="text-gray-600 text-sm mt-0.5">{provider.profession}</p>
              <div className="flex items-center gap-2 mt-1">
                <StarRating rating={provider.rating} count={provider.reviewCount} size="sm" />
              </div>
            </div>
          </div>
          
          <div className="mt-4 flex gap-2">
            {currentUser.role === 'client' && !isProviderOwner && (
              <>
                <button
                  onClick={handleMessage}
                  className="flex-1 py-2.5 border border-blue-500 text-blue-500 rounded-xl font-medium hover:bg-blue-50 transition-colors"
                >
                  <FiMessageCircle className="inline mr-2" />
                  Message
                </button>
                <button
                  onClick={handleBook}
                  className="flex-1 py-2.5 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors"
                >
                  Book Now
                </button>
              </>
            )}
            {isProviderOwner && (
              <button
                onClick={() => navigate('/profile')}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                <FiEdit2 className="inline mr-2" />
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white p-4 m-4 rounded-xl shadow-sm border border-gray-200">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.jobsDone}</div>
              <div className="text-xs text-gray-500 mt-1">Jobs Done</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.activeJobs}</div>
              <div className="text-xs text-gray-500 mt-1">Active Jobs</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{provider.hourlyRate || 0}</div>
              <div className="text-xs text-gray-500 mt-1">MAD/hr</div>
            </div>
          </div>
        </div>

        {/* About */}
        <div className="bg-white p-4 m-4 rounded-xl shadow-sm border border-gray-200">
          <h3 className="font-bold text-gray-900 mb-3">About</h3>
          <p className="text-gray-600 text-sm leading-relaxed">{provider.bio || 'No bio provided yet.'}</p>
          
          <div className="mt-4 space-y-2.5 text-sm">
            <div className="flex items-center gap-2 text-gray-500">
              <FiMapPin className="text-gray-400 text-base" />
              <span>{getProviderLocation()}</span>
            </div>
            {provider.phone && (
              <div className="flex items-center gap-2 text-gray-500">
                <FiPhone className="text-gray-400 text-base" />
                <span>{formatPhone(provider.phone)}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-gray-500">
              <FiClock className="text-gray-400 text-base" />
              <span>Response: {provider.responseTime || '< 1 hour'}</span>
            </div>
            {provider.serviceArea && (
              <div className="flex items-center gap-2 text-gray-500">
                <FiGlobe className="text-gray-400 text-base" />
                <span>Service Area: {provider.serviceArea}</span>
              </div>
            )}
            {provider.verified && (
              <div className="flex items-center gap-2 text-green-600">
                <FiCheckCircle />
                <span className="text-sm">Verified Professional</span>
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
                className="text-blue-500 text-sm font-medium flex items-center gap-1"
              >
                <FiPlus className="text-base" />
                Add
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
                className="w-full p-2 mb-2 border border-gray-200 rounded-lg"
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={newService.description}
                onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                className="w-full p-2 mb-2 border border-gray-200 rounded-lg"
              />
              <input
                type="number"
                placeholder="Price (MAD)"
                value={newService.price}
                onChange={(e) => setNewService({ ...newService, price: e.target.value })}
                className="w-full p-2 mb-3 border border-gray-200 rounded-lg"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium"
                >
                  {isSubmitting ? 'Adding...' : 'Add Service'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddService(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
          
          {services.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-6">
              {isProviderOwner ? 'No services added yet. Click + to add.' : 'No services listed yet.'}
            </p>
          ) : (
            <div className="space-y-3">
              {services.map((service) => (
                <div key={service.id} className="border-b border-gray-100 pb-3 last:border-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900">{service.name}</h4>
                      {service.description && (
                        <p className="text-sm text-gray-500 mt-0.5">{service.description}</p>
                      )}
                      <p className="text-sm font-bold text-blue-600 mt-1">{service.price} MAD</p>
                    </div>
                    {isProviderOwner && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => setEditingService(service)}
                          className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
                        >
                          <FiEdit2 className="text-sm" />
                        </button>
                        <button
                          onClick={() => handleDeleteService(service.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg"
                        >
                          <FiTrash2 className="text-sm" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Portfolio */}
        {isProviderOwner && (
          <div className="bg-white p-4 m-4 rounded-xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-gray-900">Portfolio</h3>
              <button
                onClick={() => setShowPortfolioModal(true)}
                className="text-blue-500 text-sm font-medium flex items-center gap-1"
              >
                <FiPlus className="text-base" />
                Add
              </button>
            </div>
            
            {portfolio.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-6">No portfolio items yet. Add your work examples!</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {portfolio.map((item) => (
                  <div key={item.id} className="relative group rounded-lg overflow-hidden border border-gray-200">
                    <img 
                      src={item.imageUrl.startsWith('http') ? item.imageUrl : window.location.origin + item.imageUrl} 
                      alt={item.title}
                      className="w-full h-32 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        onClick={() => handleDeletePortfolio(item.id)}
                        className="p-2 bg-red-500 text-white rounded-full"
                      >
                        <FiTrash2 className="text-sm" />
                      </button>
                    </div>
                    <div className="p-2">
                      <p className="text-sm font-medium text-gray-800 truncate">{item.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Reviews */}
        <div className="bg-white p-4 m-4 rounded-xl shadow-sm border border-gray-200 mb-24">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-gray-900">Reviews ({reviews.length})</h3>
            {currentUser.role === 'client' && !isProviderOwner && (
              <button
                onClick={() => setShowReviewModal(true)}
                className="text-blue-500 text-sm font-medium"
              >
                Write Review
              </button>
            )}
          </div>
          
          {reviews.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-6">No reviews yet. Be the first to leave a review!</p>
          ) : (
            <div className="space-y-4">
              {reviews.slice(0, 5).map((review) => (
                <div key={review.id} className="border-b border-gray-100 pb-3 last:border-0">
                  <div className="flex items-center gap-2 mb-1">
                    <StarRating rating={review.rating} size="sm" />
                    <span className="text-xs text-gray-400">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{review.comment}</p>
                  <p className="text-xs text-gray-400 mt-1">— {review.clientName}</p>
                </div>
              ))}
              {reviews.length > 5 && (
                <button className="text-blue-500 text-sm text-center w-full py-2">
                  View all {reviews.length} reviews
                </button>
              )}
            </div>
          )}
        </div>

        {/* Modals */}
        <EditServiceModal
          isOpen={!!editingService}
          onClose={() => setEditingService(null)}
          service={editingService}
          onUpdate={handleUpdateService}
        />
        
        <PortfolioModal
          isOpen={showPortfolioModal}
          onClose={() => setShowPortfolioModal(false)}
          onAdd={handleAddPortfolio}
          providerId={id}
        />
        
        <ReviewModal
          isOpen={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          provider={provider}
          onSubmit={handleSubmitReview}
          existingReview={editingReview}
        />
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="max-w-7xl mx-auto p-6">
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <FiArrowLeft className="text-lg" /> Back
      </button>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Profile Info */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-20">
            <div className="text-center">
              {provider.avatar ? (
                <img 
                  src={provider.avatar.startsWith('http') ? provider.avatar : window.location.origin + provider.avatar} 
                  alt={provider.name}
                  className="w-32 h-32 rounded-full object-cover mx-auto border-4 border-gray-200"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto">
                  <span className="text-4xl font-bold text-white">
                    {provider.name?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                </div>
              )}
              {provider.verified && (
                <div className="inline-flex items-center gap-1 mt-2 px-2 py-1 bg-green-50 text-green-600 rounded-full text-xs">
                  <FiCheckCircle className="text-xs" />
                  Verified Professional
                </div>
              )}
              <h2 className="text-2xl font-bold text-gray-900 mt-3">{provider.name}</h2>
              <p className="text-gray-600">{provider.profession}</p>
              <div className="flex justify-center mt-2">
                <StarRating rating={stats.rating} count={stats.reviewCount} />
              </div>
            </div>
            
            <div className="mt-6 flex gap-3">
              {currentUser.role === 'client' && !isProviderOwner && (
                <>
                  <button
                    onClick={handleMessage}
                    className="flex-1 py-2.5 border border-blue-500 text-blue-500 rounded-xl font-medium hover:bg-blue-50 transition-colors"
                  >
                    <FiMessageCircle className="inline mr-2" />
                    Message
                  </button>
                  <button
                    onClick={handleBook}
                    className="flex-1 py-2.5 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors"
                  >
                    Book Now
                  </button>
                </>
              )}
              {currentUser.id && !isProviderOwner && (
                <button
                  onClick={handleFollowToggle}
                  disabled={isSavingFollow}
                  className={`p-2.5 rounded-xl transition-colors ${
                    isFollowing 
                      ? 'bg-blue-500 text-white hover:bg-blue-600' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title={isFollowing ? 'Unfollow' : 'Follow'}
                >
                  {isSavingFollow ? (
                    <FiLoader className="animate-spin text-lg" />
                  ) : (
                    <FiUsers className="text-lg" />
                  )}
                </button>
              )}
              {isProviderOwner && (
                <button
                  onClick={() => navigate('/profile')}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  <FiEdit2 className="inline mr-2" />
                  Edit Profile
                </button>
              )}
              <button
                onClick={handleShare}
                className="p-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors"
                title="Share Profile"
              >
                <FiShare2 className="text-lg" />
              </button>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-gray-900">{stats.jobsDone}</div>
                  <div className="text-xs text-gray-500 mt-0.5">Jobs Done</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{stats.activeJobs}</div>
                  <div className="text-xs text-gray-500 mt-0.5">Active Jobs</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">{provider.hourlyRate || 0}</div>
                  <div className="text-xs text-gray-500 mt-0.5">MAD/hr</div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-2 text-gray-600 text-sm">
                <FiMapPin className="text-gray-400 text-base" />
                <span>{getProviderLocation()}</span>
              </div>
              {provider.phone && (
                <div className="flex items-center gap-2 text-gray-600 text-sm">
                  <FiPhone className="text-gray-400 text-base" />
                  <span>{formatPhone(provider.phone)}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-gray-600 text-sm">
                <FiClock className="text-gray-400 text-base" />
                <span>Response: {provider.responseTime || '< 1 hour'}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600 text-sm">
                <FiDollarSign className="text-gray-400 text-base" />
                <span>{provider.hourlyRate || 0} MAD per hour</span>
              </div>
              {provider.serviceArea && (
                <div className="flex items-center gap-2 text-gray-600 text-sm">
                  <FiGlobe className="text-gray-400 text-base" />
                  <span>Service Area: {provider.serviceArea}</span>
                </div>
              )}
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <FiCalendar className="text-gray-400" />
                <span>Member since {new Date(provider.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* About */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-3">About</h3>
            <p className="text-gray-600 leading-relaxed">{provider.bio || 'No bio provided yet.'}</p>
          </div>
          
          {/* Services */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-bold text-gray-900">Services Offered</h3>
              {isProviderOwner && (
                <button
                  onClick={() => setShowAddService(!showAddService)}
                  className="flex items-center gap-1 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                >
                  <FiPlus className="text-base" /> Add Service
                </button>
              )}
            </div>
            
            {showAddService && isProviderOwner && (
              <form onSubmit={handleAddService} className="mb-6 p-5 bg-gray-50 rounded-xl">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <input
                    type="text"
                    placeholder="Service name *"
                    value={newService.name}
                    onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                    className="p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    placeholder="Price (MAD) *"
                    value={newService.price}
                    onChange={(e) => setNewService({ ...newService, price: e.target.value })}
                    className="p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <textarea
                  placeholder="Description (optional)"
                  value={newService.description}
                  onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                  className="w-full p-3 mb-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                />
                <div className="flex gap-3">
                  <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-blue-500 text-white rounded-lg font-medium">
                    {isSubmitting ? 'Adding...' : 'Add Service'}
                  </button>
                  <button type="button" onClick={() => setShowAddService(false)} className="px-5 py-2.5 border border-gray-200 rounded-lg font-medium">
                    Cancel
                  </button>
                </div>
              </form>
            )}
            
            {services.length === 0 ? (
              <p className="text-gray-500 text-center py-10">
                {isProviderOwner ? 'No services added yet. Click "Add Service" to get started.' : 'No services listed yet.'}
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services.map((service) => (
                  <div key={service.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 text-lg">{service.name}</h4>
                        {service.description && (
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{service.description}</p>
                        )}
                        <p className="text-xl font-bold text-blue-600 mt-2">{service.price} MAD</p>
                      </div>
                      {isProviderOwner && (
                        <div className="flex gap-1 ml-3">
                          <button
                            onClick={() => setEditingService(service)}
                            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                            title="Edit"
                          >
                            <FiEdit2 className="text-sm" />
                          </button>
                          <button
                            onClick={() => handleDeleteService(service.id)}
                            className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100"
                            title="Delete"
                          >
                            <FiTrash2 className="text-sm" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Portfolio - Only for owner */}
          {isProviderOwner && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-xl font-bold text-gray-900">Portfolio</h3>
                <button
                  onClick={() => setShowPortfolioModal(true)}
                  className="flex items-center gap-1 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                >
                  <FiPlus className="text-base" /> Add Item
                </button>
              </div>
              
              {portfolio.length === 0 ? (
                <p className="text-gray-500 text-center py-10">
                  No portfolio items yet. Add your best work to showcase your skills!
                </p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {portfolio.map((item) => (
                    <div key={item.id} className="relative group rounded-xl overflow-hidden border border-gray-200">
                      <img 
                        src={item.imageUrl.startsWith('http') ? item.imageUrl : window.location.origin + item.imageUrl} 
                        alt={item.title}
                        className="w-full h-40 object-cover"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center">
                        <button
                          onClick={() => handleDeletePortfolio(item.id)}
                          className="p-2 bg-red-500 text-white rounded-full mb-2"
                        >
                          <FiTrash2 className="text-sm" />
                        </button>
                        <p className="text-white text-xs text-center px-2">{item.title}</p>
                      </div>
                      <div className="p-3 bg-white">
                        <p className="text-sm font-medium text-gray-800 truncate">{item.title}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Reviews */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-bold text-gray-900">Reviews</h3>
              {currentUser.role === 'client' && !isProviderOwner && (
                <button
                  onClick={() => setShowReviewModal(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                >
                  Write a Review
                </button>
              )}
            </div>
            
            {/* Review Summary */}
            {reviews.length > 0 && (
              <div className="mb-6 pb-6 border-b border-gray-200">
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-gray-900">{stats.rating.toFixed(1)}</div>
                    <div className="flex justify-center mt-1">
                      <StarRating rating={stats.rating} size="sm" />
                    </div>
                    <div className="text-sm text-gray-500 mt-1">Based on {stats.reviewCount} reviews</div>
                  </div>
                  <div className="flex-1 space-y-1">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = reviews.filter(r => Math.floor(r.rating) === star).length;
                      const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                      return (
                        <div key={star} className="flex items-center gap-2">
                          <span className="text-sm text-gray-600 w-6">{star}★</span>
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${percentage}%` }} />
                          </div>
                          <span className="text-sm text-gray-500 w-8">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
            
            {reviews.length === 0 ? (
              <p className="text-gray-500 text-center py-10">No reviews yet. Be the first to leave a review!</p>
            ) : (
              <div className="space-y-5">
                {reviews.map((review) => (
                  <div key={review.id} className="border-b border-gray-100 pb-5 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3 mb-2">
                      {review.clientAvatar ? (
                        <img 
                          src={review.clientAvatar.startsWith('http') ? review.clientAvatar : window.location.origin + review.clientAvatar} 
                          alt={review.clientName}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-sm font-bold text-gray-500">
                            {review.clientName?.charAt(0)?.toUpperCase() || '?'}
                          </span>
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{review.clientName}</p>
                        <div className="flex items-center gap-2">
                          <StarRating rating={review.rating} size="sm" />
                          <span className="text-xs text-gray-400">
                            {new Date(review.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed ml-12">{review.comment}</p>
                    {(review.punctuality || review.professionalism) && (
                      <div className="flex gap-4 mt-2 ml-12">
                        {review.punctuality && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <span>Punctuality:</span>
                            <StarRating rating={review.punctuality} size="sm" />
                          </div>
                        )}
                        {review.professionalism && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <span>Professionalism:</span>
                            <StarRating rating={review.professionalism} size="sm" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Modals */}
      <EditServiceModal
        isOpen={!!editingService}
        onClose={() => setEditingService(null)}
        service={editingService}
        onUpdate={handleUpdateService}
      />
      
      <PortfolioModal
        isOpen={showPortfolioModal}
        onClose={() => setShowPortfolioModal(false)}
        onAdd={handleAddPortfolio}
        providerId={id}
      />
      
      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        provider={provider}
        onSubmit={handleSubmitReview}
        existingReview={editingReview}
      />
    </div>
  );
}