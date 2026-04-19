import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { 
  FiArrowLeft, FiSearch, FiX, FiStar, FiMapPin, FiCheck, FiCheckCircle,
  FiBriefcase, FiClock
} from 'react-icons/fi';

const StarRating = ({ rating, count }) => {
  const roundedRating = Math.round(rating || 0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <span 
          key={star} 
          style={{ 
            color: star <= roundedRating ? '#f59e0b' : '#d1d5db',
            fontSize: '14px'
          }}
        >
          ★
        </span>
      ))}
      <span className="text-xs text-slate-500 ml-1">
        {rating > 0 ? rating.toFixed(1) : 'New'}
        {count > 0 && ` (${count})`}
      </span>
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
  if (responseTime && responseTime !== '< 1h') return responseTime;
  return '< 1h';
};

export default function SearchScreen({ isDesktop }) {
  const { q } = useParams();
  const navigate = useNavigate();
  const [providers, setProviders] = useState([]);
  const [professions, setProfessions] = useState([]);
  const [searchQuery, setSearchQuery] = useState(q || '');
  const [selectedProfession, setSelectedProfession] = useState('');
  const [sortBy, setSortBy] = useState('rating');
  const [loading, setLoading] = useState(true);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);

  const filters = [
    { value: 'rating', label: 'Top Rated' },
    { value: 'price_low', label: 'Price: Low to High' },
    { value: 'price_high', label: 'Price: High to Low' },
  ];

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const loadData = async () => {
      const [professionsData] = await Promise.all([api.getProfessions()]);
      setProfessions(professionsData || []);
    };
    loadData();
  }, []);

  useEffect(() => {
    const fetchProviders = async () => {
      setLoading(true);
      try {
        console.log('[SearchScreen] Fetching providers with filters:', {
          profession: selectedProfession,
          search: debouncedSearchQuery,
          sort: sortBy
        });
        
        const data = await api.getProviders({
          profession: selectedProfession,
          search: debouncedSearchQuery,
          sort: sortBy,
        });
        
        const providersList = Array.isArray(data) ? data : (data?.data || []);
        setProviders(providersList);
        console.log('[SearchScreen] Providers fetched:', providersList.length);
      } catch (error) {
        console.error('Error fetching providers:', error);
        setProviders([]);
      }
      setLoading(false);
    };
    fetchProviders();
  }, [selectedProfession, debouncedSearchQuery, sortBy]);

  const getProviderLocation = (provider) => {
    if (provider.location) {
      if (typeof provider.location === 'string') {
        if (provider.location !== '10km radius' && provider.location !== '10km' && provider.location !== 'New York, NY') {
          return provider.location;
        }
      }
      if (provider.location.city) {
        return `${provider.location.city}, Maroc`;
      }
      if (provider.location.name && provider.location.name !== '10km radius') {
        return `${provider.location.name}, Maroc`;
      }
    }
    if (provider.city) {
      return `${provider.city}, Maroc`;
    }
    if (provider.serviceArea && !provider.serviceArea.includes('km')) {
      return provider.serviceArea;
    }
    return 'Maroc';
  };

  const ProviderCard = ({ provider }) => {
    const location = getProviderLocation(provider);
    const avatarUrl = provider.avatar?.startsWith('http') 
      ? provider.avatar 
      : provider.avatar 
        ? window.location.origin + provider.avatar 
        : null;

    return (
      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 flex flex-col gap-4">
        <div className="flex items-start gap-4">
          <Link to={`/provider/${provider.id}`} className="shrink-0">
            {avatarUrl ? (
              <img 
                src={avatarUrl} 
                alt={provider.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-slate-200"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center border-2 border-slate-200">
                <span className="text-2xl font-bold text-blue-600">
                  {provider.name?.charAt(0)?.toUpperCase() || '?'}
                </span>
              </div>
            )}
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link to={`/provider/${provider.id}`}>
                <h3 className="text-slate-900 text-base font-bold hover:text-blue-600 transition-colors">
                  {provider.name}
                </h3>
              </Link>
              {provider.verified && (
                <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 text-[10px] font-medium px-2 py-0.5 rounded-full">
                  <FiCheckCircle style={{ fontSize: '10px' }} />
                  Pro Vérifié
                </span>
              )}
            </div>
            <p className="text-slate-500 text-sm mt-0.5">{provider.profession}</p>
            <div className="flex items-center gap-1 text-slate-400 text-xs mt-1">
              <FiMapPin style={{ fontSize: '12px' }} />
              <span>{location}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-around py-3 border-y border-slate-100">
          <div className="flex flex-col items-center text-center">
            <StarRating rating={provider.rating || 0} count={provider.reviewCount || 0} />
            <span className="text-[10px] text-slate-400 mt-0.5">Rating</span>
          </div>
          <div className="w-px h-8 bg-slate-200"></div>
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center gap-1 text-slate-700">
              <FiBriefcase style={{ fontSize: '14px' }} />
              <span className="font-bold text-sm">{provider.jobsDone || 0}</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5">Jobs Done</span>
          </div>
          <div className="w-px h-8 bg-slate-200"></div>
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center gap-1 text-slate-700">
              <FiClock style={{ fontSize: '14px' }} />
              <span className="font-bold text-sm">{getResponseTimeDisplay(provider.responseTime)}</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5">Response</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-blue-600">{provider.hourlyRate || 0}</span>
            <span className="text-xs text-slate-500">MAD/hr</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/messages/${provider.id}`)}
              className="bg-white border border-blue-600 text-blue-600 hover:bg-blue-50 text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-sm"
            >
              Message
            </button>
            <button
              onClick={() => navigate(`/book/${provider.id}`)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-sm"
            >
              Book
            </button>
          </div>
        </div>
      </div>
    );
  };

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
        <FiSearch style={{ fontSize: '40px' }} className="text-slate-300" />
      </div>
      <h3 className="text-lg font-bold text-slate-700 mb-2">No professionals found</h3>
      <p className="text-sm text-slate-500 max-w-xs">
        Try adjusting your search or filters to find what you're looking for
      </p>
      <button 
        onClick={() => { setSearchQuery(''); setSelectedProfession(''); }}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
      >
        Clear Filters
      </button>
    </div>
  );

  if (!isDesktop) {
    return (
      <div className="relative flex h-full min-h-screen w-full flex-col overflow-hidden max-w-md mx-auto bg-slate-50">
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-sm pb-2">
          <div className="flex items-center gap-3 p-4">
            <button 
              onClick={() => navigate(-1)}
              className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-slate-100 transition-colors text-slate-900"
            >
              <FiArrowLeft className="text-[24px]" />
            </button>
            <div className="flex flex-1 items-center h-10 bg-slate-100 rounded-lg px-3 gap-2 group focus-within:ring-2 focus-within:ring-blue-500/50 transition-all">
              <FiSearch className="text-slate-400 text-[20px]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent border-none p-0 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:ring-0"
                placeholder="Search professionals..."
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-slate-400">
                  <FiX className="text-[18px]" />
                </button>
              )}
            </div>
          </div>

          <div className="flex gap-2 px-4 overflow-x-auto no-scrollbar pb-2">
            <button
              onClick={() => setSelectedProfession('')}
              className={`flex h-8 shrink-0 items-center justify-center rounded-full px-4 transition-colors ${
                selectedProfession === ''
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-700'
              }`}
            >
              <span className="text-xs font-semibold whitespace-nowrap">All</span>
            </button>
            {professions.map((prof) => (
              <button
                key={prof._id}
                onClick={() => setSelectedProfession(prof.name)}
                className={`flex h-8 shrink-0 items-center justify-center rounded-full px-4 transition-colors ${
                  selectedProfession === prof.name
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-700'
                }`}
              >
                <span className="text-xs font-semibold whitespace-nowrap">{prof.name}</span>
              </button>
            ))}
          </div>
        </header>

        <main className="flex-1 flex flex-col gap-4 p-4 pb-24 overflow-y-auto">
          <div className="flex items-center justify-between px-1">
            <p className="text-sm font-semibold text-slate-500">{providers.length} Professionals found</p>
          </div>

          {loading ? (
            <div className="animate-pulse bg-white rounded-xl p-5 shadow-sm border border-slate-200">
              <div className="flex items-start gap-4">
                <div className="shrink-0 bg-slate-200 rounded-full size-16"></div>
                <div className="flex flex-1 flex-col gap-2">
                  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ) : providers.length === 0 ? (
            <EmptyState />
          ) : (
            providers.map((provider) => (
              <ProviderCard key={provider.id} provider={provider} />
            ))
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6 bg-slate-50 min-h-[calc(100vh-64px)]">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-xl">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            <FiSearch />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 pl-12 pr-4 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-slate-900 placeholder:text-slate-400 transition-all"
            placeholder="Search professionals by name..."
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')} 
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <FiX />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex gap-2 overflow-x-auto">
          <button
            onClick={() => setSelectedProfession('')}
            className={`flex h-9 shrink-0 items-center justify-center rounded-lg px-4 transition-colors ${
              selectedProfession === ''
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span className="text-sm font-medium whitespace-nowrap">All Professions</span>
          </button>
          {professions.map((prof) => (
            <button
              key={prof._id}
              onClick={() => setSelectedProfession(prof.name)}
              className={`flex h-9 shrink-0 items-center justify-center rounded-lg px-4 transition-colors ${
                selectedProfession === prof.name
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className="text-sm font-medium whitespace-nowrap">{prof.name}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <span className="text-sm text-slate-500 font-medium">Sort:</span>
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setSortBy(f.value)}
              className={`flex h-9 shrink-0 items-center justify-center rounded-lg px-4 transition-all ${
                sortBy === f.value
                  ? 'bg-blue-600 text-white shadow-md border-2 border-blue-600 font-semibold ring-2 ring-blue-600/30'
                  : 'bg-white border-2 border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              <span className="text-sm font-medium whitespace-nowrap">{f.label}</span>
              {sortBy === f.value && <FiCheck style={{ fontSize: '14px' }} className="ml-1.5" />}
            </button>
          ))}
        </div>
      </div>

      <p className="text-sm font-semibold text-slate-500">{providers.length} Professionals found</p>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-white rounded-xl p-5 shadow-sm border border-slate-200">
              <div className="flex items-start gap-4">
                <div className="shrink-0 bg-slate-200 rounded-full size-16"></div>
                <div className="flex flex-1 flex-col gap-2">
                  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : providers.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200">
          <EmptyState />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {providers.map((provider) => (
            <ProviderCard key={provider.id} provider={provider} />
          ))}
        </div>
      )}
    </div>
  );
}
