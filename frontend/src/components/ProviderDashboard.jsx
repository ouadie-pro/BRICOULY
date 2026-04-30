import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { FiEdit, FiPlus, FiTrash2, FiBriefcase, FiEye, FiStar, FiMessageCircle, FiDollarSign, FiTool, FiFileText, FiMapPin, FiClock } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function ProviderDashboard({ isDesktop }) {
  const [user, setUser] = useState(null);
  const [services, setServices] = useState([]);
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({ jobsDone: 0, profileViews: 0, rating: 0, unreadMessages: 0, activeJobs: 0 });
  const [weeklyActivity, setWeeklyActivity] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [showAddService, setShowAddService] = useState(false);
  const [showAddPortfolio, setShowAddPortfolio] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [newService, setNewService] = useState({ name: '', description: '', price: '', category: 'other' });
  const [newPortfolioItem, setNewPortfolioItem] = useState({ title: '', description: '', image: null });
  const [loading, setLoading] = useState(true);
  const [isAvailable, setIsAvailable] = useState(true);
  const [showWorkingHours, setShowWorkingHours] = useState(false);
  const [workingHours, setWorkingHours] = useState({
    monday:    { open: '08:00', close: '18:00', active: true },
    tuesday:   { open: '08:00', close: '18:00', active: true },
    wednesday: { open: '08:00', close: '18:00', active: true },
    thursday:  { open: '08:00', close: '18:00', active: true },
    friday:    { open: '08:00', close: '18:00', active: true },
    saturday:  { open: '09:00', close: '14:00', active: false },
    sunday:    { open: '09:00', close: '14:00', active: false },
  });
  const navigate = useNavigate();

  const calcCompletion = (provider) => {
    const fields = [
      provider?.avatar,
      provider?.bio,
      provider?.city,
      provider?.phone,
      provider?.hourlyRate,
      services?.length > 0,
      provider?.portfolio?.length > 0,
    ];
    const filled = fields.filter(Boolean).length;
    return Math.round((filled / fields.length) * 100);
  };

  const loadData = async (userId) => {
    if (!userId) return;
    setLoading(true);
    try {
      const [servicesData, requestsResult, statsData, activityData, userData, portfolioData] = await Promise.all([
        api.getProviderServices(userId),
        api.getProviderServiceRequests(),
        api.getProviderStats(userId),
        api.getWeeklyActivity(userId),
        api.getUser(userId),
        api.getPortfolio(userId),
      ]);
      
      // Normalize services to use _id
      const normalizedServices = (servicesData || []).map(s => ({
        ...s,
        id: s._id || s.id
      }));
      setServices(normalizedServices);
      
      // Normalize requests
      const normalizedRequests = (requestsResult?.requests || requestsResult || []).map(r => ({
        ...r,
        id: r._id || r.id
      }));
      setRequests(normalizedRequests);
      
      // Set stats (default to 0 if missing)
      setStats(statsData || { jobsDone: 0, profileViews: 0, rating: 0, unreadMessages: 0, activeJobs: 0 });
      
      // Set weekly activity
      setWeeklyActivity(activityData || generateEmptyWeek());
      
      // Set portfolio
      setPortfolio(portfolioData || []);
      
      // Update user data if received
      if (userData) {
        setUser({ ...user, ...userData });
        if (userData.available !== undefined) setIsAvailable(userData.available);
        if (userData.workingHours) setWorkingHours(userData.workingHours);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setServices([]);
      setRequests([]);
      setPortfolio([]);
      setStats({ jobsDone: 0, profileViews: 0, rating: 0, unreadMessages: 0, activeJobs: 0 });
      setWeeklyActivity(generateEmptyWeek());
    } finally {
      setLoading(false);
    }
  };

  const generateEmptyWeek = () => {
    const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    return days.map(day => ({ day, views: 0, messages: 0 }));
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

  // Auto-refresh every 60 seconds
  useEffect(() => {
    if (!user || user.role !== 'provider') return;
    
    const interval = setInterval(() => {
      loadData(user.id);
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, [user]);

  const handleRefresh = () => {
    if (user && user.id) {
      loadData(user.id);
    }
  };

  const toggleAvailability = async () => {
    const newVal = !isAvailable;
    setIsAvailable(newVal);
    await api.updateProviderAvailability(newVal);
  };

  const saveWorkingHours = async () => {
    const res = await api.updateWorkingHours(workingHours);
    if (res.success) {
      setShowWorkingHours(false);
    }
  };

  const handleAddService = async (e) => {
    e.preventDefault();
    const serviceId = editingService?._id || editingService?.id;
    const res = serviceId 
      ? await api.updateService(serviceId, newService)
      : await api.addService(newService);
    if (res.success) {
      if (editingService) {
        setServices(services.map(s => (s._id === serviceId || s.id === serviceId) ? res.service : s));
        setEditingService(null);
      } else {
        setServices([...services, res.service]);
      }
      setShowAddService(false);
      setNewService({ name: '', description: '', price: '', category: 'other' });
    }
  };

  const handleDeleteService = async (service) => {
    const serviceId = service._id || service.id;
    const res = await api.deleteService(serviceId);
    if (res.success) {
      setServices(services.filter(s => (s._id !== serviceId && s.id !== serviceId)));
    }
  };

  const handleEditService = (service) => {
    setEditingService(service);
    setNewService({
      name: service.name,
      description: service.description || '',
      price: service.price,
      category: service.category || 'other'
    });
    setShowAddService(true);
  };

  const handleUpdateRequest = async (requestId, status) => {
    await api.updateServiceRequest(requestId, { status });
    loadData(user.id);
  };

  const handleApply = async (requestId) => {
    const res = await api.applyToServiceRequest(requestId, {});
    if (res.success) {
      loadData(user.id);
    }
  };

  const handleAddPortfolioItem = async (e) => {
    e.preventDefault();
    if (!newPortfolioItem.title || !newPortfolioItem.description || !newPortfolioItem.image) {
      return;
    }
    
    const formData = new FormData();
    formData.append('image', newPortfolioItem.image);
    formData.append('title', newPortfolioItem.title);
    formData.append('description', newPortfolioItem.description);
    
    const res = await api.addPortfolioItem(formData);
    if (res.success) {
      setPortfolio([...portfolio, res.portfolio]);
      setShowAddPortfolio(false);
      setNewPortfolioItem({ title: '', description: '', image: null });
    }
  };

  const handleDeletePortfolioItem = async (itemId) => {
    const res = await api.deletePortfolioItem(itemId);
    if (res.success) {
      setPortfolio(portfolio.filter(item => (item._id !== itemId && item.id !== itemId)));
    }
  };

  const formatPrice = (price) => {
    const numPrice = parseFloat(price);
    return isNaN(numPrice) ? '0' : numPrice.toFixed(0);
  };

  if (!user || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const completionPercent = calcCompletion(user);
  const openRequests = requests.filter(r => r.status === 'open').length;

  const statCards = [
    { icon: FiBriefcase, label: 'Travaux effectués', value: stats.jobsDone || 0, color: '#3b82f6', bgColor: '#eff6ff' },
    { icon: FiTool, label: 'Travaux actifs', value: stats.activeJobs || 0, color: '#22c55e', bgColor: '#f0fdf4' },
    { icon: FiEye, label: 'Vues du profil', value: stats.profileViews || 0, color: '#8b5cf6', bgColor: '#f5f3ff' },
    { icon: FiStar, label: 'Note moyenne', value: stats.rating ? stats.rating.toFixed(1) : '—', color: '#f59e0b', bgColor: '#fffbeb' },
    { icon: FiMessageCircle, label: 'Messages', value: stats.unreadMessages || 0, color: '#10b981', bgColor: '#ecfdf5' },
    { icon: FiDollarSign, label: 'Tarif horaire', value: `${formatPrice(user.hourlyRate)} MAD`, color: '#1e3a5f', bgColor: '#f8fafc' },
  ];

  const getCategoryLabel = (cat) => {
    const labels = {
      plumbing: 'Plomberie',
      electrical: 'Électricité',
      cleaning: 'Nettoyage',
      painting: 'Peinture',
      carpentry: 'Menuiserie',
      hvac: 'Climatisation',
      gardening: 'Jardinage',
      other: 'Autre'
    };
    return labels[cat] || cat;
  };

  if (!isDesktop) {
    return (
      <div className="p-4 pb-24 max-w-md mx-auto">
        <div className="profile-banner-mobile mb-4">
          <div className="flex items-center gap-3">
            <div className="avatar-placeholder-lg">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="avatar-img" />
              ) : (
                <span>{user.name?.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-white">{user.name}</h2>
              <p className="text-white/80 text-sm">{user.profession || 'Prestataire'}</p>
              <div className="flex items-center gap-2 mt-1 text-white/70 text-xs">
                <span>⭐ {user.rating || 'Nouveau'}</span>
                <span>📍 {user.city || 'Non défini'}</span>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <button
                  onClick={toggleAvailability}
                  className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold transition-all ${isAvailable
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-red-100 text-red-600 hover:bg-red-200'}`}
                >
                  <span className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-green-500' : 'bg-red-500'}`} />
                  {isAvailable ? 'Available' : 'Unavailable'}
                </button>
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate('/profile')}
            className="edit-profile-btn-mobile"
          >
            ✏ Modifier
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          {statCards.slice(0, 4).map((stat, i) => (
            <div key={i} className="stat-card-mobile" style={{ backgroundColor: stat.bgColor }}>
              <stat.icon className="text-2xl" style={{ color: stat.color }} />
              <span className="stat-value-mobile" style={{ color: stat.color }}>{stat.value}</span>
              <span className="stat-label-mobile">{stat.label}</span>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <FiTool /> Mes Services
            </h3>
            <button 
              onClick={() => setShowAddService(!showAddService)}
              className="add-btn"
            >
              + Ajouter
            </button>
          </div>
          
          {services.length === 0 ? (
            <div className="empty-state">
              <span style={{fontSize: '40px'}}>🔧</span>
              <p>Aucun service ajouté</p>
              <small>Ajoutez vos services pour attirer des clients</small>
            </div>
          ) : (
            <div className="space-y-2">
              {services.map((service, index) => (
                <div key={service._id || service.id || `service-${index}`} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{service.name}</p>
                    <p className="text-xs text-slate-500">{getCategoryLabel(service.category)}</p>
                    <p className="text-primary font-semibold text-sm mt-1">{service.price} MAD</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleEditService(service)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg">
                      <FiEdit />
                    </button>
                    <button onClick={() => handleDeleteService(service.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {showAddService && (
            <form onSubmit={handleAddService} className="mt-4 p-3 bg-slate-50 rounded-lg space-y-2">
              <input type="text" placeholder="Nom du service" value={newService.name} onChange={(e) => setNewService({...newService, name: e.target.value})} className="w-full p-2 border rounded-lg text-sm" required />
              <textarea placeholder="Description" value={newService.description} onChange={(e) => setNewService({...newService, description: e.target.value})} className="w-full p-2 border rounded-lg text-sm resize-none" rows={2} />
              <input type="number" placeholder="Prix (MAD)" value={newService.price} onChange={(e) => setNewService({...newService, price: e.target.value})} className="w-full p-2 border rounded-lg text-sm" required />
              <div className="flex gap-2">
                <button type="button" onClick={() => { setShowAddService(false); setEditingService(null); setNewService({ name: '', description: '', price: '', category: 'other' }); }} className="flex-1 py-2 text-slate-600 bg-white border rounded-lg text-sm">Annuler</button>
                <button type="submit" className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm">{editingService ? 'Modifier' : 'Ajouter'}</button>
              </div>
            </form>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <FiFileText /> Portfolio / Livre
            </h3>
            <button 
              onClick={() => setShowAddPortfolio(!showAddPortfolio)}
              className="add-btn"
            >
              + Ajouter
            </button>
          </div>
          
          {portfolio.length === 0 ? (
            <div className="empty-state">
              <span style={{fontSize: '40px'}}>📸</span>
              <p>Aucun élément dans le portfolio</p>
              <small>Ajoutez des photos de vos réalisations</small>
            </div>
          ) : (
            <div className="space-y-2">
              {portfolio.map((item, index) => (
                <div key={item._id || item.id || `portfolio-${index}`} className="p-3 bg-slate-50 rounded-lg">
                  <div className="flex gap-3">
                    {item.images && item.images.length > 0 ? (
                      <img src={item.images[0]} alt={item.title} className="w-16 h-16 object-cover rounded-lg" />
                    ) : null}
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{item.title}</p>
                      <p className="text-xs text-slate-500">{item.description?.substring(0, 60)}{item.description?.length > 60 ? '...' : ''}</p>
                    </div>
                    <button onClick={() => handleDeletePortfolioItem(item._id || item.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg self-start">
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {showAddPortfolio && (
            <form onSubmit={handleAddPortfolioItem} className="mt-4 p-3 bg-slate-50 rounded-lg space-y-2">
              <input type="text" placeholder="Titre" value={newPortfolioItem.title} onChange={(e) => setNewPortfolioItem({...newPortfolioItem, title: e.target.value})} className="w-full p-2 border rounded-lg text-sm" required />
              <textarea placeholder="Description" value={newPortfolioItem.description} onChange={(e) => setNewPortfolioItem({...newPortfolioItem, description: e.target.value})} className="w-full p-2 border rounded-lg text-sm resize-none" rows={2} required />
              <input type="file" accept="image/*" onChange={(e) => setNewPortfolioItem({...newPortfolioItem, image: e.target.files[0]})} className="w-full p-2 border rounded-lg text-sm" required />
              <div className="flex gap-2">
                <button type="button" onClick={() => { setShowAddPortfolio(false); setNewPortfolioItem({ title: '', description: '', image: null }); }} className="flex-1 py-2 text-slate-600 bg-white border rounded-lg text-sm">Annuler</button>
                <button type="submit" className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm">Ajouter</button>
              </div>
            </form>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <FiFileText /> Demandes
            </h3>
            {openRequests > 0 && <span className="badge">{openRequests} en attente</span>}
          </div>
          
          {requests.length === 0 ? (
            <div className="empty-state">
              <span style={{fontSize: '40px'}}>📭</span>
              <p>Aucune demande pour le moment</p>
              <small>Les clients vous contacteront via votre profil</small>
            </div>
          ) : (
            <div className="space-y-2">
              {requests.map((request, index) => (
                <div key={request._id || request.id || `request-${index}`} className="p-3 bg-slate-50 rounded-lg">
                  <p className="font-medium text-slate-900">{request.title}</p>
                  <p className="text-sm text-slate-500">{request.description}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-slate-400">De: {request.clientId?.name || request.clientId || 'Client'}</span>
                    {request.status === 'open' && (
                      <button onClick={() => handleApply(request.id)} className="px-3 py-1 bg-green-600 text-white rounded text-xs">Postuler</button>
                    )}
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
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Tableau de bord</h1>
        <div className="header-buttons">
          <button onClick={handleRefresh} className="refresh-btn">
            🔄 Actualiser
          </button>
          <button onClick={() => navigate('/profile')} className="edit-profile-btn">
            ✏ Modifier le profil
          </button>
        </div>
      </div>

      <div className="profile-banner">
        <div className="profile-left">
          <div className="avatar-placeholder-lg">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="avatar-img" />
            ) : (
              <span>{user.name?.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="provider-details">
            <div className="name-row">
              <h2 className="provider-name">{user.name}</h2>
              {user.isVerified && <span className="verified-chip">✓ Vérifié</span>}
            </div>
            <p className="profession">{user.profession || 'Prestataire de services'}</p>
            <div className="meta-row">
              <span className="meta-item">⭐ {user.rating || 'Nouveau'}</span>
              <span className="meta-item">📍 {user.city || 'Non défini'}</span>
              <span className="meta-item">💰 {formatPrice(user.hourlyRate)} MAD/h</span>
            </div>
              <div className="completion-bar">
                <div className="completion-header">
                  <span>Profil complété à <strong>{completionPercent}%</strong></span>
                  {completionPercent < 100 && (
                    <button onClick={() => navigate('/profile')} className="complete-link">
                      Compléter mon profil →
                    </button>
                  )}
                </div>
                <div className="bar">
                  <div className="fill" style={{ width: `${completionPercent}%` }}></div>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-3">
                <button
                  onClick={toggleAvailability}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${isAvailable
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-red-100 text-red-600 hover:bg-red-200'}`}
                >
                  <span className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-green-500' : 'bg-red-500'}`} />
                  {isAvailable ? 'Available' : 'Unavailable'}
                </button>
              </div>
            </div>
          </div>
        </div>

      <div className="stats-row">
        {statCards.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className="stat-icon-wrapper" style={{ backgroundColor: stat.bgColor }}>
              <stat.icon style={{ color: stat.color }} />
            </div>
            <div className="stat-value">{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
          </div>
        ))}
      </div>

      {(stats.jobsDone === 0 && stats.activeJobs === 0 && stats.profileViews === 0) && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700 flex items-center gap-2">
          <span>📊</span>
          <span>Your stats will update as you complete bookings and receive profile visits.</span>
        </div>
      )}

      <div className="main-grid">
        <div className="services-card">
          <div className="card-header">
            <h3>🛠 Mes Services</h3>
            <button onClick={() => { setShowAddService(true); setEditingService(null); setNewService({ name: '', description: '', price: '', category: 'other' }); }} className="add-btn">
              + Ajouter
            </button>
          </div>
          
          {services.length === 0 ? (
            <div className="empty-state">
              <span style={{fontSize: '48px'}}>🔧</span>
              <p>Aucun service ajouté</p>
              <small>Ajoutez vos services pour attirer des clients</small>
              <button onClick={() => setShowAddService(true)}>+ Ajouter un service</button>
            </div>
          ) : (
            <div className="services-list">
              {services.map((service, index) => (
                <div key={service._id || service.id || `service-${index}`} className="service-item">
                  <div className="service-info">
                    <div className="service-main">
                      <span className="service-name">{service.name}</span>
                      <span className="service-category">{getCategoryLabel(service.category)}</span>
                    </div>
                    {service.description && (
                      <p className="service-desc">{service.description}</p>
                    )}
                  </div>
                  <div className="service-right">
                    <span className="service-price">{service.price} MAD</span>
                    <div className="service-actions">
                      <button onClick={() => handleEditService(service)} className="action-btn edit-btn">✏</button>
                      <button onClick={() => handleDeleteService(service.id)} className="action-btn delete-btn">🗑</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {showAddService && (
            <form onSubmit={handleAddService} className="add-service-form">
              <h4>{editingService ? 'Modifier le service' : 'Ajouter un nouveau service'}</h4>
              <input type="text" placeholder="Nom du service" value={newService.name} onChange={(e) => setNewService({...newService, name: e.target.value})} className="form-input" required />
              <textarea placeholder="Description (optionnel)" value={newService.description} onChange={(e) => setNewService({...newService, description: e.target.value})} className="form-input" rows={2} />
              <div className="form-row">
                <input type="number" placeholder="Prix (MAD)" value={newService.price} onChange={(e) => setNewService({...newService, price: e.target.value})} className="form-input" required />
                <select value={newService.category} onChange={(e) => setNewService({...newService, category: e.target.value})} className="form-select">
                  <option value="plumbing">Plomberie</option>
                  <option value="electrical">Électricité</option>
                  <option value="cleaning">Nettoyage</option>
                  <option value="painting">Peinture</option>
                  <option value="carpentry">Menuiserie</option>
                  <option value="hvac">Climatisation</option>
                  <option value="gardening">Jardinage</option>
                  <option value="other">Autre</option>
                </select>
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => { setShowAddService(false); setEditingService(null); }} className="cancel-btn">Annuler</button>
                <button type="submit" className="save-btn">{editingService ? 'Modifier' : 'Ajouter'}</button>
              </div>
            </form>
          )}
        </div>
      </div>

      <div className="working-hours-section">
        <div className="card-header" style={{ cursor: 'pointer' }} onClick={() => setShowWorkingHours(!showWorkingHours)}>
          <h3>🕐 Working Hours</h3>
          <span className="text-xs text-slate-500">{showWorkingHours ? 'Hide' : 'Show'} ▾</span>
        </div>
        {showWorkingHours && (
          <div className="working-hours-table">
            <table>
              <thead>
                <tr>
                  <th>Day</th>
                  <th>Active</th>
                  <th>Open</th>
                  <th>Close</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(workingHours).map(([day, hours]) => (
                  <tr key={day}>
                    <td className="font-medium capitalize">{day}</td>
                    <td>
                      <input type="checkbox" checked={hours.active}
                        onChange={(e) => setWorkingHours(prev => ({ ...prev, [day]: { ...prev[day], active: e.target.checked } }))} />
                    </td>
                    <td>
                      <input type="time" value={hours.open}
                        onChange={(e) => setWorkingHours(prev => ({ ...prev, [day]: { ...prev[day], open: e.target.value } }))} />
                    </td>
                    <td>
                      <input type="time" value={hours.close}
                        onChange={(e) => setWorkingHours(prev => ({ ...prev, [day]: { ...prev[day], close: e.target.value } }))} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex gap-2 mt-3 justify-end">
              <button onClick={() => setShowWorkingHours(false)} className="cancel-btn">Cancel</button>
              <button onClick={saveWorkingHours} className="save-btn">Save</button>
            </div>
          </div>
        )}
      </div>

      <div className="portfolio-section">
        <div className="portfolio-card">
          <div className="card-header">
            <h3>📸 Portfolio / Livre</h3>
            <button onClick={() => setShowAddPortfolio(true)} className="add-btn">
              + Ajouter
            </button>
          </div>
          
          {portfolio.length === 0 ? (
            <div className="empty-state">
              <span style={{fontSize: '48px'}}>📸</span>
              <p>Aucun élément dans le portfolio</p>
              <small>Ajoutez des photos de vos réalisations pour attirer des clients</small>
              <button onClick={() => setShowAddPortfolio(true)}>+ Ajouter un élément</button>
            </div>
          ) : (
            <div className="portfolio-grid">
              {portfolio.map((item, index) => (
                <div key={item._id || item.id || `portfolio-${index}`} className="portfolio-item">
                  {item.images && item.images.length > 0 ? (
                    <img src={item.images[0]} alt={item.title} className="portfolio-image" />
                  ) : null}
                  <div className="portfolio-content">
                    <h4 className="portfolio-title">{item.title}</h4>
                    <p className="portfolio-description">{item.description?.substring(0, 80)}{item.description?.length > 80 ? '...' : ''}</p>
                    <button onClick={() => handleDeletePortfolioItem(item._id || item.id)} className="portfolio-delete-btn">
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {showAddPortfolio && (
            <form onSubmit={handleAddPortfolioItem} className="add-portfolio-form">
              <h4>Ajouter un élément au portfolio</h4>
              <input type="text" placeholder="Titre" value={newPortfolioItem.title} onChange={(e) => setNewPortfolioItem({...newPortfolioItem, title: e.target.value})} className="form-input" required />
              <textarea placeholder="Description" value={newPortfolioItem.description} onChange={(e) => setNewPortfolioItem({...newPortfolioItem, description: e.target.value})} className="form-input" rows={3} required />
              <input type="file" accept="image/*" onChange={(e) => setNewPortfolioItem({...newPortfolioItem, image: e.target.files[0]})} className="form-input" required />
              <div className="form-actions">
                <button type="button" onClick={() => { setShowAddPortfolio(false); setNewPortfolioItem({ title: '', description: '', image: null }); }} className="cancel-btn">Annuler</button>
                <button type="submit" className="save-btn">Ajouter</button>
              </div>
            </form>
          )}
        </div>
      </div>

      <div className="main-grid">
        <div className="requests-card">
          <div className="card-header">
            <h3>📋 Demandes de Service</h3>
            {openRequests > 0 && <span className="badge">{openRequests} en attente</span>}
          </div>
          
          {requests.length === 0 ? (
            <div className="empty-state">
              <span style={{fontSize: '48px'}}>📭</span>
              <p>Aucune demande pour le moment</p>
              <small>Les clients pourront vous contacter via votre profil</small>
              <button onClick={() => navigate('/search')}>Voir comment apparaître dans les recherches →</button>
            </div>
          ) : (
            <div className="requests-list">
              {requests.map((request, index) => (
                <div key={request._id || request.id || `request-${index}`} className="request-item">
                  <div className="request-avatar">
                    {request.clientId?.avatar ? (
                      <img src={request.clientId.avatar} alt={request.clientId?.name} />
                    ) : (
                      <span>{request.clientId?.name?.charAt(0).toUpperCase() || 'C'}</span>
                    )}
                  </div>
                  <div className="request-info">
                    <p className="client-name">{request.clientId?.name || 'Client'}</p>
                    <p className="service-requested">{request.title}</p>
                    <p className="request-desc">{request.description?.substring(0, 80)}{request.description?.length > 80 ? '...' : ''}</p>
                    <p className="request-date">
                      <FiClock className="inline" /> {new Date(request.createdAt || Date.now()).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="request-status">
                    <span className={`status-badge ${request.status}`}>
                      {request.status === 'open' ? 'Ouvert' : request.status === 'in_progress' ? 'En cours' : request.status === 'completed' ? 'Terminé' : request.status}
                    </span>
                  </div>
                  {request.status === 'open' && (
                    <div className="request-actions">
                      <button onClick={() => handleApply(request.id)} className="accept-btn">✓ Postuler</button>
                    </div>
                  )}
                  {request.status === 'in_progress' && request.clientId && (
                    <div className="request-actions">
                      <button onClick={() => navigate(`/messages/${request.clientId._id || request.clientId}`)} className="message-btn">
                        <FiMessageCircle className="inline mr-1" /> Message
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="earnings-section">
        <div className="card-header">
          <h3>📈 Activité des 7 derniers jours</h3>
        </div>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyActivity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                formatter={(value, name) => [value, name === 'views' ? 'Vues profil' : 'Messages']}
              />
              <Bar dataKey="views" fill="#3b82f6" name="views" radius={[4, 4, 0, 0]} />
              <Bar dataKey="messages" fill="#10b981" name="messages" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <style>{`
        .dashboard-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .header-buttons {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .refresh-btn {
          background: #10b981;
          color: white;
          border: none;
          border-radius: 10px;
          padding: 10px 18px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .refresh-btn:hover {
          background: #059669;
        }

        .dashboard-title {
          font-size: 24px;
          font-weight: 700;
          color: #1e3a5f;
        }

        .profile-banner {
          background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%);
          color: white;
          border-radius: 16px;
          padding: 24px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .profile-banner-mobile {
          background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%);
          color: white;
          border-radius: 16px;
          padding: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .profile-left {
          display: flex;
          gap: 20px;
          align-items: flex-start;
        }

        .avatar-placeholder-lg {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: rgba(255,255,255,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          font-weight: 700;
          color: white;
          border: 3px solid rgba(255,255,255,0.3);
          overflow: hidden;
        }

        .avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .provider-details {
          flex: 1;
        }

        .name-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 4px;
        }

        .provider-name {
          font-size: 24px;
          font-weight: 700;
          margin: 0;
        }

        .verified-chip {
          background: rgba(255,255,255,0.2);
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
        }

        .profession {
          color: rgba(255,255,255,0.85);
          margin: 0 0 8px 0;
          font-size: 14px;
        }

        .meta-row {
          display: flex;
          gap: 16px;
          margin-bottom: 12px;
        }

        .meta-item {
          font-size: 13px;
          color: rgba(255,255,255,0.8);
        }

        .completion-bar {
          margin-top: 8px;
        }

        .completion-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
          margin-bottom: 6px;
        }

        .completion-header strong {
          color: #10b981;
        }

        .bar {
          height: 6px;
          background: rgba(255,255,255,0.2);
          border-radius: 3px;
          overflow: hidden;
        }

        .fill {
          height: 100%;
          background: #10b981;
          border-radius: 3px;
          transition: width 0.5s ease;
        }

        .complete-link {
          color: #60a5fa;
          background: none;
          border: none;
          font-size: 13px;
          cursor: pointer;
          padding: 0;
        }

        .complete-link:hover {
          text-decoration: underline;
        }

        .edit-profile-btn {
          background: rgba(255,255,255,0.15);
          color: white;
          border: 1px solid rgba(255,255,255,0.3);
          border-radius: 10px;
          padding: 10px 18px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .edit-profile-btn:hover {
          background: rgba(255,255,255,0.25);
        }

        .edit-profile-btn-mobile {
          background: rgba(255,255,255,0.2);
          color: white;
          border: none;
          border-radius: 8px;
          padding: 8px 14px;
          font-size: 13px;
          cursor: pointer;
        }

        .stats-row {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 16px;
        }

        .stat-card {
          background: white;
          border-radius: 12px;
          padding: 20px 16px;
          text-align: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          border: 1px solid #f0f0f0;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .stat-card-mobile {
          border-radius: 12px;
          padding: 16px 12px;
          text-align: center;
        }

        .stat-icon-wrapper {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 12px;
        }

        .stat-icon-wrapper svg {
          width: 24px;
          height: 24px;
        }

        .stat-value {
          font-size: 24px;
          font-weight: 700;
          color: #1e3a5f;
          margin-bottom: 4px;
        }

        .stat-value-mobile {
          font-size: 20px;
          font-weight: 700;
          display: block;
          margin-top: 6px;
        }

        .stat-label {
          font-size: 12px;
          color: #6b7280;
        }

        .stat-label-mobile {
          font-size: 11px;
          color: #6b7280;
          display: block;
          margin-top: 4px;
        }

        .main-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }

        .portfolio-section {
          grid-column: 1 / -1;
        }

        .services-card, .requests-card, .portfolio-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          border: 1px solid #f0f0f0;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid #f0f0f0;
        }

        .card-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #1e3a5f;
        }

        .add-btn {
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 6px 14px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          transition: background 0.2s;
        }

        .add-btn:hover {
          background: #2563eb;
        }

        .badge {
          background: #fef3c7;
          color: #d97706;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
        }

        .services-list {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .service-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 0;
          border-bottom: 1px solid #f9fafb;
        }

        .service-item:last-child {
          border-bottom: none;
        }

        .service-info {
          flex: 1;
        }

        .service-main {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .service-name {
          font-weight: 600;
          color: #1f2937;
          font-size: 15px;
        }

        .service-category {
          background: #f3f4f6;
          color: #6b7280;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 11px;
        }

        .service-desc {
          color: #9ca3af;
          font-size: 13px;
          margin-top: 4px;
        }

        .service-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .service-price {
          font-weight: 600;
          color: #10b981;
          font-size: 15px;
        }

        .service-actions {
          display: flex;
          gap: 4px;
        }

        .action-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          transition: all 0.2s;
        }

        .edit-btn {
          background: #eff6ff;
          color: #3b82f6;
        }

        .edit-btn:hover {
          background: #dbeafe;
        }

        .delete-btn {
          background: #fef2f2;
          color: #ef4444;
        }

        .delete-btn:hover {
          background: #fee2e2;
        }

        .requests-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .request-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 12px;
          background: #f9fafb;
          border-radius: 10px;
          transition: background 0.2s;
        }

        .request-item:hover {
          background: #f3f4f6;
        }

        .request-avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          color: #6b7280;
          overflow: hidden;
        }

        .request-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .request-info {
          flex: 1;
        }

        .client-name {
          font-weight: 600;
          color: #1f2937;
          margin: 0;
          font-size: 14px;
        }

        .service-requested {
          color: #4b5563;
          margin: 2px 0 0 0;
          font-size: 13px;
        }

        .request-date {
          color: #9ca3af;
          font-size: 12px;
          margin: 4px 0 0 0;
        }

        .request-status {
          margin-right: 8px;
        }

        .status-badge {
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 500;
        }

        .status-badge.pending, .status-badge.open {
          background: #fef3c7;
          color: #d97706;
        }

        .status-badge.accepted, .status-badge.in_progress {
          background: #d1fae5;
          color: #059669;
        }

        .status-badge.rejected, .status-badge.completed {
          background: #fee2e2;
          color: #dc2626;
        }

        .request-desc {
          color: #6b7280;
          font-size: 12px;
          margin: 2px 0 4px 0;
        }

        .request-actions {
          display: flex;
          gap: 6px;
        }

        .accept-btn {
          background: #10b981;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 6px 12px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 500;
          transition: background 0.2s;
        }

        .accept-btn:hover {
          background: #059669;
        }

        .message-btn {
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 6px 12px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 500;
          transition: background 0.2s;
          display: flex;
          align-items: center;
        }

        .message-btn:hover {
          background: #2563eb;
        }

        .decline-btn {
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 6px 12px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 500;
          transition: background 0.2s;
        }

        .decline-btn:hover {
          background: #dc2626;
        }

        .earnings-section {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          border: 1px solid #f0f0f0;
        }

        .chart-container {
          margin-top: 8px;
        }

        .empty-state {
          text-align: center;
          padding: 40px 20px;
          color: #9ca3af;
        }

        .empty-state p {
          font-size: 15px;
          font-weight: 500;
          color: #6b7280;
          margin: 12px 0 4px;
        }

        .empty-state small {
          font-size: 13px;
          display: block;
          margin-bottom: 16px;
        }

        .empty-state button {
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 10px 18px;
          font-size: 13px;
          cursor: pointer;
          margin-top: 8px;
        }

        .add-service-form {
          margin-top: 16px;
          padding: 16px;
          background: #f9fafb;
          border-radius: 10px;
        }

        .add-service-form h4 {
          margin: 0 0 12px 0;
          font-size: 14px;
          font-weight: 600;
          color: #1f2937;
        }

        .form-input {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          font-size: 14px;
          margin-bottom: 10px;
          box-sizing: border-box;
        }

        .form-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .form-row {
          display: flex;
          gap: 10px;
        }

        .form-row .form-input {
          flex: 1;
        }

        .form-select {
          padding: 10px 12px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          font-size: 14px;
          background: white;
          cursor: pointer;
        }

        .form-actions {
          display: flex;
          gap: 10px;
          margin-top: 12px;
        }

        .cancel-btn {
          flex: 1;
          padding: 10px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          color: #6b7280;
        }

        .cancel-btn:hover {
          background: #f9fafb;
        }

        .save-btn {
          flex: 1;
          padding: 10px;
          background: #10b981;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          color: white;
        }

        .save-btn:hover {
          background: #059669;
        }

        .portfolio-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 16px;
          margin-top: 16px;
        }

        .portfolio-item {
          background: #f9fafb;
          border-radius: 10px;
          overflow: hidden;
          transition: transform 0.2s, box-shadow 0.2s;
          position: relative;
        }

        .portfolio-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .portfolio-image {
          width: 100%;
          height: 150px;
          object-fit: cover;
        }

        .portfolio-content {
          padding: 12px;
        }

        .portfolio-title {
          font-size: 14px;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 6px 0;
        }

        .portfolio-description {
          font-size: 12px;
          color: #6b7280;
          margin: 0;
          line-height: 1.4;
        }

        .portfolio-delete-btn {
          position: absolute;
          top: 8px;
          right: 8px;
          background: rgba(239, 68, 68, 0.9);
          color: white;
          border: none;
          border-radius: 6px;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .portfolio-item:hover .portfolio-delete-btn {
          opacity: 1;
        }

        .portfolio-delete-btn:hover {
          background: #dc2626;
        }

        .add-portfolio-form {
          margin-top: 16px;
          padding: 16px;
          background: #f9fafb;
          border-radius: 10px;
        }

        .add-portfolio-form h4 {
          margin: 0 0 12px 0;
          font-size: 14px;
          font-weight: 600;
          color: #1f2937;
        }

        .working-hours-section {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          border: 1px solid #f0f0f0;
        }

        .working-hours-table table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }

        .working-hours-table th {
          text-align: left;
          padding: 8px 12px;
          border-bottom: 2px solid #e5e7eb;
          color: #6b7280;
          font-weight: 600;
          font-size: 12px;
          text-transform: uppercase;
        }

        .working-hours-table td {
          padding: 8px 12px;
          border-bottom: 1px solid #f3f4f6;
        }

        .working-hours-table input[type="time"] {
          padding: 6px 8px;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          font-size: 13px;
        }

        .working-hours-table input[type="checkbox"] {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }

        @media (max-width: 1024px) {
          .stats-row {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (max-width: 768px) {
          .dashboard-container {
            padding: 16px;
          }
          
          .main-grid {
            grid-template-columns: 1fr;
          }
          
          .stats-row {
            grid-template-columns: repeat(3, 1fr);
          }
          
          .profile-left {
            flex-direction: column;
            align-items: center;
            text-align: center;
          }
          
          .meta-row {
            justify-content: center;
            flex-wrap: wrap;
          }
          
          .completion-header {
            flex-direction: column;
            gap: 4px;
          }
        }
      `}</style>
    </div>
  );
}
