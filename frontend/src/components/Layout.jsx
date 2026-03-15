import { NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function Layout({ children, user, onLogout }) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [followRequests, setFollowRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const loadNotifications = async () => {
      const [notifData, countData, requestsData] = await Promise.all([
        api.getNotifications(),
        api.getUnreadCount(),
        api.getFollowRequests(),
      ]);
      setNotifications(notifData);
      setUnreadCount(countData.count);
      setFollowRequests(requestsData);
    };
    loadNotifications();

    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkRead = async () => {
    await api.markNotificationsRead();
    setUnreadCount(0);
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  const handleFollowResponse = async (requestId, action) => {
    console.log('requestId:', requestId);
    if (!requestId) {
      alert('Error: request ID is missing');
      return;
    }
    try {
      const res = await api.respondToFollowRequest(String(requestId), action);
      if (res.success) {
        setFollowRequests(prev => prev.filter((r) => String(r._id || r.id) !== String(requestId)));
        const notifData = await api.getNotifications();
        setNotifications(notifData);
      } else {
        alert('Failed: ' + (res.error || 'Unknown error'));
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    setIsSearching(true);
    try {
      const [users, providers] = await Promise.all([
        api.searchUsers(query),
        api.getProviders({ search: query }),
      ]);
      const combinedResults = [
        ...users.map((u) => ({ ...u, type: u.role === 'provider' ? 'provider' : 'client' })),
        ...providers
          .filter((p) => !users.find((u) => String(u.id) === String(p.id)))
          .map((p) => ({ ...p, type: 'provider' })),
      ];
      setSearchResults(combinedResults.slice(0, 6));
      setShowSearchResults(true);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setShowSearchResults(false);
    }
  };

  const handleResultClick = (result) => {
    if (result.type === 'provider') {
      navigate(`/provider/${result.id}`);
    } else {
      navigate(`/user/${result.id}`);
    }
    setShowSearchResults(false);
    setSearchQuery('');
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'message': return 'chat_bubble';
      case 'request': return 'assignment';
      case 'request_update': return 'check_circle';
      case 'follow_request': return 'person_add';
      case 'follow_accepted': return 'people';
      default: return 'notifications';
    }
  };

  // Fixed: messages link goes to /messages (list) instead of hardcoded /messages/1
  const clientNavItems = [
    { path: '/home', icon: 'home', label: 'Home' },
    { path: '/search', icon: 'search', label: 'Search' },
    { path: '/videos', icon: 'play_circle', label: 'Videos' },
    { path: '/requests', icon: 'assignment', label: 'My Requests' },
    { path: '/messages', icon: 'chat_bubble', label: 'Messages' },
    { path: '/profile', icon: 'person', label: 'Profile' },
  ];

  const providerNavItems = [
    { path: '/home', icon: 'home', label: 'Home' },
    { path: '/search', icon: 'search', label: 'Find Work' },
    { path: '/videos', icon: 'play_circle', label: 'Videos' },
    { path: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
    { path: '/messages', icon: 'chat_bubble', label: 'Messages' },
    { path: '/profile', icon: 'person', label: 'Profile' },
  ];

  const navItems = user?.role === 'provider' ? providerNavItems : clientNavItems;

  return (
    <div className="desktop-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white shadow-md shadow-primary/20">
            <span className="material-symbols-outlined text-2xl">handyman</span>
          </div>
          <span className="text-xl font-black tracking-tight text-slate-900">PRUCOLY</span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
                {item.icon}
              </span>
              {item.label}
              {item.label === 'Messages' && unreadCount > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="flex items-center gap-3 mb-3">
            {user?.avatar && user.avatar.length > 0 ? (
              <div
                className="w-10 h-10 rounded-full bg-cover bg-center border-2 border-slate-200"
                style={{
                  backgroundImage: `url("${user.avatar.startsWith('http') ? user.avatar : window.location.origin + user.avatar}")`,
                }}
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-slate-300 border-2 border-slate-200 flex items-center justify-center">
                <span className="text-sm font-bold text-slate-500">
                  {user?.name ? user.name.charAt(0).toUpperCase() : '?'}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{user?.name || 'Guest'}</p>
              <p className="text-xs text-slate-500 truncate">
                {user?.role === 'provider' ? user?.profession || 'Provider' : 'Client'}
              </p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors text-sm font-medium"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            Sign Out
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative max-w-md w-full">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <span className="material-symbols-outlined">search</span>
              </span>
              <form onSubmit={handleSearchSubmit}>
                <input
                  type="text"
                  placeholder="Search services, professionals, users..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-100 border-none focus:ring-2 focus:ring-primary/30 text-sm"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={() => searchResults.length > 0 && setShowSearchResults(true)}
                  onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
                />
              </form>
              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-slate-200 z-50 max-h-80 overflow-y-auto">
                  {searchResults.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => handleResultClick(result)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors text-left"
                    >
                      <div
                        className="w-10 h-10 rounded-full bg-cover bg-center bg-slate-200"
                        style={{
                          backgroundImage: result.avatar
                            ? `url("${result.avatar.startsWith('http') ? result.avatar : window.location.origin + result.avatar}")`
                            : undefined,
                        }}
                      >
                        {!result.avatar && (
                          <div className="w-full h-full rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-slate-500">
                              {result.name?.charAt(0).toUpperCase() || '?'}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 truncate">{result.name}</p>
                        <p className="text-xs text-slate-500 truncate">
                          {result.type === 'provider' ? result.profession || 'Service Provider' : 'Client'}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          result.type === 'provider' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {result.type === 'provider' ? 'Provider' : 'Client'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-full hover:bg-slate-100 transition-colors"
              >
                <span className="material-symbols-outlined text-slate-600">notifications</span>
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 z-50">
                  <div className="flex items-center justify-between p-4 border-b border-slate-200">
                    <h3 className="font-semibold text-slate-900">Notifications</h3>
                    {unreadCount > 0 && (
                      <button onClick={handleMarkRead} className="text-xs text-primary font-medium">
                        Mark all read
                      </button>
                    )}
                  </div>

                  {/* Follow Requests */}
                  {followRequests.length > 0 && (
                    <div className="p-3 border-b border-slate-200 bg-blue-50">
                      <p className="text-xs font-semibold text-slate-600 mb-2">Follow Requests</p>
                      {followRequests.map((req) => (
                        <div key={req._id || req.id} className="flex items-center gap-3 mb-3">
                          <div
                            className="w-10 h-10 rounded-full bg-cover bg-center bg-slate-200 shrink-0"
                            style={{
                              backgroundImage: req.fromUserAvatar
                                ? `url("${window.location.origin}${req.fromUserAvatar}")`
                                : undefined,
                            }}
                          >
                            {!req.fromUserAvatar && (
                              <div className="w-full h-full rounded-full flex items-center justify-center">
                                <span className="text-sm font-bold text-slate-500">
                                  {req.fromUserName?.charAt(0).toUpperCase() || '?'}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">{req.fromUserName}</p>
                            <p className="text-xs text-slate-500">wants to follow you</p>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <button
                              onClick={() => handleFollowResponse(req._id || req.id, 'accept')}
                              className="text-xs px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleFollowResponse(req._id || req.id, 'decline')}
                              className="text-xs px-2 py-1 bg-slate-300 text-slate-700 rounded hover:bg-slate-400"
                            >
                              Decline
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="p-4 text-center text-slate-500 text-sm">No notifications</p>
                    ) : (
                      notifications.slice(0, 10).map((notif) => (
                        <div
                          key={notif.id}
                          className={`p-3 border-b border-slate-100 hover:bg-slate-50 ${!notif.read ? 'bg-blue-50' : ''}`}
                        >
                          <div className="flex items-start gap-3">
                            {notif.type === 'follow_request' && notif.fromUserAvatar ? (
                              <div
                                className="w-8 h-8 rounded-full bg-cover bg-center bg-slate-200 shrink-0"
                                style={{
                                  backgroundImage: `url("${window.location.origin}${notif.fromUserAvatar}")`,
                                }}
                              />
                            ) : notif.type === 'follow_request' ? (
                              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                                <span className="text-xs font-bold text-slate-500">
                                  {notif.fromUserName?.charAt(0).toUpperCase() || '?'}
                                </span>
                              </div>
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-primary text-[16px]">
                                  {getNotificationIcon(notif.type)}
                                </span>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-900">{notif.title}</p>
                              <p className="text-xs text-slate-500 truncate">{notif.text}</p>
                              <p className="text-xs text-slate-400 mt-1">
                                {new Date(notif.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors">
              <span className="material-symbols-outlined text-slate-600" style={{ fontSize: '18px' }}>location_on</span>
              <span className="text-sm font-medium text-slate-700">Downtown, NY</span>
            </button>
          </div>
        </header>

        <div className="content-area">{children}</div>
      </main>
    </div>
  );
}
