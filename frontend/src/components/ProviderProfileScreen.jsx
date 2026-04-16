import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import RatingModal from './RatingModal';
import { 
  FiArrowLeft, FiShare2, FiCheckCircle, FiStar, FiMessageCircle, FiCalendar, FiCheck, FiX,
  FiMapPin, FiPhone, FiMail, FiUserPlus, FiUserMinus, FiUsers, FiAlertCircle, FiPlay,
  FiPlus, FiEdit2, FiTrash2, FiLoader, FiChevronLeft, FiChevronRight
} from 'react-icons/fi';

const formatCurrency = (amount) => `${amount} MAD`;

const formatRelativeTime = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) return 'À l\'instant';
  if (diffHours < 24) return `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7) return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
  if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaine${Math.floor(diffDays / 7) > 1 ? 's' : ''}`;
  return date.toLocaleDateString('fr-FR');
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
};

const StarRating = ({ rating, count, size = 14 }) => {
  const roundedRating = Math.round(rating || 0);
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <span 
          key={star} 
          style={{ 
            color: star <= roundedRating ? '#f59e0b' : '#d1d5db',
            fontSize: `${size}px`
          }}
        >
          ★
        </span>
      ))}
      {count !== undefined && count > 0 && (
        <span className="text-xs text-slate-500 ml-1">({count})</span>
      )}
    </div>
  );
};

const formatPhone = (phone) => {
  if (!phone) return 'Non renseigné';
  if (phone.startsWith('+')) return phone;
  if (phone.startsWith('0')) return `+212 ${phone.slice(1)}`;
  return phone;
};

const getResponseTimeDisplay = (responseTime) => {
  if (responseTime) return responseTime;
  return '< 1h';
};

const PortfolioLightbox = ({ items, currentIndex, onClose, onNext, onPrev }) => {
  if (currentIndex === null) return null;
  
  return (
    <div 
      className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      <button 
        className="absolute top-4 right-4 p-2 text-white/80 hover:text-white transition-colors z-10"
        onClick={onClose}
      >
        <FiX style={{ fontSize: '32px' }} />
      </button>
      
      {currentIndex > 0 && (
        <button 
          className="absolute left-4 p-3 text-white/80 hover:text-white transition-colors z-10 bg-black/30 rounded-full"
          onClick={(e) => { e.stopPropagation(); onPrev(); }}
        >
          <FiChevronLeft style={{ fontSize: '32px' }} />
        </button>
      )}
      
      {currentIndex < items.length - 1 && (
        <button 
          className="absolute right-4 p-3 text-white/80 hover:text-white transition-colors z-10 bg-black/30 rounded-full"
          onClick={(e) => { e.stopPropagation(); onNext(); }}
        >
          <FiChevronRight style={{ fontSize: '32px' }} />
        </button>
      )}
      
      <div 
        className="max-w-4xl max-h-[90vh] w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <img 
          src={items[currentIndex]?.imageUrl || items[currentIndex]?.image} 
          alt={items[currentIndex]?.caption || items[currentIndex]?.title}
          className="w-full h-full max-h-[85vh] object-contain rounded-lg"
        />
        {items[currentIndex]?.caption && (
          <p className="text-white text-center mt-4">{items[currentIndex].caption}</p>
        )}
        <div className="flex justify-center items-center gap-4 mt-4 text-white">
          <span className="text-sm opacity-70">
            {currentIndex + 1} / {items.length}
          </span>
        </div>
      </div>
    </div>
  );
};

