import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../services/api';
import {
  FiArrowLeft, FiUserPlus, FiUserMinus, FiEdit, FiX, FiCheckCircle, FiCamera,
  FiMessageCircle, FiMail, FiPhone, FiMapPin, FiFileText, FiCalendar, FiPlus,
  FiTrash2, FiStar, FiCheck, FiUsers, FiImage, FiHeart
} from 'react-icons/fi';

export default function ProfileScreen({ isDesktop, onUserUpdate, isViewingOther }) {
  const { id: userId } = useParams();
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedAvatar, setUploadedAvatar] = useState(null);
  const [articles, setArticles] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followRequestSent, setFollowRequestSent] = useState(false);
  const [showArticleForm, setShowArticleForm] = useState(false);
  const [articleTitle, setArticleTitle] = useState('');
  const [articleContent, setArticleContent] = useState('');
  const [articleImage, setArticleImage] = useState(null);
  const [articleImagePreview, setArticleImagePreview] = useState(null);
  const [isSubmittingArticle, setIsSubmittingArticle] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
  const [portfolio, setPortfolio] = useState([]);
  const [showPortfolioForm, setShowPortfolioForm] = useState(false);
  const [portfolioImage, setPortfolioImage] = useState(null);
  const [portfolioImagePreview, setPortfolioImagePreview] = useState(null);
  const [portfolioCaption, setPortfolioCaption] = useState('');
  const [isUploadingPortfolio, setIsUploadingPortfolio] = useState(false);
  const avatarInputRef = useRef(null);
  const articleImageInputRef = useRef(null);
  const portfolioImageInputRef = useRef(null);
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const targetUserId = isViewingOther ? userId : currentUser.id;

  useEffect(() => {
    const loadUserData = async () => {
      if (!targetUserId) return;
      try {
        let userData;
        if (isViewingOther) {
          // Try provider first, fall back to plain user
          const providerData = await api.getProvider(targetUserId).catch(() => null);
          if (providerData && !providerData.error) {
            userData = providerData;
          } else {
            userData = await api.getUser(targetUserId);
          }
        } else if (currentUser.role === 'provider') {
          userData = await api.getProvider(currentUser.id);
        } else {
          userData = await api.getCurrentUser();
        }

        if (userData) {
          setUser(userData);
          setName(userData.name || '');
          setPhone(userData.phone || '');
          setLocation(userData.location || userData.address || '');
          setBio(userData.bio || '');
        }

        const [userArticles, userFollowers, userFollowing, userReviews] = await Promise.all([
          api.getUserArticles(targetUserId),
          api.getFollowers(targetUserId),
          api.getFollowing(targetUserId),
          api.getProviderReviews?.(targetUserId).catch(() => []),
        ]);
        setArticles(userArticles || []);
        setFollowers(userFollowers || []);
        setFollowing(userFollowing || []);
        setReviews(userReviews || []);

        // Fetch portfolio if user is a provider
        if (userData?.role === 'provider' || currentUser.role === 'provider') {
          const portfolioData = await api.getProviderPortfolio(targetUserId);
          setPortfolio(portfolioData || []);
        }

        // Check if current user already follows this profile
        if (isViewingOther && currentUser.id) {
          const myFollowingIds = await api.getMyFollowing();
          if (Array.isArray(myFollowingIds)) {
            setIsFollowing(myFollowingIds.some((id) => String(id) === String(targetUserId)));
          }
        }
      } catch (err) {
        console.error('Error loading user:', err);
      }
    };
    loadUserData();
  }, [targetUserId, currentUser.id, currentUser.role, isViewingOther]);

  // --- handleFollow must be defined BEFORE any early returns ---
  const handleFollow = async () => {
    if (followRequestSent) return;
    const res = await api.followProvider(targetUserId);
    if (res.success) {
      if (res.message === 'Follow request sent') {
        setFollowRequestSent(true);
      } else if (res.message === 'Request cancelled') {
        setFollowRequestSent(false);
        setIsFollowing(false);
      } else {
        setIsFollowing(res.following);
      }
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const result = await api.uploadAvatar(file);
      if (result.success) {
        const avatarUrl = `${window.location.origin}${result.filePath}?t=${Date.now()}`;
        setUploadedAvatar(avatarUrl);
        localStorage.setItem(
          'user',
          JSON.stringify({ ...JSON.parse(localStorage.getItem('user') || '{}'), avatar: result.filePath })
        );
        if (onUserUpdate) onUserUpdate({ ...user, avatar: result.filePath });
      }
    } catch (err) {
      console.error('Error uploading avatar:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      const updates = { name, phone, location };
      if (currentUser.role === 'provider') updates.bio = bio;
      const result = await api.updateProfile(updates);
      if (result.success) {
        const updatedUser = { ...user, ...updates };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        if (onUserUpdate) onUserUpdate(updatedUser);
        setIsEditing(false);
      }
    } catch (err) {
      console.error('Error updating profile:', err);
    }
  };

  const handleArticleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setArticleImage(file);
      setArticleImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmitArticle = async () => {
    if (!articleTitle.trim() || !articleContent.trim()) return;
    setIsSubmittingArticle(true);
    try {
      const result = await api.createArticle({ title: articleTitle, content: articleContent, image: articleImage });
      if (result.success) {
        setArticles([result.article, ...articles]);
        setShowArticleForm(false);
        setArticleTitle('');
        setArticleContent('');
        setArticleImage(null);
        setArticleImagePreview(null);
      }
    } catch (err) {
      console.error('Error creating article:', err);
    } finally {
      setIsSubmittingArticle(false);
    }
  };

  const handleLikeArticle = async (articleId) => {
    const res = await api.likeArticle(articleId);
    if (res.success) {
      setArticles(articles.map((a) => (a.id === articleId ? { ...a, likes: res.likes } : a)));
    }
  };

  const handlePortfolioImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPortfolioImage(file);
      setPortfolioImagePreview(URL.createObjectURL(file));
    }
  };

  const handleAddPortfolio = async () => {
    if (!portfolioImage) return;
    setIsUploadingPortfolio(true);
    try {
      const result = await api.uploadPortfolio(portfolioImage, portfolioCaption);
      if (result.success) {
        setPortfolio([result.portfolio, ...portfolio]);
        setShowPortfolioForm(false);
        setPortfolioImage(null);
        setPortfolioImagePreview(null);
        setPortfolioCaption('');
      }
    } catch (err) {
      console.error('Error uploading portfolio:', err);
    } finally {
      setIsUploadingPortfolio(false);
    }
  };

  const handleDeletePortfolio = async (portfolioId) => {
    try {
      const result = await api.deletePortfolio(portfolioId);
      if (result.success) {
        setPortfolio(portfolio.filter((p) => p._id !== portfolioId));
      }
    } catch (err) {
      console.error('Error deleting portfolio:', err);
    }
  };

  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString();

  const getAvatarUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${window.location.origin}${url}?t=${Date.now()}`;
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background-light dark:bg-background-dark">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const hasAvatar =
    uploadedAvatar || (user?.avatar && user.avatar.length > 0 && !user.avatar.includes('undefined'));
  const displayAvatar = uploadedAvatar || (user?.avatar ? getAvatarUrl(user.avatar) : null);

  const isOwnProfile = !isViewingOther;
  const followLabel = isFollowing ? 'Following' : followRequestSent ? 'Request Sent' : 'Follow';

  // ---- MOBILE ----
  if (!isDesktop) {
    return (
      <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark pb-24">
        <div className="sticky top-0 z-50 flex items-center bg-card-light dark:bg-card-dark p-4 pb-2 justify-between border-b border-gray-100 dark:border-gray-800 shadow-sm">
          <button
            onClick={() => navigate(-1)}
            className="flex size-12 shrink-0 items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full justify-center transition-colors"
          >
            <FiArrowLeft style={{ fontSize: '24px' }} />
          </button>
          <h2 className="text-text-light dark:text-text-dark text-lg font-bold leading-tight tracking-[-0.015em] text-center flex-1">
            {isViewingOther ? user?.name : 'My Profile'}
          </h2>
          {isViewingOther ? (
            <button
              onClick={handleFollow}
              disabled={followRequestSent}
              className={`flex items-center justify-center size-10 rounded-full font-medium transition-colors ${
                isFollowing || followRequestSent ? 'bg-slate-200 text-slate-700' : 'bg-primary text-white'
              }`}
            >
              {isFollowing ? <FiUserMinus style={{ fontSize: '20px' }} /> : <FiUserPlus style={{ fontSize: '20px' }} />}
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex size-12 shrink-0 items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full justify-center transition-colors"
            >
              {isEditing ? <FiX className="text-primary" style={{ fontSize: '24px' }} /> : <FiEdit className="text-primary" style={{ fontSize: '24px' }} />}
            </button>
          )}
        </div>

        <div className="flex flex-col">
          <div className="flex p-4 pb-2 bg-card-light dark:bg-card-dark pt-6">
            <div className="flex w-full flex-col gap-4 items-center">
              <div className="relative">
                {hasAvatar ? (
                  <div
                    className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-32 w-32 border-4 border-background-light dark:border-background-dark shadow-md"
                    style={{ backgroundImage: `url("${displayAvatar}")` }}
                  />
                ) : (
                  <div className="bg-slate-300 aspect-square rounded-full h-32 w-32 border-4 border-background-light dark:border-background-dark shadow-md flex items-center justify-center">
                    <span className="text-4xl font-bold text-slate-500">
                      {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                    </span>
                  </div>
                )}
                {user.verified && (
                  <div className="absolute bottom-1 right-1 bg-green-500 rounded-full p-1.5 border-4 border-card-light dark:border-card-dark">
                    <FiCheckCircle className="text-white text-sm" />
                  </div>
                )}
                {isEditing && (
                  <button
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={isUploading}
                    className="absolute bottom-1 right-1 bg-primary rounded-full p-2 border-4 border-card-light dark:border-card-dark hover:bg-blue-600 transition-colors"
                  >
                    {isUploading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <FiCamera className="text-white text-sm" />
                    )}
                  </button>
                )}
              </div>
              <input type="file" ref={avatarInputRef} onChange={handleAvatarChange} accept="image/*" className="hidden" />
              <div className="flex flex-col items-center justify-center">
                {isEditing ? (
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="text-center text-[22px] font-bold bg-transparent border-b border-primary focus:outline-none"
                  />
                ) : (
                  <p className="text-text-light dark:text-text-dark text-[22px] font-bold leading-tight tracking-[-0.015em] text-center">
                    {user.name}
                  </p>
                )}
                <p className="text-secondary-text-light dark:text-secondary-text-dark text-base font-medium leading-normal text-center">
                  {user.role === 'provider' ? user.profession : 'Client'}
                </p>
              </div>
            </div>
          </div>

          {/* Message button when viewing another user */}
          {isViewingOther && (
            <div className="px-4 pb-2">
              <button
                onClick={() => navigate(`/messages/${targetUserId}`)}
                className="w-full py-2 border border-primary text-primary rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-blue-50 transition-colors"
              >
                <FiMessageCircle className="text-[18px]" />
                Send Message
              </button>
            </div>
          )}

          {isEditing && (
            <div className="px-4 pb-4">
              <button onClick={handleSave} className="w-full py-3 bg-primary text-white rounded-xl font-medium">
                Save Changes
              </button>
            </div>
          )}

          <div className="flex justify-around py-4 bg-card-light dark:bg-card-dark border-b border-gray-100 dark:border-gray-800">
            <div className="flex flex-col items-center">
              <p className="text-lg font-bold text-text-light dark:text-text-dark">{user.jobsDone || 0}</p>
              <p className="text-xs text-secondary-text-light dark:text-secondary-text-dark uppercase tracking-wide">Jobs Done</p>
            </div>
            <div className="w-px bg-gray-200 dark:bg-gray-700"></div>
            <div className="flex flex-col items-center">
              <p className="text-lg font-bold text-text-light dark:text-text-dark">{user.rating || 0}</p>
              <p className="text-xs text-secondary-text-light dark:text-secondary-text-dark uppercase tracking-wide">Rating</p>
            </div>
            <div className="w-px bg-gray-200 dark:bg-gray-700"></div>
            <div className="flex flex-col items-center">
              <p className="text-lg font-bold text-text-light dark:text-text-dark">{user.reviewCount || 0}</p>
              <p className="text-xs text-secondary-text-light dark:text-secondary-text-dark uppercase tracking-wide">Reviews</p>
            </div>
          </div>

          <div className="p-4 bg-card-light dark:bg-card-dark">
            <h3 className="font-semibold text-text-light dark:text-text-dark mb-4">Profile Information</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                <FiMail className="text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Email</p>
                  <p className="text-sm font-medium text-text-light dark:text-text-dark">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                <FiPhone className="text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Phone</p>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="text-sm font-medium bg-transparent border-b border-primary focus:outline-none"
                      placeholder="Add phone number"
                    />
                  ) : (
                    <p className="text-sm font-medium text-text-light dark:text-text-dark">{user.phone || 'Not set'}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                <FiMapPin className="text-slate-400" />
                <div className="flex-1">
                  <p className="text-xs text-slate-500">Location</p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="text-sm font-medium bg-transparent border-b border-primary focus:outline-none w-full"
                      placeholder="Add location (e.g., Casablanca)"
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-text-light dark:text-text-dark">
                        {user.location || user.address || 'Not set'}
                      </p>
                      {!user.location && !user.address && !isEditing && !isViewingOther && (
                        <button
                          onClick={() => setIsEditing(true)}
                          className="text-xs text-primary font-medium hover:underline"
                        >
                          Add
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {currentUser.role === 'provider' && !isViewingOther && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <FiFileText className="text-slate-400 mt-1" />
                  <div>
                    <p className="text-xs text-slate-500">Bio</p>
                    {isEditing ? (
                      <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        className="text-sm font-medium bg-transparent border-b border-primary focus:outline-none w-full resize-none"
                        rows={3}
                        placeholder="Add bio"
                      />
                    ) : (
                      <p className="text-sm font-medium text-text-light dark:text-text-dark">{user.bio || 'Not set'}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                <FiCalendar className="text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Member Since</p>
                  <p className="text-sm font-medium text-text-light dark:text-text-dark">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---- DESKTOP ----
  return (
    <div className="p-8 max-w-5xl mx-auto w-full">
      {/* Banner */}
      <div className="h-40 rounded-t-2xl bg-gradient-to-r from-primary via-blue-500 to-purple-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgdmlld0JveD0iMCAwIDYwIDYwIj48ZyBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtNi42MjcgMC0xMiA1LjM3My0xMiAxMnM1LjM3MyAxMiAxMiAxMiAxMi01LjM3MyAxMi0xMi01LjM3My0xMi0xMi0xMnptMCAxOGMtMy4zMTQgMC02LTIuNjg2LTYtNnMyLjY4Ni02IDYtNiA2IDIuNjg2IDYgNi0yLjY4NiA2LTYgNnoiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjEiLz48L2c+PC9zdmc+')] opacity-30"></div>
      </div>
      
      <div className="bg-white rounded-b-2xl shadow-sm border border-slate-200 border-t-0 px-8 pb-8">
        {/* Avatar overlapping banner */}
        <div className="relative -mt-16 mb-4 flex justify-between items-end">
          <div className="relative">
            {hasAvatar ? (
              <div
                className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-32 w-32 border-4 border-white shadow-lg"
                style={{ backgroundImage: `url("${displayAvatar}")` }}
              />
            ) : (
              <div className="bg-slate-300 aspect-square rounded-full h-32 w-32 border-4 border-white shadow-lg flex items-center justify-center">
                <span className="text-5xl font-bold text-slate-500">
                  {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                </span>
              </div>
            )}
            {isEditing && !isViewingOther && (
              <button
                onClick={() => avatarInputRef.current?.click()}
                disabled={isUploading}
                className="absolute bottom-1 right-1 bg-primary rounded-full p-2 border-4 border-white hover:bg-blue-600 transition-colors shadow-md"
              >
                {isUploading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <FiCamera className="text-white text-sm" />
                )}
              </button>
            )}
            <input
              type="file"
              ref={avatarInputRef}
              onChange={handleAvatarChange}
              accept="image/*"
              className="hidden"
            />
            {user.verified && (
              <div className="absolute bottom-2 left-2 bg-green-500 rounded-full p-1.5 border-4 border-white">
                <FiCheckCircle className="text-white text-sm" />
              </div>
            )}
          </div>
          
          <div className="flex gap-3 mb-2">
            {isViewingOther ? (
              <>
                <button
                  onClick={() => navigate(`/messages/${targetUserId}`)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-primary text-primary hover:bg-blue-50 transition-colors font-medium"
                >
                  <FiMessageCircle />
                  Message
                </button>
                <button
                  onClick={handleFollow}
                  disabled={followRequestSent}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    isFollowing || followRequestSent
                      ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      : 'bg-primary text-white hover:bg-blue-600'
                  }`}
                >
                  {isFollowing ? <FiUserMinus /> : <FiUserPlus />}
                  {followLabel}
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isEditing ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' : 'bg-primary text-white hover:bg-blue-600'
                }`}
              >
                {isEditing ? <FiX /> : <FiEdit />}
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </button>
            )}
          </div>
        </div>
        
        {/* Name and title */}
        <div className="mb-6">
          {isEditing && !isViewingOther ? (
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-2xl font-bold bg-transparent border-b border-primary focus:outline-none w-full mb-1"
            />
          ) : (
            <h1 className="text-2xl font-bold text-slate-900">{user?.name}</h1>
          )}
          <p className="text-slate-500">{user?.role === 'provider' ? user?.profession : 'Client'}</p>
        </div>
        
        {/* Stats row */}
        <div className="flex gap-8 py-4 border-y border-slate-200 mb-6">
          <button
            onClick={() => setActiveTab('followers')}
            className="flex flex-col items-center hover:text-primary transition-colors"
          >
            <p className="text-xl font-bold text-slate-900">{followers.length}</p>
            <p className="text-sm text-slate-500">Followers</p>
          </button>
          <button
            onClick={() => setActiveTab('following')}
            className="flex flex-col items-center hover:text-primary transition-colors"
          >
            <p className="text-xl font-bold text-slate-900">{following.length}</p>
            <p className="text-sm text-slate-500">Following</p>
          </button>
          {user?.role === 'provider' && (
            <>
              <div className="flex flex-col items-center">
                <p className="text-xl font-bold text-slate-900">{user?.jobsDone || 0}</p>
                <p className="text-sm text-slate-500">Jobs Done</p>
              </div>
              <div className="flex flex-col items-center">
                <p className="text-xl font-bold text-slate-900 flex items-center gap-1">
                  <FiStar className="text-amber-400 text-lg" />
                  {user?.rating || 0}
                </p>
                <p className="text-sm text-slate-500">Rating</p>
              </div>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        {/* Left column - Info card */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">About</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <FiMail className="text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-500">Email</p>
                  <p className="text-sm font-medium text-slate-900">{user?.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <FiPhone className="text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-500">Phone</p>
                  {isEditing && !isViewingOther ? (
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="text-sm font-medium bg-transparent border-b border-primary focus:outline-none w-full"
                      placeholder="Add phone number"
                    />
                  ) : (
                    <p className="text-sm font-medium text-slate-900">{user?.phone || 'Not set'}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <FiMapPin className="text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-500">Location</p>
                  {isEditing && !isViewingOther ? (
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="text-sm font-medium bg-transparent border-b border-primary focus:outline-none w-full"
                      placeholder="Add location"
                    />
                  ) : (
                    <p className="text-sm font-medium text-slate-900">{user?.location || user?.address || 'Not set'}</p>
                  )}
                </div>
              </div>

              {(user?.role === 'provider' || user?.bio) && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <FiFileText className="text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-500 mb-1">Bio</p>
                    {isEditing && !isViewingOther && currentUser.role === 'provider' ? (
                      <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        className="text-sm font-medium bg-transparent border border-slate-200 rounded-lg p-2 w-full resize-none focus:outline-none focus:border-primary"
                        rows={3}
                        placeholder="Add bio"
                      />
                    ) : (
                      <p className="text-sm font-medium text-slate-900">{user?.bio || 'Not set'}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <FiCalendar className="text-primary" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Member Since</p>
                  <p className="text-sm font-medium text-slate-900">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>

              {isEditing && !isViewingOther && (
                <button
                  onClick={handleSave}
                  className="w-full py-3 rounded-xl font-medium bg-primary text-white hover:bg-blue-600 transition-colors"
                >
                  Save Changes
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right column - Tabs */}
        <div className="md:col-span-2">
          <div className="mt-6">
            <div className="flex gap-1 p-1 bg-slate-100 rounded-lg">
              {[
                'info', 
                'followers', 
                'following', 
                ...(user?.role === 'provider' || currentUser.role === 'provider' ? ['portfolio'] : []),
                ...(isViewingOther && user?.role === 'client' ? ['reviews'] : []),
                'articles'
              ].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2 px-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab === 'followers'
                    ? `Followers (${followers.length})`
                    : tab === 'following'
                    ? `Following (${following.length})`
                    : tab === 'articles'
                    ? `Articles (${articles.length})`
                    : tab === 'reviews'
                    ? `Reviews (${reviews.length})`
                    : 'Info'}
                </button>
              ))}
            </div>

            {activeTab === 'articles' && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-900">Articles</h3>
                  {isOwnProfile && (
                    <button
                      onClick={() => setShowArticleForm(true)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      <FiPlus className="text-[18px]" />
                      Write Article
                    </button>
                  )}
                </div>

                {showArticleForm && (
                  <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-surface-dark rounded-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
                      <h3 className="text-xl font-bold mb-4">Write Article</h3>
                      <div
                        onClick={() => articleImageInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center cursor-pointer hover:border-primary transition-colors mb-4"
                      >
                        {articleImagePreview ? (
                          <img
                            src={articleImagePreview}
                            alt="Preview"
                            className="w-full max-h-48 object-contain rounded"
                          />
                        ) : (
                          <>
                            <FiImage className="text-4xl text-slate-400" />
                            <p className="text-slate-500 mt-2">Add cover image (optional)</p>
                          </>
                        )}
                      </div>
                      <input
                        type="file"
                        ref={articleImageInputRef}
                        onChange={handleArticleImageSelect}
                        accept="image/*"
                        className="hidden"
                      />
                      <input
                        type="text"
                        value={articleTitle}
                        onChange={(e) => setArticleTitle(e.target.value)}
                        placeholder="Article title *"
                        className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent mb-3"
                      />
                      <textarea
                        value={articleContent}
                        onChange={(e) => setArticleContent(e.target.value)}
                        placeholder="Write your article content... *"
                        className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent resize-none"
                        rows={8}
                      />
                      <div className="flex gap-3 mt-6">
                        <button
                          onClick={() => {
                            setShowArticleForm(false);
                            setArticleTitle('');
                            setArticleContent('');
                            setArticleImage(null);
                            setArticleImagePreview(null);
                          }}
                          className="flex-1 py-3 rounded-lg border border-slate-200 font-medium"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSubmitArticle}
                          disabled={!articleTitle.trim() || !articleContent.trim() || isSubmittingArticle}
                          className="flex-1 py-3 rounded-lg bg-primary text-white font-medium disabled:opacity-50"
                        >
                          {isSubmittingArticle ? 'Publishing...' : 'Publish Article'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {articles.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 rounded-xl">
                    <FiFileText className="text-5xl text-slate-300" />
                    <p className="text-slate-500 mt-2">No articles yet</p>
                    {isOwnProfile && (
                      <button
                        onClick={() => setShowArticleForm(true)}
                        className="mt-3 px-4 py-2 bg-primary text-white text-sm rounded-lg"
                      >
                        Write Your First Article
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {articles.map((article) => (
                      <div key={article.id} className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
                        {article.imageUrl && (
                          <div
                            className="w-full h-48 rounded-lg bg-cover bg-center mb-4"
                            style={{ backgroundImage: `url("${window.location.origin}${article.imageUrl}")` }}
                          />
                        )}
                        <h4 className="font-bold text-slate-900 text-lg mb-2">{article.title}</h4>
                        <p className="text-slate-600 text-sm mb-3 line-clamp-3">{article.content}</p>
                        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                          <span className="text-xs text-slate-400">{formatDate(article.createdAt)}</span>
                          <button
                            onClick={() => handleLikeArticle(article.id)}
                            className="flex items-center gap-1 text-slate-500 hover:text-red-500 text-sm transition-colors"
                          >
                            <FiHeart className="text-[18px]" />
                            {article.likes}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'portfolio' && (user?.role === 'provider' || currentUser.role === 'provider') && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-900">Portfolio</h3>
                  {isOwnProfile && (
                    <button
                      onClick={() => setShowPortfolioForm(true)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      <FiPlus className="text-[18px]" />
                      Add Work
                    </button>
                  )}
                </div>

                {showPortfolioForm && (
                  <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-surface-dark rounded-2xl w-full max-w-md p-6">
                      <h3 className="text-xl font-bold mb-4">Add Portfolio Item</h3>
                      <div
                        onClick={() => portfolioImageInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center cursor-pointer hover:border-primary transition-colors mb-4"
                      >
                        {portfolioImagePreview ? (
                          <img
                            src={portfolioImagePreview}
                            alt="Preview"
                            className="w-full max-h-48 object-contain rounded"
                          />
                        ) : (
                          <>
                            <FiImage className="text-4xl text-slate-400" />
                            <p className="text-slate-500 mt-2">Click to select image</p>
                          </>
                        )}
                      </div>
                      <input
                        type="file"
                        ref={portfolioImageInputRef}
                        onChange={handlePortfolioImageSelect}
                        accept="image/*"
                        className="hidden"
                      />
                      <input
                        type="text"
                        value={portfolioCaption}
                        onChange={(e) => setPortfolioCaption(e.target.value)}
                        placeholder="Caption (optional)"
                        className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent mb-3"
                      />
                      <div className="flex gap-3 mt-6">
                        <button
                          onClick={() => {
                            setShowPortfolioForm(false);
                            setPortfolioImage(null);
                            setPortfolioImagePreview(null);
                            setPortfolioCaption('');
                          }}
                          className="flex-1 py-3 rounded-lg border border-slate-200 font-medium"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleAddPortfolio}
                          disabled={!portfolioImage || isUploadingPortfolio}
                          className="flex-1 py-3 rounded-lg bg-primary text-white font-medium disabled:opacity-50"
                        >
                          {isUploadingPortfolio ? 'Uploading...' : 'Add'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {portfolio.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 rounded-xl">
                    <FiImage className="text-5xl text-slate-300" />
                    <p className="text-slate-500 mt-2">No portfolio items yet</p>
                    {isOwnProfile && (
                      <button
                        onClick={() => setShowPortfolioForm(true)}
                        className="mt-3 px-4 py-2 bg-primary text-white text-sm rounded-lg"
                      >
                        Add Your First Work
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {portfolio.map((item) => (
                      <div key={item._id} className="relative group aspect-square rounded-xl overflow-hidden bg-slate-100">
                        <img
                          src={item.imageUrl?.startsWith('http') ? item.imageUrl : `${window.location.origin}${item.imageUrl}`}
                          alt={item.caption}
                          className="w-full h-full object-cover"
                        />
                        {item.caption && (
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                            <p className="text-white text-xs truncate">{item.caption}</p>
                          </div>
                        )}
                        {isOwnProfile && (
                          <button
                            onClick={() => handleDeletePortfolio(item._id)}
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-red-500 text-white p-1.5 rounded-full transition-opacity"
                          >
                            <FiTrash2 className="text-[16px]" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Reviews Received</h3>
                {reviews.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 rounded-xl">
                    <FiStar className="text-5xl text-slate-300" />
                    <p className="text-slate-500 mt-2">No reviews yet</p>
                    <p className="text-slate-400 text-sm mt-1">Reviews from providers will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                            <span className="text-sm font-bold text-slate-500">
                              {review.reviewerName?.charAt(0) || '?'}
                            </span>
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-slate-900">{review.reviewerName}</p>
                            <p className="text-xs text-slate-500">{review.reviewerProfession || 'Provider'}</p>
                          </div>
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <FiStar key={star} className={`text-sm ${star <= (review.rating || 0) ? 'text-amber-400' : 'text-slate-300'}`} />
                            ))}
                          </div>
                        </div>
                        {review.comment && (
                          <p className="text-sm text-slate-600">{review.comment}</p>
                        )}
                        <p className="text-xs text-slate-400 mt-2">
                          {formatDate(review.createdAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'followers' && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Followers</h3>
                {followers.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 rounded-xl">
                    <FiUsers className="text-5xl text-slate-300" />
                    <p className="text-slate-500 mt-2">No followers yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {followers.map((follower) => (
                      <div
                        key={follower.id}
                        className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm border border-slate-200"
                      >
                        <div
                          className="w-12 h-12 rounded-full bg-cover bg-center bg-slate-200 cursor-pointer"
                          style={{
                            backgroundImage: follower.avatar
                              ? `url("${window.location.origin}${follower.avatar}")`
                              : undefined,
                          }}
                          onClick={() =>
                            navigate(follower.role === 'provider' ? `/provider/${follower.id}` : `/user/${follower.id}`)
                          }
                        >
                          {!follower.avatar && (
                            <div className="w-full h-full rounded-full flex items-center justify-center">
                              <span className="text-sm font-bold text-slate-500">
                                {follower.name?.charAt(0).toUpperCase() || '?'}
                              </span>
                            </div>
                          )}
                        </div>
                        <div
                          className="flex-1 min-w-0 cursor-pointer"
                          onClick={() =>
                            navigate(follower.role === 'provider' ? `/provider/${follower.id}` : `/user/${follower.id}`)
                          }
                        >
                          <p className="font-semibold text-slate-900 truncate">{follower.name}</p>
                          <p className="text-xs text-slate-500 truncate">
                            {follower.role === 'provider' ? follower.profession : 'Client'}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            follower.role === 'provider' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {follower.role === 'provider' ? 'Provider' : 'Client'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'following' && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Following</h3>
                {following.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 rounded-xl">
                    <FiUsers className="text-5xl text-slate-300" />
                    <p className="text-slate-500 mt-2">Not following anyone yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {following.map((u) => (
                      <div
                        key={u.id}
                        className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm border border-slate-200"
                      >
                        <div
                          className="w-12 h-12 rounded-full bg-cover bg-center bg-slate-200 cursor-pointer"
                          style={{
                            backgroundImage: u.avatar
                              ? `url("${window.location.origin}${u.avatar}")`
                              : undefined,
                          }}
                          onClick={() =>
                            navigate(u.role === 'provider' ? `/provider/${u.id}` : `/user/${u.id}`)
                          }
                        >
                          {!u.avatar && (
                            <div className="w-full h-full rounded-full flex items-center justify-center">
                              <span className="text-sm font-bold text-slate-500">
                                {u.name?.charAt(0).toUpperCase() || '?'}
                              </span>
                            </div>
                          )}
                        </div>
                        <div
                          className="flex-1 min-w-0 cursor-pointer"
                          onClick={() => navigate(u.role === 'provider' ? `/provider/${u.id}` : `/user/${u.id}`)}
                        >
                          <p className="font-semibold text-slate-900 truncate">{u.name}</p>
                          <p className="text-xs text-slate-500 truncate">
                            {u.role === 'provider' ? u.profession : 'Client'}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            u.role === 'provider' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {u.role === 'provider' ? 'Provider' : 'Client'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
