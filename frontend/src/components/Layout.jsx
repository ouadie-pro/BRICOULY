import { NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  FiHome, FiSearch, FiPlayCircle, FiMessageCircle, FiUser, 
  FiBell, FiBellOff, FiUserPlus, FiUsers, FiCheckCircle, FiMenu, FiX,
  FiChevronRight, FiLogOut, FiMapPin, FiChevronDown, FiTool, FiCalendar
} from 'react-icons/fi';
import { GoTasklist } from 'react-icons/go';

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMarkingRead, setIsMarkingRead] = useState(false);

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const [notifData, countData, requestsData] = await Promise.all([
          api.getNotifications(),
          api.getUnreadCount(),
          api.getFollowRequests(),
        ]);
        setNotifications(Array.isArray(notifData) ? notifData : []);
        setUnreadCount(countData?.count || 0);
        const validRequests = (Array.isArray(requestsData) ? requestsData : []).map(req => ({
          ...req,
          id: req.id || req._id,
          requestId: req.id || req._id
        }));
        setFollowRequests(validRequests);
      } catch (error) {
        console.error('Error loading notifications:', error);
        setNotifications([]);
        setUnreadCount(0);
        setFollowRequests([]);
      }
    };
    
    const userId = user?.id || user?._id;
    if (userId) {
      loadNotifications();
    }

    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handleMarkRead = async () => {
    if (isMarkingRead) return;
    
    setIsMarkingRead(true);
    
    try {
      const res = await api.markNotificationsRead();
      
      if (res.success || res.error === 'No notifications to update') {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
        setShowNotifications(false);
      }
    } catch (err) {
      console.error('Error marking notifications as read:', err);
    } finally {
      setIsMarkingRead(false);
    }
  };

  const handleFollowResponse = async (requestId, action) => {
    if (!requestId) return;
    
    try {
      const res = await api.respondToFollowRequest(String(requestId), action);
      
      if (res.success) {
        setFollowRequests(prev => prev.filter((r) => String(r.id) !== String(requestId)));
        const notifData = await api.getNotifications();
        setNotifications(Array.isArray(notifData) ? notifData : []);
      }
    } catch (err) {
      console.error('Error responding to follow request:', err);
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
      case 'message': return FiMessageCircle;
      case 'request': return GoTasklist;
      case 'request_update': return FiCheckCircle;
      case 'follow_request': return FiUserPlus;
      case 'follow_accepted': return FiUsers;
      default: return FiBell;
    }
  };

  const clientNavItems = [
    { path: '/home', icon: FiHome, label: 'Home' },
    { path: '/search', icon: FiSearch, label: 'Search' },
    { path: '/videos', icon: FiPlayCircle, label: 'Videos' },
    { path: '/requests', icon: GoTasklist, label: 'My Requests' },
    { path: '/messages', icon: FiMessageCircle, label: 'Messages' },
    { path: '/profile', icon: FiUser, label: 'Profile' },
  ];

  const providerNavItems = [
    { path: '/home', icon: FiHome, label: 'Home' },
    { path: '/search', icon: FiSearch, label: 'Find Work' },
    { path: '/videos', icon: FiPlayCircle, label: 'Videos' },
    { path: '/dashboard', icon: GoTasklist, label: 'Dashboard' },
    { path: '/provider-bookings', icon: FiCalendar, label: 'Bookings' },
    { path: '/messages', icon: FiMessageCircle, label: 'Messages' },
    { path: '/profile', icon: FiUser, label: 'Profile' },
  ];

  const navItems = user?.role === 'provider' ? providerNavItems : clientNavItems;

  return (
    <div className="desktop-layout">
      <button className="mobile-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
        {sidebarOpen ? <FiX className="text-slate-700" /> : <FiMenu className="text-slate-700" />}
      </button>

      <div className={`overlay ${sidebarOpen ? 'show' : ''}`} onClick={() => setSidebarOpen(false)} />

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-dark text-white shadow-md shadow-primary/20">
            <FiTool className="text-2xl" />
          </div>
          <span className="text-xl font-black tracking-tight text-slate-900">PRUCOLY</span>
        </div>

        <nav className="sidebar-nav pt-4">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon style={{ fontSize: '22px' }} />
              <span>{item.label}</span>
              {item.label === 'Messages' && unreadCount > 0 && (
                <span className="ml-auto bg-white/20 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                  {unreadCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="flex items-center gap-3 mb-3 p-2 -mx-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer">
            {user?.avatar && user.avatar.length > 0 ? (
              <div
                className="w-10 h-10 rounded-xl bg-cover bg-center border border-slate-200"
                style={{
                  backgroundImage: `url("${user.avatar.startsWith('http') ? user.avatar : window.location.origin + user.avatar}")`,
                }}
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-200 to-slate-300 border border-slate-200 flex items-center justify-center">
                <span className="text-sm font-bold text-slate-600">
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
            <FiChevronRight className="text-slate-400" />
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all text-sm font-medium"
          >
            <FiLogOut className="text-lg" />
            Sign Out
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative max-w-md w-full">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <FiSearch className="text-xl" />
              </span>
              <form onSubmit={handleSearchSubmit}>
                <input
                  type="text"
                  placeholder="Search services, providers..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-100 border-none focus:ring-2 focus:ring-primary/30 text-sm transition-all focus:bg-white"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={() => searchResults.length > 0 && setShowSearchResults(true)}
                  onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
                />
              </form>
              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-slate-200 z-50 max-h-80 overflow-y-auto overflow-hidden">
                  {searchResults.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => handleResultClick(result)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors text-left"
                    >
                      <div
                        className="w-10 h-10 rounded-full bg-cover bg-center bg-slate-100"
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
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          result.type === 'provider' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {result.type === 'provider' ? 'Pro' : 'Client'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <FiBell className="text-slate-600 text-xl" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-88 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden">
                  <div className="flex items-center justify-between p-4 border-b border-slate-100">
                    <h3 className="font-semibold text-slate-900">Notifications</h3>
                    {unreadCount > 0 && (
                      <button 
                        onClick={handleMarkRead} 
                        disabled={isMarkingRead}
                        className="text-xs text-primary font-medium hover:underline disabled:opacity-50"
                      >
                        {isMarkingRead ? 'Marking...' : 'Mark all read'}
                      </button>
                    )}
                  </div>

                  {/* Follow Requests */}
                  {followRequests.length > 0 && (
                    <div className="p-3 border-b border-slate-100 bg-slate-50">
                      <p className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wide">Follow Requests</p>
                      {followRequests.map((req) => {
                        const requestId = req.id || req._id || req.requestId;
                        
                        return (
                          <div key={requestId} className="flex items-center gap-3 mb-3 last:mb-0 p-2 bg-white rounded-lg border border-slate-100">
                            <div
                              className="w-10 h-10 rounded-full bg-cover bg-center bg-slate-100 shrink-0"
                              style={{
                                backgroundImage: req.fromUserAvatar
                                  ? `url("${req.fromUserAvatar.startsWith('http') ? req.fromUserAvatar : window.location.origin + req.fromUserAvatar}")`
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
                                onClick={() => handleFollowResponse(requestId, 'accept')}
                                className="text-xs px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => handleFollowResponse(requestId, 'decline')}
                                className="text-xs px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-lg font-medium transition-colors"
                              >
                                Decline
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center">
                        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center">
                          <FiBellOff className="text-slate-400" />
                        </div>
                        <p className="text-slate-500 text-sm">No notifications yet</p>
                      </div>
                    ) : (
                      notifications.slice(0, 10).map((notif) => (
                        <div
                          key={notif.id}
                          className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors ${!notif.read ? 'bg-blue-50/50' : ''}`}
                        >
                          <div className="flex items-start gap-3">
                            {notif.type === 'follow_request' && notif.fromUserAvatar ? (
                              <div
                                className="w-9 h-9 rounded-full bg-cover bg-center bg-slate-100 shrink-0"
                                style={{
                                  backgroundImage: `url("${window.location.origin}${notif.fromUserAvatar}")`,
                                }}
                              />
                            ) : notif.type === 'follow_request' ? (
                              <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                                <span className="text-sm font-bold text-slate-500">
                                  {notif.fromUserName?.charAt(0).toUpperCase() || '?'}
                                </span>
                              </div>
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                {(() => {
                                  const IconComponent = getNotificationIcon(notif.type);
                                  return <IconComponent className="text-primary text-lg" />;
                                })()}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-900">{notif.title}</p>
                              <p className="text-xs text-slate-500 mt-0.5 truncate">{notif.text}</p>
                              <p className="text-xs text-slate-400 mt-1">
                                {new Date(notif.createdAt).toLocaleString()}
                              </p>
                            </div>
                            {!notif.read && (
                              <span className="w-2 h-2 bg-primary rounded-full shrink-0 mt-1.5"></span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <button className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors">
              <FiMapPin className="text-slate-600" style={{ fontSize: '18px' }} />
              <span className="text-sm font-medium text-slate-600">Location</span>
              <FiChevronDown className="text-slate-400 text-lg" />
            </button>
          </div>
        </header>

        <div className="content-area">{children}</div>
      </main>

      <nav className="mobile-nav">
        {navItems.slice(0, 5).map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <item.icon />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