export default function ProviderProfileScreen({ isDesktop }) {
  const { id } = useParams();
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [services, setServices] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [activeTab, setActiveTab] = useState('about');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedService, setSelectedService] = useState('');
  const [requestDescription, setRequestDescription] = useState('');
  const [requestSent, setRequestSent] = useState(false);
  const [following, setFollowing] = useState(false);
  const [completedBookings, setCompletedBookings] = useState([]);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [userReview, setUserReview] = useState(null);
  const [editingReview, setEditingReview] = useState(false);
  
  // Service form state
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [serviceName, setServiceName] = useState('');
  const [serviceDescription, setServiceDescription] = useState('');
  const [servicePrice, setServicePrice] = useState('');
  const [serviceCategory, setServiceCategory] = useState('other');
  const [savingService, setSavingService] = useState(false);
  
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const [portfolioLightboxIndex, setPortfolioLightboxIndex] = useState(null);

  const openPortfolioLightbox = (index) => {
    setPortfolioLightboxIndex(index);
  };

  const closePortfolioLightbox = () => {
    setPortfolioLightboxIndex(null);
  };

  const prevPortfolioImage = () => {
    if (portfolioLightboxIndex > 0) {
      setPortfolioLightboxIndex(portfolioLightboxIndex - 1);
    }
  };

  const nextPortfolioImage = () => {
    if (portfolioLightboxIndex < portfolio.length - 1) {
      setPortfolioLightboxIndex(portfolioLightboxIndex + 1);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (portfolioLightboxIndex === null) return;
      if (e.key === 'Escape') closePortfolioLightbox();
      if (e.key === 'ArrowRight') nextPortfolioImage();
      if (e.key === 'ArrowLeft') prevPortfolioImage();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [portfolioLightboxIndex]);

  useEffect(() => {
    console.log('[ProviderProfileScreen] Fetching provider with ID:', id);
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        console.log('[ProviderProfileScreen] Current user:', currentUser.id);
        
const [providerData, reviewsData, followStatusData, servicesData, portfolioData, bookingsData] = await Promise.all([
          api.getProvider(id),
          api.getProviderReviews(id),
          api.checkFollowStatus(id),
          api.getProviderServices(id),
          api.getProviderPortfolio(id),
          currentUser.role === 'user' ? api.getCompletedBookings() : Promise.resolve([]),
        ]);

        console.log('[ProviderProfileScreen] Provider data received:', providerData);
        console.log('[ProviderProfileScreen] Reviews data:', reviewsData?.length);
        console.log('[ProviderProfileScreen] Follow status:', followStatusData);

        // Compute isOwnProfile using fetched data
        const isOwnProfile = String(currentUser.id) === String(providerData?.id);

        // Increment profile view (don't await, fire and forget)
        if (!isOwnProfile) {
          api.incrementProfileView(id).catch(() => {});
        }

        // Filter completed bookings for this provider
        if (bookingsData?.bookings) {
          const providerBookings = bookingsData.bookings.filter(
            b => b.provider?.user?._id === id || b.provider?.user === id
          );
          setCompletedBookings(providerBookings);
        } else if (Array.isArray(bookingsData)) {
          const providerBookings = bookingsData.filter(
            b => b.provider?.user?._id === id || b.provider?.user === id
          );
          setCompletedBookings(providerBookings);
        }

        // Check for provider data validity
        if (providerData && !providerData.error && providerData.name) {
          setProvider(providerData);
          if (providerData.services?.length > 0) {
            setSelectedService(providerData.services[0].name);
          }
        } else if (providerData?.success === false || providerData?.error) {
          console.error('[ProviderProfileScreen] Provider API error:', providerData.error);
          setError(providerData?.error || 'Failed to load provider');
        } else if (!providerData?.name) {
          console.error('[ProviderProfileScreen] Provider data missing or invalid:', providerData);
          setError('Provider not found');
        } else {
          setError('Failed to load provider');
        }

        setReviews(reviewsData || []);
        setServices(servicesData || []);
        setPortfolio(portfolioData || []);

        // Check if current user has already reviewed this provider
        const currentUserId = currentUser?.id;
        if (currentUserId && Array.isArray(reviewsData)) {
          const existingUserReview = reviewsData.find(
            r => String(r.userId || r.clientId) === String(currentUserId)
          );
          setUserReview(existingUserReview || null);
        }

        // Set follow status from API
        setFollowing(followStatusData?.following || false);
      } catch (err) {
        console.error('[ProviderProfileScreen] Unexpected error:', err);
        setError('Failed to load provider. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // Service CRUD handlers
  const handleAddService = async () => {
    if (!serviceName.trim() || !servicePrice) return;
    setSavingService(true);
    try {
      const result = await api.addService({
        name: serviceName,
        description: serviceDescription,
        price: parseInt(servicePrice),
        category: serviceCategory,
      });
      if (result.success) {
        setServices([...services, result.service]);
        setShowServiceForm(false);
        resetServiceForm();
      }
    } catch (err) {
      console.error('Error adding service:', err);
    } finally {
      setSavingService(false);
    }
  };

  const handleUpdateService = async () => {
    if (!editingService || !serviceName.trim() || !servicePrice) return;
    setSavingService(true);
    try {
      const result = await api.updateService(editingService.id, {
        name: serviceName,
        description: serviceDescription,
        price: parseInt(servicePrice),
        category: serviceCategory,
      });
      if (result.success) {
        setServices(services.map(s => s.id === editingService.id ? result.service : s));
        setShowServiceForm(false);
        setEditingService(null);
        resetServiceForm();
      }
    } catch (err) {
      console.error('Error updating service:', err);
    } finally {
      setSavingService(false);
    }
  };

  const handleDeleteService = async (serviceId) => {
    if (!window.confirm('Are you sure you want to delete this service?')) return;
    try {
      const result = await api.deleteService(serviceId);
      if (result.success) {
        setServices(services.filter(s => s.id !== serviceId));
      }
    } catch (err) {
      console.error('Error deleting service:', err);
    }
  };

  const openEditService = (service) => {
    setEditingService(service);
    setServiceName(service.name || '');
    setServiceDescription(service.description || '');
    setServicePrice(service.price?.toString() || '');
    setServiceCategory(service.category || 'other');
    setShowServiceForm(true);
  };

  const resetServiceForm = () => {
    setServiceName('');
    setServiceDescription('');
    setServicePrice('');
    setServiceCategory('other');
    setEditingService(null);
  };

  const handleRequestService = async (e) => {
    e.preventDefault();
    const res = await api.createServiceRequest({
      providerId: id,
      serviceName: selectedService,
      description: requestDescription,
    });
    if (res.success) {
      setRequestSent(true);
      setTimeout(() => {
        setShowRequestModal(false);
        setRequestSent(false);
      }, 2000);
    }
  };

  const handleFollow = async () => {
    const res = await api.followUser(id);
    if (res.success) {
      setFollowing(res.following);
    }
  };

  const handleOpenRatingModal = (booking) => {
    setSelectedBooking(booking);
    setShowRatingModal(true);
  };

  const handleReviewSubmitted = (result) => {
    // Remove the booking from the list of completed bookings
    if (selectedBooking) {
      setCompletedBookings(prev => prev.filter(b => 
        (b._id || b.id) !== (selectedBooking._id || selectedBooking.id)
      ));
    }
    // Refresh reviews
    api.getProviderReviews(id).then(reviewsData => {
      const reviews = reviewsData || [];
      setReviews(reviews);
      // Update userReview state
      const currentUserId = currentUser?.id;
      if (currentUserId) {
        const existingUserReview = reviews.find(
          r => String(r.userId || r.clientId) === String(currentUserId)
        );
        setUserReview(existingUserReview || null);
      }
    });
    // Update provider rating in local state
    if (result.newRating !== undefined) {
      setProvider(prev => ({
        ...prev,
        rating: result.newRating,
        reviewCount: result.reviewCount
      }));
    }
    setEditingReview(false);
  };

  const handleOpenReviewModal = () => {
    if (userReview) {
      setEditingReview(true);
      setSelectedBooking(null);
    } else {
      setSelectedBooking(null);
      setEditingReview(false);
    }
    setShowRatingModal(true);
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background-light dark:bg-background-dark p-4">
        <FiAlertCircle style={{ fontSize: '60px' }} className="text-6xl text-slate-300 mb-4" />
        <p className="text-slate-500 text-lg">{error}</p>
        <button onClick={() => navigate(-1)} className="mt-4 px-4 py-2 bg-primary text-white rounded-lg">
          Go Back
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background-light dark:bg-background-dark">
        <FiLoader className="animate-spin text-4xl text-primary" />
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background-light dark:bg-background-dark p-4">
        <FiAlertCircle style={{ fontSize: '60px' }} className="text-6xl text-slate-300 mb-4" />
        <p className="text-slate-500 text-lg">Provider not found</p>
        <button onClick={() => navigate(-1)} className="mt-4 px-4 py-2 bg-primary text-white rounded-lg">
          Go Back
        </button>
      </div>
    );
  }

  const isOwnProfile = String(currentUser.id) === String(provider.id);

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleCall = () => {
    if (provider.phone) {
      window.location.href = `tel:${provider.phone}`;
    }
  };

  // Follow button label
  const followLabel = following ? 'Following' : 'Follow';
  const followDisabled = false;

  if (!isDesktop) {
    return (
      <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark pb-24">
        {/* Header */}
        <div className="sticky top-0 z-50 flex items-center bg-card-light dark:bg-card-dark p-4 pb-2 justify-between border-b border-gray-100 dark:border-gray-800 shadow-sm">
          <button
            onClick={() => navigate(-1)}
            className="flex size-12 shrink-0 items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full justify-center transition-colors"
          >
            <FiArrowLeft style={{ fontSize: '24px' }} />
          </button>
          <h2 className="text-text-light dark:text-text-dark text-lg font-bold leading-tight tracking-[-0.015em] text-center flex-1">
            Provider Profile
          </h2>
          <div className="flex w-12 items-center justify-end">
            <button 
              onClick={handleShare}
              className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full size-12 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <FiShare2 style={{ fontSize: '24px' }} />
            </button>
          </div>
        </div>

        {/* Avatar + Name */}
        <div className="flex flex-col">
          <div className="flex p-4 pb-2 bg-card-light dark:bg-card-dark pt-6">
            <div className="flex w-full flex-col gap-4 items-center">
              <div className="relative">
                {provider.avatar ? (
                  <div
                    className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-32 w-32 border-4 border-background-light dark:border-background-dark shadow-md"
                    style={{ backgroundImage: `url("${provider.avatar}")` }}
                  />
                ) : (
                  <div className="bg-slate-300 aspect-square rounded-full h-32 w-32 border-4 border-background-light dark:border-background-dark shadow-md flex items-center justify-center">
                    <span className="text-3xl font-bold text-slate-500">
                      {provider.name ? provider.name.charAt(0).toUpperCase() : '?'}
                    </span>
                  </div>
                )}
                {provider.verified && (
                  <div className="absolute bottom-1 right-1 bg-green-500 rounded-full p-1.5 border-4 border-card-light dark:border-card-dark">
                    <FiCheckCircle style={{ fontSize: '14px' }} className="text-white text-sm" />
                  </div>
                )}
              </div>
              <div className="flex flex-col items-center justify-center">
                <p className="text-text-light dark:text-text-dark text-[22px] font-bold leading-tight tracking-[-0.015em] text-center">
                  {provider.name}
                </p>
                <p className="text-secondary-text-light dark:text-secondary-text-dark text-base font-medium leading-normal text-center">
                  {provider.profession}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <FiStar style={{ fontSize: '16px' }} className="text-orange-400" />
                  <span className="text-text-light dark:text-text-dark font-bold text-sm">{provider.rating || 0}</span>
                  <span className="text-secondary-text-light dark:text-secondary-text-dark text-sm">
                    ({provider.reviewCount || 0} reviews)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Follow button — visible to everyone except own profile */}
          {!isOwnProfile && (
            <div className="px-4 pb-4 flex gap-3">
              <button
                onClick={handleFollow}
                disabled={followDisabled}
                className={`flex-1 py-2.5 rounded-xl font-medium transition-colors ${
                  following || followDisabled
                    ? 'bg-slate-200 text-slate-700'
                    : 'bg-primary text-white'
                }`}
              >
                {followLabel}
              </button>
              <Link
                to={`/messages/${provider.id}`}
                className="flex items-center justify-center gap-2 px-5 py-2.5 border border-primary text-primary rounded-xl hover:bg-blue-50 transition-colors"
              >
                <FiMessageCircle style={{ fontSize: '20px' }} />
              </Link>
            </div>
          )}

          {/* Stats */}
          <div className="flex justify-around py-4 bg-card-light dark:bg-card-dark border-b border-gray-100 dark:border-gray-800">
            <div className="flex flex-col items-center">
              <p className="text-lg font-bold text-text-light dark:text-text-dark">{provider.jobsDone || 0}</p>
              <p className="text-xs text-secondary-text-light dark:text-secondary-text-dark uppercase tracking-wide">Travaux Effectués</p>
            </div>
            <div className="w-px bg-gray-200 dark:bg-gray-700"></div>
            <div className="flex flex-col items-center">
              <StarRating rating={provider.rating || 0} count={provider.reviewCount || 0} />
              <p className="text-xs text-secondary-text-light dark:text-secondary-text-dark uppercase tracking-wide mt-1">Note</p>
            </div>
            <div className="w-px bg-gray-200 dark:bg-gray-700"></div>
            <div className="flex flex-col items-center">
              <p className="text-lg font-bold text-text-light dark:text-text-dark">{formatCurrency(provider.hourlyRate || 0)}</p>
              <p className="text-xs text-secondary-text-light dark:text-secondary-text-dark uppercase tracking-wide">Par Heure</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="sticky top-[72px] z-40 bg-background-light dark:bg-background-dark pt-6 px-4 pb-2">
            <div className="flex h-12 w-full items-center justify-center rounded-xl bg-gray-200 dark:bg-gray-800 p-1">
              {['About', 'Portfolio', 'Reviews'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab.toLowerCase())}
                  className={`flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-lg px-2 transition-all ${
                    activeTab === tab.toLowerCase()
                      ? 'bg-card-light dark:bg-card-dark shadow-sm text-primary'
                      : 'text-secondary-text-light dark:text-secondary-text-dark'
                  }`}
                >
                  <span className="truncate text-sm font-semibold">{tab}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tab content */}
          <div className="px-4 py-2 space-y-6">
            {activeTab === 'about' && (
              <div className="bg-card-light dark:bg-card-dark p-5 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
                <h3 className="text-text-light dark:text-text-dark text-lg font-bold mb-3">
                  À propos de {provider.name?.split(' ')[0] || 'ce prestataire'}
                </h3>
                <p className="text-secondary-text-light dark:text-secondary-text-dark text-sm leading-relaxed">
                  {provider.bio || 'Aucune description disponible.'}
                </p>
                <div className="flex flex-wrap gap-4 mt-3">
                  <div className="flex items-center gap-2 text-secondary-text-light dark:text-secondary-text-dark text-sm">
                    <FiMapPin style={{ fontSize: '16px' }} />
                    {provider.location || 'Localisation non renseignée'}
                  </div>
                  {provider.phone && (
                    <div className="flex items-center gap-2 text-secondary-text-light dark:text-secondary-text-dark text-sm">
                      <FiPhone style={{ fontSize: '16px' }} />
                      {provider.phone}
                    </div>
                  )}
                </div>
                <p className="text-secondary-text-light dark:text-secondary-text-dark text-sm mt-2">
                  {provider.serviceArea || 'Rayon de service non renseigné'}
                </p>
                <div className="flex flex-wrap gap-2 mt-4">
                  {services.map((service, idx) => (
                    <span
                      key={service.id || idx}
                      className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-text-light dark:text-text-dark text-xs font-medium rounded-full"
                    >
                      {service.name}
                    </span>
                  ))}
                  {services.length === 0 && (
                    <span className="text-slate-400 text-sm">Aucun service proposé</span>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'portfolio' && (
              <>
                {portfolio.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {portfolio.map((item, index) => (
                      <div 
                        key={item.id || item._id || index} 
                        className="aspect-square rounded-lg overflow-hidden bg-gray-200 cursor-pointer relative group"
                        onClick={() => openPortfolioLightbox(index)}
                      >
                        <img 
                          src={item.imageUrl || item.image} 
                          alt={item.caption || item.title || 'Portfolio item'} 
                          className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105" 
                        />
                        {item.caption && (
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <p className="text-white text-xs truncate">{item.caption}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-slate-500 py-8">Aucun élément dans le portfolio pour le moment.</p>
                )}
                <PortfolioLightbox 
                  items={portfolio}
                  currentIndex={portfolioLightboxIndex}
                  onClose={closePortfolioLightbox}
                  onNext={nextPortfolioImage}
                  onPrev={prevPortfolioImage}
                />
              </>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-4">
                {/* Write a Review button for clients */}
                {!isOwnProfile && currentUser.role === 'user' && (
                  <div className="bg-gradient-to-r from-primary/10 to-blue-50 dark:from-primary/5 dark:to-blue-900/20 p-4 rounded-xl border border-primary/20">
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                      {userReview 
                        ? 'Vous avez déjà noté ce professionnel. Modifiez votre avis !'
                        : `Vous avez utilisé les services de ${provider.name} ? Partagez votre expérience !`
                      }
                    </p>
                    <button
                      onClick={handleOpenReviewModal}
                      className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-blue-600 transition-colors"
                    >
                      {userReview ? 'Modifier mon avis' : 'Laisser un avis'}
                    </button>
                  </div>
                )}

                {/* Rating Summary */}
                {reviews.length > 0 && (
                  <div className="bg-card-light dark:bg-card-dark p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-4">
                      <div className="text-center min-w-[60px]">
                        <p className="text-4xl font-black text-slate-900 dark:text-white">
                          {provider.rating?.toFixed(1) || '0.0'}
                        </p>
                        <StarRating rating={provider.rating || 0} size={14} />
                        <p className="text-xs text-slate-500 mt-1">
                          {provider.reviewCount || 0} avis
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Reviews List */}
                {reviews.length > 0 ? reviews.map((review) => (
                  <div
                    key={review.id || review._id}
                    className="bg-card-light dark:bg-card-dark p-4 rounded-xl border border-gray-100 dark:border-gray-800"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        {review.userAvatar ? (
                          <div
                            className="w-8 h-8 rounded-full bg-cover bg-center"
                            style={{ backgroundImage: `url("${review.userAvatar}")` }}
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">
                            {review.userName?.charAt(0) || '?'}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-bold text-text-light dark:text-text-dark">{review.userName || review.clientName}</p>
                          <StarRating rating={review.rating || 0} size={12} />
                        </div>
                      </div>
                      <span className="text-xs text-secondary-text-light dark:text-secondary-text-dark">
                        {formatRelativeTime(review.createdAt)}
                      </span>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-secondary-text-light dark:text-secondary-text-dark">{review.comment}</p>
                    )}
                  </div>
                )) : (
                  <div className="text-center py-8">
                    <span className="text-5xl">⭐</span>
                    <p className="text-slate-500 mt-2">Aucun avis pour le moment</p>
                    <small className="text-slate-400">Soyez le premier à noter ce professionnel</small>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bottom CTA — only users can request a service; anyone can message */}
        {!isOwnProfile && (
          <div className="fixed bottom-0 left-0 right-0 bg-card-light dark:bg-card-dark border-t border-gray-100 dark:border-gray-800 p-4 safe-area-bottom z-50">
            <div className="flex items-center gap-4 max-w-lg mx-auto">
              {currentUser.role === 'user' && (
                <button
                  onClick={() => setShowRequestModal(true)}
                  className="flex-1 bg-primary hover:bg-blue-600 text-white font-bold h-12 rounded-xl shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2"
                >
                  <FiCalendar style={{ fontSize: '18px' }} />
                  Request Service
                </button>
              )}
              <Link
                to={`/messages/${provider.id}`}
                className={`flex items-center justify-center gap-2 h-12 rounded-xl border border-primary text-primary transition-colors hover:bg-blue-50 ${
                  currentUser.role === 'user' ? 'w-12' : 'flex-1'
                }`}
              >
                <FiMessageCircle style={{ fontSize: '18px' }} />
                {currentUser.role !== 'user' && <span className="font-bold">Message</span>}
              </Link>
            </div>
          </div>
        )}

        {/* Request Modal */}
        {showRequestModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-surface-dark rounded-2xl max-w-md w-full p-6">
              {requestSent ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FiCheck style={{ fontSize: '30px' }} className="text-green-600 text-3xl" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Request Sent!</h3>
                  <p className="text-slate-500">The provider will respond to your request soon.</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-slate-900">Request Service</h3>
                    <button onClick={() => setShowRequestModal(false)} className="p-2 hover:bg-slate-100 rounded-full">
                      <FiX />
                    </button>
                  </div>
                  <form onSubmit={handleRequestService}>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-slate-700 mb-2">Select Service</label>
                      <select
                        value={selectedService}
                        onChange={(e) => setSelectedService(e.target.value)}
                        className="w-full p-3 border border-slate-200 rounded-xl"
                      >
                        {services.map((service) => (
                          <option key={service.id || service._id} value={service.name}>
                            {service.name} - {formatCurrency(service.price || 0)}
                          </option>
                        ))}
                        {services.length === 0 && (
                          <option value="">Aucun service disponible</option>
                        )}
                      </select>
                    </div>
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-slate-700 mb-2">Describe Your Issue</label>
                      <textarea
                        value={requestDescription}
                        onChange={(e) => setRequestDescription(e.target.value)}
                        className="w-full p-3 border border-slate-200 rounded-xl resize-none min-h-[120px]"
                        placeholder="Describe what you need help with..."
                        required
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setShowRequestModal(false)}
                        className="flex-1 py-3 text-slate-600 font-medium hover:bg-slate-100 rounded-xl"
                      >
                        Cancel
                      </button>
                      <button type="submit" className="flex-1 py-3 bg-primary text-white font-bold rounded-xl hover:bg-blue-600">
                        Send Request
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ---- DESKTOP ----
  return (
    <div className="flex gap-8">
      <div className="flex-1">
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="flex p-6 pb-4 bg-slate-50">
            <div className="flex w-full gap-6 items-center">
              <div className="relative">
                {provider.avatar ? (
                  <div
                    className="bg-center bg-no-repeat aspect-square bg-cover rounded-2xl h-32 w-32 border-4 border-white shadow-md"
                    style={{ backgroundImage: `url("${provider.avatar}")` }}
                  />
                ) : (
                  <div className="bg-slate-300 aspect-square rounded-2xl h-32 w-32 border-4 border-white shadow-md flex items-center justify-center">
                    <span className="text-3xl font-bold text-slate-500">
                      {provider.name ? provider.name.charAt(0).toUpperCase() : '?'}
                    </span>
                  </div>
                )}
                {provider.verified && (
                  <div className="absolute bottom-2 right-2 bg-green-500 rounded-full p-1.5 border-4 border-white">
                    <FiCheckCircle style={{ fontSize: '14px' }} className="text-white text-sm" />
                  </div>
                )}
              </div>
              <div className="flex flex-col justify-center">
                <h1 className="text-2xl font-bold text-slate-900 mb-1">{provider.name}</h1>
                <p className="text-slate-500 text-base">{provider.profession}</p>
                <div className="flex items-center gap-2 mt-2">
                  <FiStar style={{ fontSize: '20px' }} className="text-amber-400" fill="currentColor" />
                  <span className="font-bold text-slate-900">{provider.rating || 0}</span>
                  <span className="text-slate-500">({provider.reviewCount || 0} reviews)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Follow + Message — visible to everyone except own profile */}
          {!isOwnProfile && (
            <div className="px-6 pb-4 flex gap-3">
              <button
                onClick={handleFollow}
                disabled={followDisabled}
                className={`px-6 py-2.5 rounded-xl font-medium transition-colors ${
                  following || followDisabled
                    ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    : 'bg-primary text-white hover:bg-blue-600'
                }`}
              >
                {followLabel}
              </button>
              <Link
                to={`/messages/${provider.id}`}
                className="flex items-center gap-2 px-6 py-2.5 border border-primary text-primary rounded-xl hover:bg-blue-50 transition-colors"
              >
                <FiMessageCircle style={{ fontSize: '18px' }} />
                Message
              </Link>
            </div>
          )}

          {/* Stats */}
          <div className="flex justify-around py-6 border-b border-slate-200">
            <div className="flex flex-col items-center">
              <p className="text-xl font-bold text-slate-900">{provider.jobsDone || 0}</p>
              <p className="text-xs text-slate-500 uppercase tracking-wide">Travaux Effectués</p>
            </div>
            <div className="w-px bg-slate-200"></div>
            <div className="flex flex-col items-center">
              <StarRating rating={provider.rating || 0} count={provider.reviewCount || 0} size={16} />
              <p className="text-xs text-slate-500 uppercase tracking-wide mt-1">Note</p>
            </div>
            <div className="w-px bg-slate-200"></div>
            <div className="flex flex-col items-center">
              <p className="text-xl font-bold text-slate-900">{formatCurrency(provider.hourlyRate || 0)}</p>
              <p className="text-xs text-slate-500 uppercase tracking-wide">Par Heure</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="p-6">
            <div className="flex gap-4 mb-6">
              {['About', 'Portfolio', 'Reviews'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab.toLowerCase())}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === tab.toLowerCase() ? 'bg-primary text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {activeTab === 'about' && (
              <>
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-3">À propos de {provider.name?.split(' ')[0] || 'ce prestataire'}</h3>
                  <p className="text-slate-600 leading-relaxed">{provider.bio || 'Aucune description disponible.'}</p>
                  <div className="flex flex-wrap gap-4 mt-3">
                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                      <FiMapPin style={{ fontSize: '18px' }} />
                      {provider.location || provider.city ? `${provider.location || provider.city}, Maroc` : 'Localisation non renseignée'}
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                      <FiPhone style={{ fontSize: '18px' }} />
                      {formatPhone(provider.phone)}
                    </div>
                  </div>
                  {provider.serviceArea && (
                    <p className="text-slate-400 text-sm mt-2">
                      {provider.serviceArea.includes('km') ? `Rayon de service: ${provider.serviceArea}` : provider.serviceArea}
                    </p>
                  )}
                </div>
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <div className="p-4 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-900">Services Offered</h3>
                    {isOwnProfile && (
                      <button
                        onClick={() => { resetServiceForm(); setShowServiceForm(true); }}
                        className="flex items-center gap-1 px-3 py-1 bg-primary text-white text-sm rounded-lg hover:bg-blue-600"
                      >
                        <FiPlus /> Add
                      </button>
                    )}
                  </div>
                  <div className="divide-y divide-slate-200">
                    {services.map((service) => (
                      <div key={service.id || service._id} className="flex items-center justify-between p-4">
                        <div>
                          <span className="text-slate-700 font-medium">{service.name}</span>
                          {service.description && (
                            <p className="text-slate-500 text-sm">{service.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-primary font-semibold">{formatCurrency(service.price || 0)}</span>
                          {isOwnProfile && (
                            <div className="flex gap-1">
                              <button onClick={() => openEditService(service)} className="p-1 text-slate-400 hover:text-primary">
                                <FiEdit2 style={{ fontSize: '14px' }} />
                              </button>
                              <button onClick={() => handleDeleteService(service.id || service._id)} className="p-1 text-slate-400 hover:text-red-500">
                                <FiTrash2 style={{ fontSize: '14px' }} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {services.length === 0 && (
                      <p className="p-4 text-slate-500 text-center">Aucun service proposé pour le moment.</p>
                    )}
                  </div>
                </div>
              </>
            )}

            {activeTab === 'portfolio' && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {portfolio.length > 0 ? portfolio.map((item) => (
                  <div key={item.id || item._id} className="aspect-square rounded-xl overflow-hidden bg-gray-100">
                    <img
                      src={item.imageUrl}
                      alt={item.caption}
                      className="w-full h-full object-cover hover:scale-105 transition-transform"
                    />
                  </div>
                )) : (
                  <p className="col-span-3 text-center text-slate-500 py-8">Aucun élément dans le portfolio pour le moment.</p>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-4">
                {/* Write a Review button for clients */}
                {!isOwnProfile && currentUser.role === 'user' && (
                  <div className="bg-gradient-to-r from-primary/10 to-blue-50 dark:from-primary/5 dark:to-blue-900/20 p-5 rounded-xl border border-primary/20">
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                      {userReview 
                        ? 'Vous avez déjà noté ce professionnel. Modifiez votre avis !'
                        : `Vous avez utilisé les services de ${provider.name} ? Partagez votre expérience !`
                      }
                    </p>
                    <button
                      onClick={handleOpenReviewModal}
                      className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-blue-600 transition-colors"
                    >
                      {userReview ? 'Modifier mon avis' : 'Laisser un avis'}
                    </button>
                  </div>
                )}

                {/* Rating Summary */}
                {reviews.length > 0 && (
                  <div className="rounded-xl border border-slate-200 p-5">
                    <div className="flex gap-8 items-center">
                      <div className="flex flex-col items-center justify-center min-w-[80px]">
                        <p className="text-5xl font-black text-slate-900">{provider.rating ? provider.rating.toFixed(1) : '0.0'}</p>
                        <StarRating rating={provider.rating || 0} size={16} />
                        <p className="text-xs text-slate-500 mt-2">Basé sur {provider.reviewCount || 0} avis</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Reviews List */}
                {reviews.length > 0 ? reviews.map((review) => (
                  <div key={review.id || review._id} className="border-t border-slate-200 pt-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-3">
                        {review.userAvatar ? (
                          <div
                            className="w-10 h-10 rounded-full bg-cover bg-center"
                            style={{ backgroundImage: `url("${review.userAvatar}")` }}
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                            {review.userName?.charAt(0) || review.clientName?.charAt(0) || '?'}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-slate-900">{review.userName || review.clientName}</p>
                          <StarRating rating={review.rating || 0} size={14} />
                        </div>
                      </div>
                      <span className="text-xs text-slate-500">{formatRelativeTime(review.createdAt)}</span>
                    </div>
                    {review.comment && <p className="text-slate-600">{review.comment}</p>}
                  </div>
                )) : (
                  <div className="text-center py-8">
                    <span className="text-5xl">⭐</span>
                    <p className="text-slate-500 mt-2">Aucun avis pour le moment</p>
                    <small className="text-slate-400">Soyez le premier à noter ce professionnel</small>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-80 shrink-0">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sticky top-24">
          <div className="mb-4">
            <span className="text-sm text-slate-500">À partir de</span>
            <p className="text-3xl font-bold text-slate-900">
              {formatCurrency(provider.hourlyRate || 0)}
              <span className="text-base font-normal text-slate-500">/hr</span>
            </p>
          </div>

          {!isOwnProfile && (
            <div className="flex flex-col gap-3">
              {currentUser.role === 'user' && (
                <button
                  onClick={() => setShowRequestModal(true)}
                  className="flex items-center justify-center gap-2 w-full h-12 bg-primary hover:bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all"
                >
                  <FiCalendar style={{ fontSize: '18px' }} />
                  Request Service
                </button>
              )}
              <Link
                to={`/messages/${provider.id}`}
                className="flex items-center justify-center gap-2 w-full h-12 bg-white border border-primary text-primary font-bold rounded-xl hover:bg-blue-50 transition-colors"
              >
                <FiMessageCircle style={{ fontSize: '18px' }} />
                Send Message
              </Link>
            </div>
          )}

          <div className="flex justify-center gap-4 mt-6 pt-6 border-t border-slate-200">
            <button 
              onClick={handleCall}
              className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors text-slate-600"
              title={provider.phone ? `Appeler ${provider.phone}` : 'Numéro non disponible'}
            >
              <FiPhone style={{ fontSize: '18px' }} />
            </button>
            <button 
              onClick={handleShare}
              className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors text-slate-600"
              title="Partager ce profil"
            >
              <FiShare2 />
            </button>
            {!isOwnProfile && (
              <button
                onClick={handleFollow}
                disabled={followDisabled}
                className={`flex items-center justify-center w-12 h-12 rounded-full transition-colors ${
                  following || followDisabled
                    ? 'bg-primary text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                                {following ? <FiUserMinus /> : <FiUserPlus />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            {requestSent ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiCheck style={{ fontSize: '30px' }} className="text-green-600 text-3xl" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Request Sent!</h3>
                <p className="text-slate-500">The provider will respond to your request soon.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-slate-900">Request Service</h3>
                  <button onClick={() => setShowRequestModal(false)} className="p-2 hover:bg-slate-100 rounded-full">
                    <FiX />
                  </button>
                </div>
                <form onSubmit={handleRequestService}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Sélectionner un service</label>
                    <select
                      value={selectedService}
                      onChange={(e) => setSelectedService(e.target.value)}
                      className="w-full p-3 border border-slate-200 rounded-xl"
                    >
                      {services.map((service) => (
                        <option key={service.id || service._id} value={service.name}>
                          {service.name} - {formatCurrency(service.price || 0)}
                        </option>
                      ))}
                      {services.length === 0 && (
                        <option value="">Aucun service disponible</option>
                      )}
                    </select>
                  </div>
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Describe Your Issue</label>
                    <textarea
                      value={requestDescription}
                      onChange={(e) => setRequestDescription(e.target.value)}
                      className="w-full p-3 border border-slate-200 rounded-xl resize-none min-h-[120px]"
                      placeholder="Describe what you need help with..."
                      required
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowRequestModal(false)}
                      className="flex-1 py-3 text-slate-600 font-medium hover:bg-slate-100 rounded-xl"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="flex-1 py-3 bg-primary text-white font-bold rounded-xl hover:bg-blue-600">
                      Send Request
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* Service Form Modal */}
      {showServiceForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-surface-dark rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {editingService ? 'Edit Service' : 'Add Service'}
              </h3>
              <button 
                onClick={() => { setShowServiceForm(false); resetServiceForm(); }} 
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full"
              >
                <FiX />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Service Name *
                </label>
                <input
                  type="text"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-transparent focus:outline-none focus:border-primary"
                  placeholder="e.g., Home Cleaning"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Description
                </label>
                <textarea
                  value={serviceDescription}
                  onChange={(e) => setServiceDescription(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-transparent resize-none focus:outline-none focus:border-primary"
                  placeholder="Describe what this service includes..."
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Price ($) *
                </label>
                <input
                  type="number"
                  value={servicePrice}
                  onChange={(e) => setServicePrice(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-transparent focus:outline-none focus:border-primary"
                  placeholder="e.g., 50"
                  min="1"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Category
                </label>
                <select
                  value={serviceCategory}
                  onChange={(e) => setServiceCategory(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-transparent focus:outline-none focus:border-primary"
                >
                  <option value="cleaning">Cleaning</option>
                  <option value="repairs">Repairs</option>
                  <option value="electrical">Electrical</option>
                  <option value="plumbing">Plumbing</option>
                  <option value="painting">Painting</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => { setShowServiceForm(false); resetServiceForm(); }}
                className="flex-1 py-3 text-slate-600 font-medium hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={editingService ? handleUpdateService : handleAddService}
                disabled={savingService || !serviceName.trim() || !servicePrice}
                className="flex-1 py-3 bg-primary text-white font-bold rounded-xl hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {savingService && <FiLoader className="animate-spin" />}
                {editingService ? 'Update' : 'Add'} Service
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rating Modal */}
      <RatingModal
        isOpen={showRatingModal}
        onClose={() => {
          setShowRatingModal(false);
          setSelectedBooking(null);
          setEditingReview(false);
        }}
        provider={provider}
        booking={selectedBooking}
        existingReview={editingReview ? userReview : null}
        onReviewSubmitted={handleReviewSubmitted}
      />
    </div>
  );
}
