import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';

const banner = {
  badge: 'New Offer',
  title: '20% Off Home Cleaning',
  desc: 'Valid until this Friday. Book now!',
};

export default function HomeScreen({ isDesktop }) {
  const [user, setUser] = useState(null);
  const [categories, setCategories] = useState([]);
  const [providers, setProviders] = useState([]);
  const [posts, setPosts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(storedUser);

    const fetchData = async () => {
      const [professionsData, provs, postsData] = await Promise.all([
        api.getProfessions(),
        api.getProviders({ sort: 'rating' }),
        api.getPosts(),
      ]);
      setCategories(professionsData);
      setProviders(provs.slice(0, 6));
      setPosts(postsData);
    };
    fetchData();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleLikePost = async (postId) => {
    const res = await api.likePost(postId);
    if (res.success) {
      setPosts(posts.map(p => p.id === postId ? { ...p, likes: res.likes } : p));
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (!isDesktop) {
    return (
      <div className="relative flex h-full min-h-screen w-full flex-col overflow-x-hidden pb-24 max-w-md mx-auto bg-background-light dark:bg-background-dark">
        <header className="flex flex-col gap-4 p-5 pt-8 bg-background-light dark:bg-background-dark sticky top-0 z-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="bg-center bg-no-repeat bg-cover rounded-full size-12 border-2 border-white dark:border-slate-700 shadow-sm"
                style={{ backgroundImage: user?.avatar ? `url("${user.avatar}")` : undefined }}
              >
                {!user?.avatar && (
                  <div className="w-full h-full rounded-full bg-slate-300 flex items-center justify-center">
                    <span className="text-sm font-bold text-slate-500">
                      {user?.name ? user.name.charAt(0).toUpperCase() : '?'}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-slate-500 dark:text-slate-400 text-xs font-medium">Good Morning 👋</span>
                <h2 className="text-slate-900 dark:text-white text-lg font-bold leading-tight">{user?.name || 'Guest'}</h2>
              </div>
            </div>
            <button className="relative flex items-center justify-center size-10 rounded-full bg-white dark:bg-surface-dark shadow-card border border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-200">
              <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>notifications</span>
              <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full border border-white dark:border-surface-dark"></span>
            </button>
          </div>

          <div className="flex items-center">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors">
              <span className="material-symbols-outlined text-primary" style={{ fontSize: '18px' }}>location_on</span>
              <span className="text-primary text-sm font-semibold">Downtown, NY</span>
              <span className="material-symbols-outlined text-primary" style={{ fontSize: '18px' }}>expand_more</span>
            </button>
          </div>

          <form onSubmit={handleSearch} className="mt-1">
            <div className="flex w-full items-stretch gap-3 h-12">
              <div className="relative flex-1 group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none">
                  <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>search</span>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-full pl-12 pr-4 rounded-xl bg-white dark:bg-surface-dark border-none shadow-card text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-primary/50 text-base"
                  placeholder="What service do you need?"
                />
              </div>
              <button type="submit" className="flex items-center justify-center aspect-square h-full bg-primary text-white rounded-xl shadow-lg shadow-primary/30 active:scale-95 transition-transform">
                <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>tune</span>
              </button>
            </div>
          </form>
        </header>

        <main className="flex flex-col gap-6 px-5 pb-4">
          <div className="w-full rounded-2xl bg-gradient-to-r from-primary to-blue-400 p-5 shadow-lg relative overflow-hidden text-white mt-2">
            <div className="absolute -right-10 -top-10 size-40 rounded-full bg-white/10 blur-2xl"></div>
            <div className="absolute -left-10 -bottom-10 size-32 rounded-full bg-white/10 blur-xl"></div>
            <div className="relative z-10 flex flex-col items-start gap-3">
              <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">{banner.badge}</span>
              <div className="space-y-1">
                <h3 className="text-xl font-bold">{banner.title}</h3>
                <p className="text-blue-50 text-sm opacity-90">{banner.desc}</p>
              </div>
              <button className="mt-1 px-4 py-2 bg-white text-primary text-xs font-bold rounded-lg shadow-sm">Claim Offer</button>
            </div>
          </div>

          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-slate-900 dark:text-white text-lg font-bold">Explore Categories</h2>
              <a className="text-primary text-sm font-medium" href="#">See All</a>
            </div>
            <div className="grid grid-cols-4 gap-x-4 gap-y-6">
              {categories.map((cat) => (
                <button key={cat.id} className="flex flex-col items-center gap-2 group" onClick={() => navigate(`/search?q=${cat.name}`)}>
                  <div className={`size-14 rounded-2xl flex items-center justify-center shadow-sm transition-colors ${cat.color} group-hover:bg-primary group-hover:text-white`}>
                    <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>{cat.icon}</span>
                  </div>
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300 text-center">{cat.name}</span>
                </button>
              ))}
            </div>
          </section>

          {posts.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-slate-900 dark:text-white text-lg font-bold">Latest Updates</h2>
              </div>
              <div className="space-y-4">
                {posts.slice(0, 2).map((post) => (
                  <div key={post.id} className="bg-white dark:bg-surface-dark rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-cover bg-center" style={{ backgroundImage: `url("${post.authorAvatar}")` }} />
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white text-sm">{post.authorName}</p>
                        <p className="text-xs text-slate-500">{formatDate(post.createdAt)}</p>
                      </div>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 text-sm mb-2">{post.content}</p>
                    {post.image && (
                      <div className="w-full h-40 rounded-lg bg-cover bg-center mb-2" style={{ backgroundImage: `url("${post.image}")` }} />
                    )}
                    <div className="flex items-center gap-4">
                      <button onClick={() => handleLikePost(post.id)} className="flex items-center gap-1 text-slate-500 text-sm">
                        <span className="material-symbols-outlined text-[18px]">favorite</span>
                        {post.likes}
                      </button>
                      <button className="flex items-center gap-1 text-slate-500 text-sm">
                        <span className="material-symbols-outlined text-[18px]">chat_bubble</span>
                        {post.comments}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-slate-900 dark:text-white text-lg font-bold">Popular Near You</h2>
              <button className="text-slate-400 dark:text-slate-500 hover:text-primary transition-colors">
                <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>filter_list</span>
              </button>
            </div>
            <div className="flex flex-col gap-4">
              {providers.slice(0, 3).map((provider) => (
                <Link
                  key={provider.id}
                  to={`/provider/${provider.id}`}
                  className="flex gap-4 p-4 rounded-2xl bg-white dark:bg-surface-dark shadow-card border border-transparent dark:border-slate-800"
                >
                  <div
                    className="shrink-0 size-20 rounded-xl bg-center bg-cover bg-no-repeat"
                    style={{ backgroundImage: provider.avatar ? `url("${provider.avatar}")` : undefined }}
                  >
                    {!provider.avatar && (
                      <div className="w-full h-full rounded-xl bg-slate-300 flex items-center justify-center">
                        <span className="text-xl font-bold text-slate-500">
                          {provider.name ? provider.name.charAt(0).toUpperCase() : '?'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-slate-900 dark:text-white">{provider.name}</h3>
                        <div className="flex items-center gap-1 bg-yellow-100 dark:bg-yellow-900/30 px-1.5 py-0.5 rounded text-xs font-bold text-yellow-700 dark:text-yellow-500">
                          <span className="material-symbols-outlined text-[14px]">star</span>
                          {provider.rating}
                        </div>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 text-sm">{provider.profession}</p>
                    </div>
                    <div className="flex items-end justify-between mt-2">
                      <div className="flex items-center gap-1 text-slate-400 dark:text-slate-500 text-xs">
                        <span className="material-symbols-outlined text-[14px]">location_on</span>
                        {provider.distance} km
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-primary">${provider.hourlyRate}<span className="text-xs font-normal text-slate-400 dark:text-slate-500">/hr</span></span>
                        <button className="bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">Book</button>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </main>

        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-surface-dark/80 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 pb-safe pt-2 max-w-md mx-auto">
          <div className="flex items-center justify-around h-16">
            <button className="flex flex-col items-center gap-1 text-primary w-16" onClick={() => navigate('/home')}>
              <span className="material-symbols-outlined filled" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
              <span className="text-[10px] font-bold">Home</span>
            </button>
            <button className="flex flex-col items-center gap-1 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 w-16">
              <span className="material-symbols-outlined">search</span>
              <span className="text-[10px] font-medium">Search</span>
            </button>
            <button className="flex flex-col items-center gap-1 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 w-16">
              <span className="material-symbols-outlined">chat_bubble</span>
              <span className="text-[10px] font-medium">Messages</span>
            </button>
            <button className="flex flex-col items-center gap-1 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 w-16">
              <span className="material-symbols-outlined">person</span>
              <span className="text-[10px] font-medium">Profile</span>
            </button>
          </div>
          <div className="h-5 w-full"></div>
        </nav>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="w-full rounded-2xl bg-gradient-to-r from-primary to-blue-400 p-6 shadow-lg relative overflow-hidden text-white">
        <div className="absolute -right-10 -top-10 size-40 rounded-full bg-white/10 blur-2xl"></div>
        <div className="absolute -left-10 -bottom-10 size-32 rounded-full bg-white/10 blur-xl"></div>
        <div className="relative z-10 flex flex-col items-start gap-3">
          <span className="bg-white/20 px-3 py-1 rounded text-xs font-bold uppercase tracking-wider">{banner.badge}</span>
          <div className="space-y-1">
            <h3 className="text-2xl font-bold">{banner.title}</h3>
            <p className="text-blue-50 text-sm opacity-90">{banner.desc}</p>
          </div>
          <button className="mt-2 px-5 py-2.5 bg-white text-primary text-sm font-bold rounded-lg shadow-sm hover:bg-blue-50 transition-colors">Claim Offer</button>
        </div>
      </div>

      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-slate-900 text-xl font-bold">Explore Categories</h2>
          <button className="text-primary text-sm font-medium hover:underline">See All</button>
        </div>
        <div className="grid grid-cols-4 xl:grid-cols-8 gap-4">
          {categories.map((cat) => (
            <button key={cat.id} className="flex flex-col items-center gap-3 group p-4 rounded-xl hover:bg-slate-50 transition-colors" onClick={() => navigate(`/search?q=${cat.name}`)}>
              <div className={`size-16 rounded-2xl flex items-center justify-center shadow-sm transition-colors ${cat.color} group-hover:bg-primary group-hover:text-white`}>
                <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>{cat.icon}</span>
              </div>
              <span className="text-sm font-medium text-slate-700 text-center">{cat.name}</span>
            </button>
          ))}
        </div>
      </section>

      {posts.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-slate-900 text-xl font-bold">Latest Updates</h2>
            <button className="text-primary text-sm font-medium hover:underline">View All</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {posts.map((post) => (
              <div key={post.id} className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-cover bg-center" style={{ backgroundImage: `url("${post.authorAvatar}")` }} />
                  <div>
                    <p className="font-semibold text-slate-900">{post.authorName}</p>
                    <p className="text-xs text-slate-500">{formatDate(post.createdAt)}</p>
                  </div>
                  <span className={`ml-auto px-2 py-0.5 rounded text-xs font-medium ${
                    post.type === 'promo' ? 'bg-green-100 text-green-700' :
                    post.type === 'tip' ? 'bg-blue-100 text-blue-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {post.type === 'promo' ? 'Promotion' : post.type === 'tip' ? 'Tip' : 'Post'}
                  </span>
                </div>
                <p className="text-slate-700 text-sm mb-3">{post.content}</p>
                {post.image && (
                  <div className="w-full h-48 rounded-lg bg-cover bg-center mb-3" style={{ backgroundImage: `url("${post.image}")` }} />
                )}
                <div className="flex items-center gap-4 pt-3 border-t border-slate-100">
                  <button onClick={() => handleLikePost(post.id)} className="flex items-center gap-1.5 text-slate-500 hover:text-red-500 text-sm transition-colors">
                    <span className="material-symbols-outlined text-[20px]">favorite</span>
                    {post.likes}
                  </button>
                  <button className="flex items-center gap-1.5 text-slate-500 hover:text-primary text-sm transition-colors">
                    <span className="material-symbols-outlined text-[20px]">chat_bubble</span>
                    {post.comments} Comments
                  </button>
                  <button className="flex items-center gap-1.5 text-slate-500 hover:text-primary text-sm transition-colors ml-auto">
                    <span className="material-symbols-outlined text-[20px]">share</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-slate-900 text-xl font-bold">Popular Near You</h2>
          <button className="text-slate-400 hover:text-primary transition-colors">
            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>filter_list</span>
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {providers.slice(0, 6).map((provider) => (
            <Link
              key={provider.id}
              to={`/provider/${provider.id}`}
              className="flex gap-4 p-5 rounded-2xl bg-white shadow-sm border border-slate-200 hover:shadow-md hover:border-primary/30 transition-all"
            >
              <div
                className="shrink-0 size-20 rounded-xl bg-center bg-cover bg-no-repeat"
                style={{ backgroundImage: provider.avatar ? `url("${provider.avatar}")` : undefined }}
              >
                {!provider.avatar && (
                  <div className="w-full h-full rounded-xl bg-slate-300 flex items-center justify-center">
                    <span className="text-xl font-bold text-slate-500">
                      {provider.name ? provider.name.charAt(0).toUpperCase() : '?'}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-slate-900">{provider.name}</h3>
                    <div className="flex items-center gap-1 bg-yellow-100 px-1.5 py-0.5 rounded text-xs font-bold text-yellow-700">
                      <span className="material-symbols-outlined text-[14px]">star</span>
                      {provider.rating}
                    </div>
                  </div>
                  <p className="text-slate-500 text-sm mt-1">{provider.profession}</p>
                </div>
                <div className="flex items-end justify-between mt-3">
                  <div className="flex items-center gap-1 text-slate-400 text-xs">
                    <span className="material-symbols-outlined text-[14px]">location_on</span>
                    {provider.distance} km
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-primary">${provider.hourlyRate}<span className="text-xs font-normal text-slate-400">/hr</span></span>
                    <button className="bg-primary hover:bg-primary/90 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors">Book</button>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
