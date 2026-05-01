// frontend/src/components/SearchScreen.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { 
  FiArrowLeft, FiSearch, FiX, FiStar, FiMapPin, FiCheck, FiCheckCircle,
  FiBriefcase, FiClock, FiFilter, FiSliders, FiAlertCircle, FiLoader,
  FiDollarSign, FiTrendingUp, FiAward, FiRefreshCw, FiMessageCircle,
  FiCalendar, FiUser, FiHeart, FiShare2
} from 'react-icons/fi';

// Sort options with weights for scoring
const SORT_OPTIONS = [
  { value: 'recommended', label: 'Recommended', icon: FiTrendingUp, weight: { rating: 25, jobs: 30, reviews: 15, verified: 20, response: 10 } },
  { value: 'rating', label: 'Top Rated', icon: FiAward, weight: { rating: 60, reviews: 20, jobs: 20 } },
  { value: 'jobs', label: 'Most Experienced', icon: FiBriefcase, weight: { jobs: 60, rating: 20, reviews: 20 } },
  { value: 'price_low', label: 'Lowest Price', icon: FiDollarSign },
  { value: 'price_high', label: 'Highest Price', icon: FiDollarSign },
];

// Rating component with hover effect
const StarRating = ({ rating, count, size = 'sm', interactive = false, onChange }) => {
  const [hoverRating, setHoverRating] = useState(0);
  const displayRating = interactive ? (hoverRating || rating) : rating;
  const fullStars = Math.floor(displayRating || 0);
  const hasHalfStar = (displayRating || 0) - fullStars >= 0.5;
  
  const starSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };
  
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
            className={`${interactive ? 'cursor-pointer transition-transform hover:scale-110' : 'cursor-default'}`}
          >
            <FiStar
              className={`${starSizes[size]} ${
                star <= fullStars 
                  ? 'text-yellow-400 fill-yellow-400' 
                  : star === fullStars + 1 && hasHalfStar && !interactive 
                    ? 'text-yellow-400' 
                    : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
      {rating > 0 && (
        <span className={`${size === 'sm' ? 'text-xs' : 'text-sm'} font-medium text-gray-700`}>
          {rating.toFixed(1)}
        </span>
      )}
      {count > 0 && (
        <span className={`${size === 'sm' ? 'text-xs' : 'text-sm'} text-gray-500`}>
          ({count})
        </span>
      )}
    </div>
  );
};

// Filter drawer component for mobile
const FilterDrawer = ({ isOpen, onClose, filters, onApply }) => {
  const [localFilters, setLocalFilters] = useState(filters);
  
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters, isOpen]);
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute right-0 top-0 bottom-0 w-80 bg-white shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-bold">Filters</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <FiX className="text-xl" />
          </button>
        </div>
        
        <div className="p-4 space-y-6 overflow-y-auto h-[calc(100%-140px)]">
          {/* Price Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Price Range (MAD/hr)</label>
            <div className="flex gap-3">
              <input
                type="number"
                placeholder="Min"
                value={localFilters.minPrice || ''}
                onChange={(e) => setLocalFilters({ ...localFilters, minPrice: e.target.value ? Number(e.target.value) : null })}
                className="flex-1 p-2 border border-gray-200 rounded-lg"
              />
              <span className="self-center">-</span>
              <input
                type="number"
                placeholder="Max"
                value={localFilters.maxPrice || ''}
                onChange={(e) => setLocalFilters({ ...localFilters, maxPrice: e.target.value ? Number(e.target.value) : null })}
                className="flex-1 p-2 border border-gray-200 rounded-lg"
              />
            </div>
          </div>
          
          {/* Rating Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setLocalFilters({ ...localFilters, minRating: localFilters.minRating === star ? null : star })}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    localFilters.minRating === star
                      ? 'bg-yellow-400 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {star}+
                </button>
              ))}
            </div>
          </div>
          
          {/* Availability */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Availability</label>
            <div className="flex gap-3">
              <button
                onClick={() => setLocalFilters({ ...localFilters, available: localFilters.available === true ? null : true })}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  localFilters.available === true
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                Available Only
              </button>
              <button
                onClick={() => setLocalFilters({ ...localFilters, verified: localFilters.verified === true ? null : true })}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  localFilters.verified === true
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                Verified Only
              </button>
            </div>
          </div>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
          <button
            onClick={() => onApply(localFilters)}
            className="w-full py-3 bg-blue-500 text-white rounded-lg font-medium"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};

// Price range slider component (desktop)
const PriceRangeSlider = ({ min, max, value, onChange }) => {
  const [localMin, setLocalMin] = useState(value?.min || min);
  const [localMax, setLocalMax] = useState(value?.max || max);
  
  useEffect(() => {
    setLocalMin(value?.min || min);
    setLocalMax(value?.max || max);
  }, [value, min, max]);
  
  return (
    <div className="space-y-3">
      <div className="flex justify-between text-sm text-gray-600">
        <span>{localMin} MAD</span>
        <span>{localMax} MAD</span>
      </div>
      <div className="relative h-2 bg-gray-200 rounded-full">
        <div 
          className="absolute h-full bg-blue-500 rounded-full"
          style={{ left: `${((localMin - min) / (max - min)) * 100}%`, right: `${100 - ((localMax - min) / (max - min)) * 100}%` }}
        />
      </div>
      <div className="flex gap-4">
        <input
          type="range"
          min={min}
          max={max}
          value={localMin}
          onChange={(e) => {
            const newMin = Number(e.target.value);
            if (newMin <= localMax) {
              setLocalMin(newMin);
              onChange({ min: newMin, max: localMax });
            }
          }}
          className="flex-1"
        />
        <input
          type="range"
          min={min}
          max={max}
          value={localMax}
          onChange={(e) => {
            const newMax = Number(e.target.value);
            if (newMax >= localMin) {
              setLocalMax(newMax);
              onChange({ min: localMin, max: newMax });
            }
          }}
          className="flex-1"
        />
      </div>
    </div>
  );
};

export default function SearchScreen({ isDesktop }) {
  const { q } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isClient = currentUser.role === 'client';
  
  // State
  const [providers, setProviders] = useState([]);
  const [professions, setProfessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1, limit: 12 });
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState(q || searchParams.get('q') || '');
  const [selectedProfession, setSelectedProfession] = useState(searchParams.get('category') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'recommended');
  const [filters, setFilters] = useState({
    minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : null,
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : null,
    minRating: searchParams.get('minRating') ? Number(searchParams.get('minRating')) : null,
    available: searchParams.get('available') === 'true',
    verified: searchParams.get('verified') === 'true',
  });
  
  // UI state
  const [showFilters, setShowFilters] = useState(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);
  
  // Refs
  const abortControllerRef = useRef(null);
  const prevFiltersRef = useRef({ profession: '', search: '', sort: '', filters: {} });

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      updateURLParams({ q: searchQuery || undefined });
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Update URL params
  const updateURLParams = useCallback((updates) => {
    const params = new URLSearchParams(searchParams);
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== '' && value !== null && value !== undefined) {
        params.set(key, String(value));
      } else {
        params.delete(key);
      }
    });
    
    // Add current filters to URL
    if (selectedProfession) params.set('category', selectedProfession);
    if (sortBy !== 'recommended') params.set('sort', sortBy);
    if (filters.minPrice) params.set('minPrice', filters.minPrice);
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
    if (filters.minRating) params.set('minRating', filters.minRating);
    if (filters.available) params.set('available', 'true');
    if (filters.verified) params.set('verified', 'true');
    if (pagination.page > 1) params.set('page', pagination.page);
    
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', newUrl);
  }, [searchParams, selectedProfession, sortBy, filters, pagination.page]);

  // Load professions
  useEffect(() => {
    const loadProfessions = async () => {
      try {
        const data = await api.getProfessions();
        setProfessions(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error loading professions:', err);
      }
    };
    loadProfessions();
  }, []);

  // Fetch providers with current filters
  const fetchProviders = useCallback(async (page = 1) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    
    setLoading(true);
    setError(null);
    
    try {
      const params = {
        profession: selectedProfession || undefined,
        search: debouncedSearchQuery || undefined,
        sort: sortBy === 'recommended' ? undefined : sortBy,
        page,
        limit: pagination.limit,
      };
      
      // Add filters
      if (filters.minPrice) params.minPrice = filters.minPrice;
      if (filters.maxPrice) params.maxPrice = filters.maxPrice;
      if (filters.minRating) params.minRating = filters.minRating;
      if (filters.available) params.available = true;
      if (filters.verified) params.verified = true;
      
      const data = await api.getProviders(params);
      
      if (abortController.signal.aborted) return;
      
      let providersList = Array.isArray(data) ? data : (data?.data || []);
      const total = data?.pagination?.total || providersList.length;
      const pages = data?.pagination?.pages || Math.ceil(total / pagination.limit);
      
      // Apply client-side filtering for rating (since it's not in API yet)
      if (filters.minRating && providersList.length > 0) {
        providersList = providersList.filter(p => (p.rating || 0) >= filters.minRating);
      }
      
      // Apply custom sorting for 'recommended'
      if (sortBy === 'recommended') {
        providersList = sortProvidersByScore(providersList);
      }
      
      setProviders(providersList);
      setPagination(prev => ({ ...prev, page, total, pages }));
      
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error fetching providers:', err);
        setError('Failed to load providers. Please try again.');
        showToast('Failed to load providers', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [selectedProfession, debouncedSearchQuery, sortBy, filters, pagination.limit, showToast]);

  // Custom scoring for recommended sort
  const sortProvidersByScore = (list) => {
    return [...list].sort((a, b) => {
      const getScore = (p) => {
        let score = 0;
        score += (p.rating || 0) * 25;  // Rating weight
        score += (p.reviewCount || 0) * 2;  // Review count weight
        score += (p.jobsDone || 0) * 3;  // Experience weight
        score += p.verified ? 50 : 0;  // Verified bonus
        score += p.available !== false ? 20 : 0;  // Availability bonus
        score += (p.responseTime === '< 1h' ? 30 : p.responseTime?.includes('h') ? 15 : 0);  // Response time
        return score;
      };
      return getScore(b) - getScore(a);
    });
  };

  // Trigger fetch when filters change
  useEffect(() => {
    const currentFilters = {
      profession: selectedProfession,
      search: debouncedSearchQuery,
      sort: sortBy,
      filters: JSON.stringify(filters)
    };
    const prevFilters = prevFiltersRef.current;
    
    const hasChanged = 
      prevFilters.profession !== currentFilters.profession ||
      prevFilters.search !== currentFilters.search ||
      prevFilters.sort !== currentFilters.sort ||
      prevFilters.filters !== currentFilters.filters;
    
    if (hasChanged) {
      prevFiltersRef.current = currentFilters;
      setPagination(prev => ({ ...prev, page: 1 }));
      fetchProviders(1);
    }
  }, [selectedProfession, debouncedSearchQuery, sortBy, filters, fetchProviders]);

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setPagination(prev => ({ ...prev, page: newPage }));
      fetchProviders(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedProfession('');
    setSortBy('recommended');
    setFilters({
      minPrice: null,
      maxPrice: null,
      minRating: null,
      available: null,
      verified: null,
    });
    setPagination(prev => ({ ...prev, page: 1 }));
    setSearchParams({});
  };

  // Get provider location display
  const getProviderLocation = (provider) => {
    if (provider.city && provider.city !== '10km radius') {
      return `${provider.city}, Morocco`;
    }
    if (provider.location && typeof provider.location === 'string' && 
        provider.location !== '10km radius' && provider.location !== '10km') {
      return provider.location;
    }
    if (provider.serviceArea && !provider.serviceArea.includes('km')) {
      return provider.serviceArea;
    }
    return 'Morocco';
  };

  // Get response time display
  const getResponseTimeDisplay = (responseTime) => {
    if (!responseTime) return '< 1 hour';
    if (responseTime === '< 1h') return '< 1 hour';
    if (responseTime.includes('h')) return responseTime;
    return responseTime;
  };

  // Format phone number
  const formatPhone = (phone) => {
    if (!phone) return null;
    if (phone.startsWith('+')) return phone;
    if (phone.startsWith('0')) return `+212 ${phone.slice(1)}`;
    return phone;
  };

  const ProviderCard = ({ provider, index }) => {
    const [isHovered, setIsHovered] = useState(false);
    const location = getProviderLocation(provider);
    const avatarUrl = provider.avatar?.startsWith('http') 
      ? provider.avatar 
      : provider.avatar 
        ? window.location.origin + provider.avatar 
        : null;
    
    return (
      <div 
        className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300 group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Link to={`/provider/${provider.id}`} className="block">
          <div className="relative">
            {/* Cover/Banner */}
            <div className="h-32 bg-gradient-to-r from-blue-500 to-blue-600 relative">
              {provider.coverImage && (
                <img 
                  src={provider.coverImage} 
                  alt=""
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            
            {/* Avatar */}
            <div className="absolute -bottom-8 left-4">
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt={provider.name}
                  className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center border-4 border-white shadow-md">
                  <span className="text-2xl font-bold text-white">
                    {provider.name?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <div className="p-4 pt-10">
            {/* Name & Verified Badge */}
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-bold text-gray-900 text-lg hover:text-blue-600 transition-colors">
                {provider.name}
              </h3>
              {provider.verified && (
                <FiCheckCircle className="text-blue-500 text-base" title="Verified Professional" />
              )}
            </div>
            
            {/* Profession */}
            <p className="text-gray-600 text-sm mb-2">{provider.profession}</p>
            
            {/* Rating */}
            <div className="mb-3">
              <StarRating rating={provider.rating || 0} count={provider.reviewCount || 0} size="sm" />
            </div>
            
            {/* Stats Row */}
            <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
              <div className="flex items-center gap-1">
                <FiBriefcase className="text-gray-400 text-sm" />
                <span>{provider.jobsDone || 0} jobs</span>
              </div>
              <div className="flex items-center gap-1">
                <FiMapPin className="text-gray-400 text-sm" />
                <span className="truncate max-w-[120px]">{location}</span>
              </div>
              <div className="flex items-center gap-1">
                <FiClock className="text-gray-400 text-sm" />
                <span>{getResponseTimeDisplay(provider.responseTime)}</span>
              </div>
            </div>
            
            {/* Price and CTA */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div>
                <span className="text-xl font-bold text-blue-600">{provider.hourlyRate || 0}</span>
                <span className="text-xs text-gray-500"> MAD/hr</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(`/messages/${provider.id}`);
                  }}
                  className="p-2 text-gray-500 hover:text-blue-500 rounded-lg transition-colors"
                  title="Send message"
                >
                  <FiMessageCircle className="text-lg" />
                </button>
                {isClient && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(`/book/${provider.id}`);
                    }}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                  >
                    Book Now
                  </button>
                )}
              </div>
            </div>
          </div>
        </Link>
      </div>
    );
  };

  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200 animate-pulse">
          <div className="h-32 bg-gray-200" />
          <div className="p-4 pt-10">
            <div className="flex items-center justify-between mb-2">
              <div className="h-5 bg-gray-200 rounded w-32" />
              <div className="w-5 h-5 bg-gray-200 rounded-full" />
            </div>
            <div className="h-4 bg-gray-200 rounded w-24 mb-3" />
            <div className="flex items-center gap-2 mb-3">
              <div className="h-4 bg-gray-200 rounded w-24" />
            </div>
            <div className="flex items-center justify-between mb-4">
              <div className="h-4 bg-gray-200 rounded w-16" />
              <div className="h-4 bg-gray-200 rounded w-20" />
              <div className="h-4 bg-gray-200 rounded w-16" />
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div className="h-6 bg-gray-200 rounded w-20" />
              <div className="h-8 bg-gray-200 rounded w-24" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-xl border border-gray-200">
      <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <FiSearch className="text-4xl text-gray-400" />
      </div>
      <h3 className="text-xl font-bold text-gray-800 mb-2">No professionals found</h3>
      <p className="text-gray-500 max-w-md mb-6">
        We couldn't find any providers matching your criteria. Try adjusting your search or filters.
      </p>
      <button 
        onClick={clearAllFilters}
        className="px-6 py-2.5 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
      >
        Clear All Filters
      </button>
    </div>
  );

  // Mobile Layout
  if (!isDesktop) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
          <div className="flex items-center gap-3 p-3">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 hover:bg-gray-100 rounded-full"
            >
              <FiArrowLeft className="text-xl" />
            </button>
            
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search professionals..."
                className="w-full h-10 pl-10 pr-4 rounded-lg bg-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  <FiX className="text-sm" />
                </button>
              )}
            </div>
            
            <button
              onClick={() => setIsFilterDrawerOpen(true)}
              className="p-2 hover:bg-gray-100 rounded-lg relative"
            >
              <FiFilter className="text-xl" />
              {(filters.minPrice || filters.maxPrice || filters.minRating || filters.available || filters.verified) && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full" />
              )}
            </button>
          </div>
          
          {/* Category chips */}
          <div className="px-3 pb-3 overflow-x-auto flex gap-2 no-scrollbar">
            <button
              onClick={() => setSelectedProfession('')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                !selectedProfession
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              All
            </button>
            {professions.map((prof) => (
              <button
                key={prof._id}
                onClick={() => setSelectedProfession(prof.name)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedProfession === prof.name
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {prof.name}
              </button>
            ))}
          </div>
        </header>
        
        {/* Sort Bar */}
        <div className="sticky top-[97px] z-30 bg-white border-b border-gray-200 px-3 py-2 overflow-x-auto">
          <div className="flex gap-2">
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setSortBy(option.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  sortBy === option.value
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {option.icon && <option.icon className="text-sm" />}
                {option.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Results */}
        <main className="flex-1 p-3 pb-24">
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm text-gray-500">
              {loading ? 'Searching...' : `${pagination.total} professional${pagination.total !== 1 ? 's' : ''} found`}
            </p>
            {!loading && providers.length > 0 && (
              <button onClick={fetchProviders} className="text-blue-500 text-sm">
                <FiRefreshCw className="inline mr-1" /> Refresh
              </button>
            )}
          </div>
          
          {loading ? (
            <LoadingSkeleton />
          ) : error ? (
            <div className="text-center py-12">
              <FiAlertCircle className="text-4xl text-red-400 mx-auto mb-3" />
              <p className="text-gray-600">{error}</p>
              <button 
                onClick={() => fetchProviders()}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg"
              >
                Try Again
              </button>
            </div>
          ) : providers.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <div className="space-y-4">
                {providers.map((provider, idx) => (
                  <ProviderCard key={provider.id} provider={provider} index={idx} />
                ))}
              </div>
              
              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1.5 text-sm text-gray-600">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </main>
        
        {/* Filter Drawer */}
        <FilterDrawer
          isOpen={isFilterDrawerOpen}
          onClose={() => setIsFilterDrawerOpen(false)}
          filters={filters}
          onApply={(newFilters) => {
            setFilters(newFilters);
            setIsFilterDrawerOpen(false);
          }}
        />
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="flex flex-col gap-6 p-6 bg-gray-50 min-h-[calc(100vh-64px)]">
      {/* Search Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-2xl">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search professionals by name, profession, or specialty..."
              className="w-full h-12 pl-12 pr-4 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <FiX />
              </button>
            )}
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              showFilters ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <FiSliders className="text-sm" />
            Filters
            {(filters.minPrice || filters.maxPrice || filters.minRating || filters.available || filters.verified) && (
              <span className="w-2 h-2 bg-blue-500 rounded-full" />
            )}
          </button>
          
          <button
            onClick={clearAllFilters}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            Clear All
          </button>
        </div>
        
        {/* Category Pills */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedProfession('')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
              !selectedProfession
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Categories
          </button>
          {professions.map((prof) => (
            <button
              key={prof._id}
              onClick={() => setSelectedProfession(prof.name)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                selectedProfession === prof.name
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {prof.name}
            </button>
          ))}
        </div>
      </div>
      
      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Hourly Rate (MAD)</label>
              <PriceRangeSlider
                min={0}
                max={500}
                value={{ min: filters.minPrice || 0, max: filters.maxPrice || 500 }}
                onChange={({ min, max }) => setFilters(prev => ({ ...prev, minPrice: min, maxPrice: max }))}
              />
            </div>
            
            {/* Rating Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Minimum Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setFilters(prev => ({ 
                      ...prev, 
                      minRating: prev.minRating === star ? null : star 
                    }))}
                    className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm transition-all ${
                      filters.minRating === star
                        ? 'bg-yellow-400 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <FiStar className="text-sm" />
                    {star}+
                  </button>
                ))}
              </div>
            </div>
            
            {/* Toggle Filters */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Preferences</label>
              <div className="flex gap-3">
                <button
                  onClick={() => setFilters(prev => ({ ...prev, available: prev.available === true ? null : true }))}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filters.available === true
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  Available Now
                </button>
                <button
                  onClick={() => setFilters(prev => ({ ...prev, verified: prev.verified === true ? null : true }))}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filters.verified === true
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  Verified Only
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Sort Bar */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setSortBy(option.value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                sortBy === option.value
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              <option.icon className="text-sm" />
              {option.label}
              {sortBy === option.value && <FiCheck className="text-sm ml-1" />}
            </button>
          ))}
        </div>
        
        <p className="text-sm text-gray-500">
          {loading ? (
            <span className="flex items-center gap-2">
              <FiLoader className="animate-spin" /> Searching...
            </span>
          ) : (
            `${pagination.total} professional${pagination.total !== 1 ? 's' : ''} found`
          )}
        </p>
      </div>
      
      {/* Results Grid */}
      {loading ? (
        <LoadingSkeleton />
      ) : error ? (
        <div className="bg-white rounded-xl p-12 text-center">
          <FiAlertCircle className="text-5xl text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Something went wrong</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <button 
            onClick={() => fetchProviders()}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg"
          >
            Try Again
          </button>
        </div>
      ) : providers.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {providers.map((provider, idx) => (
              <ProviderCard key={provider.id} provider={provider} index={idx} />
            ))}
          </div>
          
          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-center items-center gap-3 mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-4 py-2 rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                Previous
              </button>
              
              <div className="flex gap-2">
                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                  let pageNum;
                  if (pagination.pages <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.page <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.page >= pagination.pages - 2) {
                    pageNum = pagination.pages - 4 + i;
                  } else {
                    pageNum = pagination.page - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                        pagination.page === pageNum
                          ? 'bg-blue-500 text-white'
                          : 'border border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="px-4 py-2 rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}