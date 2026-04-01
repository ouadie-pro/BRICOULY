import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { 
  FiArrowLeft, FiSearch, FiX, FiStar, FiMapPin, FiCheck, FiFilter, FiCheckCircle
} from 'react-icons/fi';

export default function SearchScreen({ isDesktop }) {
  const { q } = useParams();
  const [providers, setProviders] = useState([]);
  const [professions, setProfessions] = useState([]);
  const [searchQuery, setSearchQuery] = useState(q || '');
  const [selectedProfession, setSelectedProfession] = useState('');
  const [sortBy, setSortBy] = useState('rating');
  const [distanceFilter, setDistanceFilter] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const distanceOptions = [
    { value: '', label: 'Any distance' },
    { value: '5', label: 'Within 5 km' },
    { value: '10', label: 'Within 10 km' },
    { value: '20', label: 'Within 20 km' },
    { value: '50', label: 'Within 50 km' },
  ];

  const availabilityOptions = [
    { value: '', label: 'Any time' },
    { value: 'today', label: 'Available today' },
    { value: 'week', label: 'This week' },
  ];

  useEffect(() => {
    const loadData = async () => {
      const [professionsData] = await Promise.all([api.getProfessions()]);
      setProfessions(professionsData);
    };
    loadData();
  }, []);

  useEffect(() => {
    const fetchProviders = async () => {
      setLoading(true);
      const data = await api.getProviders({
        profession: selectedProfession,
        search: searchQuery,
        sort: sortBy,
      });
      setProviders(data);
      setLoading(false);
    };
    fetchProviders();
  }, [searchQuery, selectedProfession, sortBy]);

  const filters = [
    { value: 'rating', label: 'Top Rated' },
    { value: 'price_low', label: 'Price: Low to High' },
    { value: 'price_high', label: 'Price: High to Low' },
  ];

  if (!isDesktop) {
    return (
      <div className="relative flex h-full min-h-screen w-full flex-col overflow-hidden max-w-md mx-auto bg-background-light dark:bg-background-dark">
        <header className="sticky top-0 z-50 bg-white/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 pb-2">
          <div className="flex items-center gap-3 p-4">
            <button 
              onClick={() => navigate(-1)}
              className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-900 dark:text-white"
            >
              <FiArrowLeft className="text-[24px]" />
            </button>
            <div className="flex flex-1 items-center h-10 bg-slate-100 dark:bg-surface-dark rounded-lg px-3 gap-2 group focus-within:ring-2 focus-within:ring-primary/50 transition-all">
              <FiSearch className="text-slate-400 dark:text-slate-500 text-[20px]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent border-none p-0 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-0"
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
                  ? 'bg-primary text-white'
                  : 'bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700'
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
                    ? 'bg-primary text-white'
                    : 'bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700'
                }`}
              >
                <span className="text-xs font-semibold whitespace-nowrap">{prof.name}</span>
              </button>
            ))}
          </div>
        </header>

        <main className="flex-1 flex flex-col gap-4 p-4 pb-24 overflow-y-auto">
          <div className="flex items-center justify-between px-1">
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{providers.length} Professionals found</p>
          </div>

          {providers.map((provider) => (
            <div key={provider.id} className="bg-white dark:bg-surface-dark rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-700/50 flex flex-col gap-3">
              <Link to={`/provider/${provider.id}`} className="flex items-start gap-4">
                <div className="relative shrink-0">
                  {provider.avatar ? (
                    <div
                      className="bg-center bg-no-repeat bg-cover rounded-lg size-[72px]"
                      style={{ backgroundImage: `url("${provider.avatar}")` }}
                    />
                  ) : (
                    <div className="bg-slate-300 rounded-lg size-[72px] flex items-center justify-center">
                      <span className="text-2xl font-bold text-slate-500">
                        {provider.name ? provider.name.charAt(0).toUpperCase() : '?'}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col">
                    <div className="flex justify-between items-start">
                    <h3 className="text-slate-900 dark:text-white text-base font-bold leading-tight">{provider.name}</h3>
                    {provider.rating > 0 ? (
                      <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-900/30 px-1.5 py-0.5 rounded text-amber-700 dark:text-amber-400">
                        <FiStar className="text-[14px] text-amber-500" />
                        <span className="text-xs font-bold">{provider.rating}</span>
                        {provider.reviewCount > 0 && (
                          <span className="text-[10px] text-amber-600/70">({provider.reviewCount})</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">New</span>
                    )}
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mt-1">{provider.profession}</p>
                </div>
              </Link>
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/50 mt-1">
                <p className="text-slate-900 dark:text-white font-bold text-sm">${provider.hourlyRate}<span className="text-slate-400 font-normal text-xs">/hr</span></p>
                <button className="bg-primary hover:bg-primary/90 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors shadow-sm shadow-primary/30">
                  View Profile
                </button>
              </div>
            </div>
          ))}

          {loading && (
            <div className="animate-pulse bg-white dark:bg-surface-dark rounded-xl p-4 shadow-sm border border-slate-100">
              <div className="flex items-start gap-4">
                <div className="shrink-0 bg-slate-200 rounded-lg size-[72px]"></div>
                <div className="flex flex-1 flex-col gap-2">
                  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-xl">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            <FiSearch />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 pl-12 pr-4 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-primary/30 focus:border-primary text-slate-900 placeholder:text-slate-400"
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
                ? 'bg-primary text-white'
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
                  ? 'bg-primary text-white'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className="text-sm font-medium whitespace-nowrap">{prof.name}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex h-9 items-center justify-center rounded-lg px-3 transition-colors ${
              showFilters || distanceFilter || availabilityFilter ? 'bg-primary text-white border-2 border-primary' : 'bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <FiFilter style={{ fontSize: '16px' }} />
            <span className="ml-1 text-sm font-medium">Filters</span>
          </button>
          <span className="text-sm text-slate-500 font-medium">Sort:</span>
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setSortBy(f.value)}
              className={`flex h-9 shrink-0 items-center justify-center rounded-lg px-4 transition-all ${
                sortBy === f.value
                  ? 'bg-primary text-white shadow-md border-2 border-primary font-semibold ring-2 ring-primary/30'
                  : 'bg-white border-2 border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              <span className="text-sm font-medium whitespace-nowrap">{f.label}</span>
              {sortBy === f.value && <FiCheck style={{ fontSize: '14px' }} className="ml-1.5" />}
            </button>
          ))}
        </div>
      </div>

      {showFilters && (
        <div className="flex flex-wrap items-center gap-4 p-4 bg-slate-50 rounded-xl">
          <div>
            <label className="text-xs text-slate-500 block mb-1">Distance</label>
            <select
              value={distanceFilter}
              onChange={(e) => setDistanceFilter(e.target.value)}
              className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {distanceOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1">Availability</label>
            <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value)}
              className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {availabilityOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      <p className="text-sm font-semibold text-slate-500">{providers.length} Professionals found</p>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {providers.map((provider) => (
          <div key={provider.id} className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 hover:shadow-md hover:border-primary/30 transition-all flex flex-col gap-3">
            <Link to={`/provider/${provider.id}`} className="flex items-start gap-4">
              <div className="relative shrink-0">
                {provider.avatar ? (
                  <div
                    className="bg-center bg-no-repeat bg-cover rounded-xl size-20"
                    style={{ backgroundImage: `url("${provider.avatar}")` }}
                  />
                ) : (
                  <div className="bg-slate-300 rounded-xl size-20 flex items-center justify-center">
                    <span className="text-2xl font-bold text-slate-500">
                      {provider.name ? provider.name.charAt(0).toUpperCase() : '?'}
                    </span>
                  </div>
                )}
                {provider.verified && (
                  <div className="absolute -bottom-1 -right-1 bg-primary text-white rounded-full p-0.5">
                    <FiCheckCircle className="text-[12px]" />
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col">
                <div className="flex justify-between items-start">
                  <h3 className="text-slate-900 text-base font-bold">{provider.name}</h3>
                </div>
                <p className="text-slate-500 text-sm">{provider.profession}</p>
                <div className="flex items-center gap-1 text-slate-400 text-xs mt-1">
                  <FiMapPin className="text-[14px]" />
                  {provider.location || 'NYC Area'}
                </div>
              </div>
            </Link>
            
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2">
                {provider.rating > 0 ? (
                  <div className="flex items-center gap-1 bg-amber-50 px-1.5 py-0.5 rounded text-amber-700">
                    <FiStar className="text-[14px]" />
                    <span className="text-xs font-bold">{provider.rating}</span>
                    {provider.reviewCount > 0 && (
                      <span className="text-[10px] text-amber-600/70">({provider.reviewCount})</span>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 italic">New provider</span>
                )}
                {provider.jobsDone > 0 && (
                  <span className="text-slate-400 text-xs">• {provider.jobsDone} jobs</span>
                )}
              </div>
              <p className="text-slate-900 font-bold text-lg">${provider.hourlyRate}<span className="text-slate-400 font-normal text-sm">/hr</span></p>
            </div>
            <Link 
              to={`/provider/${provider.id}`} 
              className="w-full text-center bg-primary hover:bg-primary/90 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
            >
              View Profile
            </Link>
          </div>
        ))}
      </div>

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-white rounded-xl p-5 shadow-sm border border-slate-200">
              <div className="flex items-start gap-4">
                <div className="shrink-0 bg-slate-200 rounded-xl size-20"></div>
                <div className="flex flex-1 flex-col gap-2">
                  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
