// frontend/src/components/ProfileScreen.jsx - CREATE THIS FILE

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { 
  FiUser, FiMail, FiPhone, FiMapPin, FiBriefcase, FiStar, 
  FiEdit2, FiSave, FiX, FiCamera, FiLoader, FiCheckCircle,
  FiClock, FiDollarSign, FiHeart, FiUsers, FiLogOut, FiArrowLeft,
  FiMessageCircle, FiCalendar, FiTool, FiAward, FiTrendingUp
} from 'react-icons/fi';

export default function ProfileScreen({ isDesktop, isViewingOther, onUserUpdate }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [services, setServices] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [reviews, setReviews] = useState([]);

  const isOwnProfile = !isViewingOther || 
    (currentUser.id === id) || 
    (currentUser.id === profile?.id);

  const userId = isViewingOther ? id : currentUser.id;

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      // Load user profile
      let userData;
      if (isViewingOther) {
        userData = await api.getUser(userId);
        const providerData = await api.getProvider(userId).catch(() => null);
        setProfile(providerData || userData);
      } else {
        userData = currentUser;
        setProfile(currentUser);
      }

      // Load stats
      if (currentUser.role === 'provider') {
        const stats = await api.getProviderStats(userId);
        const userStats = await api.getProviderDashboardStats();
        setProfile(prev => ({ ...prev, ...stats, ...userStats }));
        
        const servicesData = await api.getProviderServices(userId);
        setServices(servicesData || []);
        
        const portfolioData = await api.getPortfolio(userId);
        setPortfolio(portfolioData || []);
      }

      // Load reviews
      const reviewsData = await api.getProviderReviews(userId);
      setReviews(reviewsData || []);

      // Load follow counts
      const followers = await api.getFollowers(userId);
      const following = await api.getFollowing(userId);
      setFollowersCount(followers?.length || 0);
      setFollowingCount(following?.length || 0);

      // Check follow status
      if (isViewingOther && currentUser.id !== userId) {
        try {
          const followStatus = await api.checkFollowStatus(userId);
          setIsFollowing(followStatus?.following || false);
        } catch (err) {
          // Fallback to checking following list
          try {
            const myFollowingData = await api.getMyFollowing();
            const myFollowing = Array.isArray(myFollowingData) ? myFollowingData : (myFollowingData?.data || []);
            setIsFollowing(myFollowing.some((u) => String(u.id || u._id) === String(userId)));
          } catch (fallbackErr) {
            console.error('Error checking follow status:', fallbackErr);
            setIsFollowing(false);
          }
        }
      }

    } catch (err) {
      console.error('Error loading profile:', err);
      showToast('Failed to load profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    setIsSaving(true);
    try {
      const result = await api.updateProfile(editForm);
      if (result.success) {
        const updatedUser = result.user;
        setProfile(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        if (onUserUpdate) onUserUpdate(updatedUser);
        setIsEditing(false);
        showToast('Profile updated successfully!', 'success');
      } else {
        showToast(result.error || 'Failed to update profile', 'error');
      }
    } catch (err) {
      showToast('Failed to update profile', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image must be less than 5MB', 'error');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      showToast('Only JPEG, PNG, WebP, and GIF are allowed', 'error');
      return;
    }

    setAvatarFile(file);
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);

    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const result = await api.uploadAvatar(file);
      if (result.success) {
        setProfile(prev => ({ ...prev, avatar: result.filePath }));
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        user.avatar = result.filePath;
        localStorage.setItem('user', JSON.stringify(user));
        showToast('Avatar updated!', 'success');
      }
    } catch (err) {
      showToast('Failed to upload avatar', 'error');
    }
  };

  const handleFollowToggle = async () => {
    try {
      const result = await api.followUser(userId);
      setIsFollowing(result.following);
      setFollowersCount(prev => result.following ? prev + 1 : prev - 1);
      showToast(result.following ? `Following ${profile.name}` : `Unfollowed ${profile.name}`, 'success');
    } catch (err) {
      showToast('Failed to update follow status', 'error');
    }
  };

  const StarRating = ({ rating, count }) => (
    <div className="flex items-center gap-2">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <FiStar
            key={star}
            className={`${star <= Math.floor(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
            size={16}
          />
        ))}
      </div>
      <span className="text-sm font-medium">{rating?.toFixed(1) || 0}</span>
      {count > 0 && <span className="text-sm text-gray-500">({count})</span>}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-gray-500">User not found</p>
        <button onClick={() => navigate('/home')} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg">
          Go Home
        </button>
      </div>
    );
  }

  if (!isDesktop) {
    // Mobile Layout
    return (
      <div className="flex flex-col min-h-screen bg-gray-50 pb-24">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between p-4">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
              <FiArrowLeft className="text-xl" />
            </button>
            <h1 className="text-lg font-bold">
              {isOwnProfile ? 'My Profile' : profile.name}
            </h1>
            {isOwnProfile && (
              <button onClick={() => setIsEditing(!isEditing)} className="p-2 text-blue-500">
                <FiEdit2 className="text-xl" />
              </button>
            )}
            {!isOwnProfile && (
              <button onClick={handleFollowToggle} className={`px-4 py-2 rounded-lg text-sm font-medium ${isFollowing ? 'bg-gray-100 text-gray-700' : 'bg-blue-500 text-white'}`}>
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            )}
          </div>
        </header>

        {/* Profile Info */}
        <div className="bg-white p-6 text-center border-b border-gray-100">
          <div className="relative inline-block">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 mx-auto">
              {avatarPreview ? (
                <img src={avatarPreview} className="w-full h-full object-cover" />
              ) : profile.avatar ? (
                <img src={profile.avatar.startsWith('http') ? profile.avatar : window.location.origin + profile.avatar} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600">
                  <span className="text-3xl font-bold text-white">{profile.name?.charAt(0)}</span>
                </div>
              )}
            </div>
            {isOwnProfile && (
              <label className="absolute bottom-0 right-0 p-1.5 bg-blue-500 rounded-full cursor-pointer">
                <FiCamera className="text-white text-xs" />
                <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
              </label>
            )}
          </div>
          <h2 className="text-xl font-bold mt-3">{profile.name}</h2>
          {profile.role === 'provider' && (
            <p className="text-blue-600 text-sm font-medium mt-1">{profile.profession}</p>
          )}
          {profile.verified && (
            <div className="flex items-center justify-center gap-1 mt-1">
              <FiCheckCircle className="text-blue-500 text-sm" />
              <span className="text-xs text-gray-500">Verified Professional</span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-px bg-gray-200">
          <div className="bg-white p-3 text-center">
            <p className="text-lg font-bold">{profile.jobsDone || 0}</p>
            <p className="text-xs text-gray-500">Jobs Done</p>
          </div>
          <div className="bg-white p-3 text-center">
            <p className="text-lg font-bold">{followersCount}</p>
            <p className="text-xs text-gray-500">Followers</p>
          </div>
          <div className="bg-white p-3 text-center">
            <p className="text-lg font-bold">{followingCount}</p>
            <p className="text-xs text-gray-500">Following</p>
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <div className="bg-white mt-3 p-4">
            <p className="text-sm text-gray-600">{profile.bio}</p>
          </div>
        )}

        {/* Contact Info */}
        <div className="bg-white mt-3 p-4 space-y-3">
          <h3 className="font-semibold">Contact Information</h3>
          {profile.phone && (
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <FiPhone className="text-gray-400" />
              <span>{profile.phone}</span>
            </div>
          )}
          {profile.email && (
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <FiMail className="text-gray-400" />
              <span>{profile.email}</span>
            </div>
          )}
          {profile.location && (
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <FiMapPin className="text-gray-400" />
              <span>{profile.location}</span>
            </div>
          )}
          {profile.hourlyRate > 0 && (
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <FiDollarSign className="text-gray-400" />
              <span>{profile.hourlyRate} MAD/hour</span>
            </div>
          )}
        </div>

        {/* Services (Provider only) */}
        {profile.role === 'provider' && services.length > 0 && (
          <div className="bg-white mt-3 p-4">
            <h3 className="font-semibold mb-3">Services Offered</h3>
            <div className="space-y-2">
              {services.map(service => (
                <div key={service.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                  <span className="text-sm">{service.name}</span>
                  <span className="text-sm font-medium text-blue-600">{service.price} MAD</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reviews */}
        {reviews.length > 0 && (
          <div className="bg-white mt-3 p-4">
            <h3 className="font-semibold mb-3">Client Reviews</h3>
            <div className="space-y-3">
              {reviews.slice(0, 3).map(review => (
                <div key={review.id} className="border-b border-gray-100 pb-3 last:border-0">
                  <div className="flex items-center gap-2 mb-1">
                    <StarRating rating={review.rating} />
                    <span className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-gray-600">{review.comment}</p>
                  <p className="text-xs text-gray-400 mt-1">- {review.clientName}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="p-4 space-y-3 mt-3">
          {!isOwnProfile && (
            <button
              onClick={() => navigate(`/messages/${userId}`)}
              className="w-full py-3 bg-blue-500 text-white rounded-xl font-medium flex items-center justify-center gap-2"
            >
              <FiMessageCircle /> Send Message
            </button>
          )}
          {!isOwnProfile && currentUser.role === 'client' && profile.role === 'provider' && (
            <button
              onClick={() => navigate(`/book/${userId}`)}
              className="w-full py-3 border border-blue-500 text-blue-500 rounded-xl font-medium"
            >
              Book Service
            </button>
          )}
          {isOwnProfile && (
            <button
              onClick={() => {
                localStorage.removeItem('user');
                localStorage.removeItem('token');
                localStorage.removeItem('userId');
                navigate('/auth');
              }}
              className="w-full py-3 border border-red-300 text-red-600 rounded-xl font-medium flex items-center justify-center gap-2"
            >
              <FiLogOut /> Sign Out
            </button>
          )}
        </div>

        {/* Edit Modal */}
        {isEditing && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-bold">Edit Profile</h3>
                <button onClick={() => setIsEditing(false)} className="p-1">
                  <FiX className="text-xl" />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input
                    type="text"
                    value={editForm.name !== undefined ? editForm.name : profile.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full p-3 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input
                    type="tel"
                    value={editForm.phone !== undefined ? editForm.phone : profile.phone || ''}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full p-3 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Location</label>
                  <input
                    type="text"
                    value={editForm.location !== undefined ? editForm.location : profile.location || ''}
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                    className="w-full p-3 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Bio</label>
                  <textarea
                    value={editForm.bio !== undefined ? editForm.bio : profile.bio || ''}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    className="w-full p-3 border rounded-lg resize-none"
                    rows={3}
                  />
                </div>
                {profile.role === 'provider' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-1">Hourly Rate (MAD)</label>
                      <input
                        type="number"
                        value={editForm.hourlyRate !== undefined ? editForm.hourlyRate : profile.hourlyRate || 0}
                        onChange={(e) => setEditForm({ ...editForm, hourlyRate: parseFloat(e.target.value) })}
                        className="w-full p-3 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Specialization</label>
                      <input
                        type="text"
                        value={editForm.specialization !== undefined ? editForm.specialization : profile.profession || profile.specialization || ''}
                        onChange={(e) => setEditForm({ ...editForm, specialization: e.target.value })}
                        className="w-full p-3 border rounded-lg"
                      />
                    </div>
                  </>
                )}
              </div>
              <div className="flex gap-3 p-4 border-t">
                <button onClick={() => setIsEditing(false)} className="flex-1 py-3 border rounded-lg">
                  Cancel
                </button>
                <button onClick={handleUpdateProfile} disabled={isSaving} className="flex-1 py-3 bg-blue-500 text-white rounded-lg">
                  {isSaving ? <FiLoader className="animate-spin inline" /> : <FiSave className="inline mr-1" />}
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Profile Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-blue-500 to-blue-600"></div>
        <div className="px-6 pb-6">
          <div className="flex items-end -mt-12 mb-4">
            <div className="relative">
              <div className="w-28 h-28 rounded-full overflow-hidden bg-gray-200 border-4 border-white shadow-lg">
                {avatarPreview ? (
                  <img src={avatarPreview} className="w-full h-full object-cover" />
                ) : profile.avatar ? (
                  <img src={profile.avatar.startsWith('http') ? profile.avatar : window.location.origin + profile.avatar} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600">
                    <span className="text-4xl font-bold text-white">{profile.name?.charAt(0)}</span>
                  </div>
                )}
              </div>
              {isOwnProfile && (
                <label className="absolute bottom-0 right-0 p-2 bg-blue-500 rounded-full cursor-pointer shadow-md">
                  <FiCamera className="text-white text-sm" />
                  <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                </label>
              )}
            </div>
            <div className="flex-1 ml-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold">{profile.name}</h1>
                  {profile.role === 'provider' && (
                    <p className="text-blue-600 font-medium">{profile.profession}</p>
                  )}
                </div>
                <div className="flex gap-3">
                  {!isOwnProfile && (
                    <>
                      <button onClick={handleFollowToggle} className={`px-5 py-2 rounded-lg font-medium ${isFollowing ? 'bg-gray-100 text-gray-700' : 'bg-blue-500 text-white'}`}>
                        {isFollowing ? 'Following' : 'Follow'}
                      </button>
                      <button onClick={() => navigate(`/messages/${userId}`)} className="px-5 py-2 border border-blue-500 text-blue-500 rounded-lg font-medium">
                        Message
                      </button>
                      {currentUser.role === 'client' && profile.role === 'provider' && (
                        <button onClick={() => navigate(`/book/${userId}`)} className="px-5 py-2 bg-blue-500 text-white rounded-lg font-medium">
                          Book Service
                        </button>
                      )}
                    </>
                  )}
                  {isOwnProfile && (
                    <button onClick={() => setIsEditing(true)} className="px-5 py-2 border border-gray-200 rounded-lg font-medium flex items-center gap-2">
                      <FiEdit2 /> Edit Profile
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {profile.verified && (
            <div className="flex items-center gap-1 mt-2">
              <FiCheckCircle className="text-blue-500" />
              <span className="text-sm text-gray-600">Verified Professional</span>
            </div>
          )}
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-4 gap-4 px-6 py-4 bg-gray-50 border-t border-gray-100">
          <div className="text-center">
            <p className="text-2xl font-bold">{profile.jobsDone || 0}</p>
            <p className="text-xs text-gray-500">Jobs Completed</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{followersCount}</p>
            <p className="text-xs text-gray-500">Followers</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{followingCount}</p>
            <p className="text-xs text-gray-500">Following</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{profile.rating?.toFixed(1) || 0}</p>
            <p className="text-xs text-gray-500">Rating</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left Column - Bio & Contact */}
        <div className="col-span-1 space-y-6">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <h3 className="font-semibold mb-3">About</h3>
            <p className="text-gray-600 text-sm">{profile.bio || 'No bio provided yet.'}</p>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <h3 className="font-semibold mb-3">Contact</h3>
            <div className="space-y-2 text-sm">
              {profile.phone && (
                <div className="flex items-center gap-2 text-gray-600">
                  <FiPhone className="text-gray-400" /> {profile.phone}
                </div>
              )}
              {profile.email && (
                <div className="flex items-center gap-2 text-gray-600">
                  <FiMail className="text-gray-400" /> {profile.email}
                </div>
              )}
              {profile.location && (
                <div className="flex items-center gap-2 text-gray-600">
                  <FiMapPin className="text-gray-400" /> {profile.location}
                </div>
              )}
              {profile.hourlyRate > 0 && (
                <div className="flex items-center gap-2 text-gray-600">
                  <FiDollarSign className="text-gray-400" /> {profile.hourlyRate} MAD/hour
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Services & Reviews */}
        <div className="col-span-2 space-y-6">
          {profile.role === 'provider' && services.length > 0 && (
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
              <h3 className="font-semibold mb-3">Services Offered</h3>
              <div className="space-y-2">
                {services.map(service => (
                  <div key={service.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span>{service.name}</span>
                    <span className="font-medium text-blue-600">{service.price} MAD</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {reviews.length > 0 && (
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
              <h3 className="font-semibold mb-3">Reviews ({reviews.length})</h3>
              <div className="space-y-4">
                {reviews.map(review => (
                  <div key={review.id} className="border-b border-gray-100 pb-4 last:border-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <StarRating rating={review.rating} />
                        <span className="text-sm font-medium">{review.clientName}</span>
                      </div>
                      <span className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-gray-600 text-sm">{review.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal (Desktop) */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-xl font-bold">Edit Profile</h3>
              <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <FiX className="text-xl" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={editForm.name !== undefined ? editForm.name : profile.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  type="tel"
                  value={editForm.phone !== undefined ? editForm.phone : profile.phone || ''}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Location</label>
                <input
                  type="text"
                  value={editForm.location !== undefined ? editForm.location : profile.location || ''}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Bio</label>
                <textarea
                  value={editForm.bio !== undefined ? editForm.bio : profile.bio || ''}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  className="w-full p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                />
              </div>
              {profile.role === 'provider' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Hourly Rate (MAD)</label>
                    <input
                      type="number"
                      value={editForm.hourlyRate !== undefined ? editForm.hourlyRate : profile.hourlyRate || 0}
                      onChange={(e) => setEditForm({ ...editForm, hourlyRate: parseFloat(e.target.value) })}
                      className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Specialization</label>
                    <input
                      type="text"
                      value={editForm.specialization !== undefined ? editForm.specialization : profile.profession || profile.specialization || ''}
                      onChange={(e) => setEditForm({ ...editForm, specialization: e.target.value })}
                      className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}
            </div>
            <div className="flex gap-3 p-6 border-t">
              <button onClick={() => setIsEditing(false)} className="flex-1 py-3 border rounded-lg font-medium">
                Cancel
              </button>
              <button onClick={handleUpdateProfile} disabled={isSaving} className="flex-1 py-3 bg-blue-500 text-white rounded-lg font-medium">
                {isSaving ? <FiLoader className="animate-spin inline mr-2" /> : <FiSave className="inline mr-2" />}
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}