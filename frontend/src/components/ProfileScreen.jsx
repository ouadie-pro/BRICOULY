import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

export default function ProfileScreen({ isDesktop, onUserUpdate }) {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedAvatar, setUploadedAvatar] = useState(null);
  const avatarInputRef = useRef(null);
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const loadUserData = async () => {
      if (currentUser.id) {
        try {
          if (currentUser.role === 'provider') {
            const providerData = await api.getProvider(currentUser.id);
            setUser(providerData);
            setName(providerData.name || '');
            setPhone(providerData.phone || '');
            setLocation(providerData.location || '');
            setBio(providerData.bio || '');
          } else {
            const userData = await api.getCurrentUser();
            setUser(userData);
            setName(userData.name || '');
            setPhone(userData.phone || '');
            setLocation(userData.address || '');
          }
        } catch (err) {
          console.error('Error loading user:', err);
        }
      }
    };
    loadUserData();
  }, [currentUser.id, currentUser.role]);

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const result = await api.uploadAvatar(file);
      console.log('Avatar upload result:', result);
      if (result.success) {
        // Create full URL for display
        const avatarUrl = `${window.location.origin}${result.filePath}?t=${Date.now()}`;
        console.log('Full avatar URL:', avatarUrl);
        
        // Set the uploaded avatar immediately
        setUploadedAvatar(avatarUrl);
        
        const updatedUser = { ...user, avatar: result.filePath };
        localStorage.setItem('user', JSON.stringify({ ...JSON.parse(localStorage.getItem('user') || '{}'), avatar: result.filePath }));
        
        // Update global user state
        if (onUserUpdate) {
          onUserUpdate({ ...user, avatar: result.filePath });
        }
        
        console.log('Avatar updated successfully');
      }
    } catch (err) {
      console.error('Error uploading avatar:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    console.log('Saving profile with:', { name, phone, location, bio });
    try {
      const updates = { name, phone, location };
      if (currentUser.role === 'provider') {
        updates.bio = bio;
      }

      console.log('Sending updates:', updates);
      const result = await api.updateProfile(updates);
      console.log('Update result:', result);
      if (result.success) {
        const updatedUser = { ...user, ...updates };
        console.log('Updated user:', updatedUser);
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Update global user state
        if (onUserUpdate) {
          onUserUpdate(updatedUser);
        }
        
        setIsEditing(false);
      } else {
        console.error('Update failed:', result.error);
      }
    } catch (err) {
      console.error('Error updating profile:', err);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background-light dark:bg-background-dark">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getAvatarUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${window.location.origin}${url}?t=${Date.now()}`;
  };

  // Use uploaded avatar if available, otherwise use user avatar
  const hasAvatar = uploadedAvatar || (user?.avatar && user.avatar.length > 0 && !user.avatar.includes('undefined'));
  const displayAvatar = uploadedAvatar || (user?.avatar ? getAvatarUrl(user.avatar) : null);

  if (!isDesktop) {
    return (
      <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark pb-24">
        <div className="sticky top-0 z-50 flex items-center bg-card-light dark:bg-card-dark p-4 pb-2 justify-between border-b border-gray-100 dark:border-gray-800 shadow-sm">
          <button 
            onClick={() => navigate(-1)}
            className="flex size-12 shrink-0 items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full justify-center transition-colors"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>arrow_back_ios_new</span>
          </button>
          <h2 className="text-text-light dark:text-text-dark text-lg font-bold leading-tight tracking-[-0.015em] text-center flex-1">My Profile</h2>
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className="flex size-12 shrink-0 items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-primary" style={{ fontSize: '24px' }}>{isEditing ? 'close' : 'edit'}</span>
          </button>
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
                    <span className="material-symbols-outlined text-white text-sm">verified</span>
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
                      <span className="material-symbols-outlined text-white text-sm">camera_alt</span>
                    )}
                  </button>
                )}
              </div>
              <input
                type="file"
                ref={avatarInputRef}
                onChange={handleAvatarChange}
                accept="image/*"
                className="hidden"
              />
              <div className="flex flex-col items-center justify-center">
                {isEditing ? (
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="text-center text-[22px] font-bold bg-transparent border-b border-primary focus:outline-none"
                  />
                ) : (
                  <p className="text-text-light dark:text-text-dark text-[22px] font-bold leading-tight tracking-[-0.015em] text-center">{user.name}</p>
                )}
                <p className="text-secondary-text-light dark:text-secondary-text-dark text-base font-medium leading-normal text-center">{user.role === 'provider' ? user.profession : 'Client'}</p>
              </div>
            </div>
          </div>

          {isEditing && (
            <div className="px-4 pb-4">
              <button
                onClick={handleSave}
                className="w-full py-3 bg-primary text-white rounded-xl font-medium"
              >
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
                <span className="material-symbols-outlined text-slate-400">mail</span>
                <div>
                  <p className="text-xs text-slate-500">Email</p>
                  <p className="text-sm font-medium text-text-light dark:text-text-dark">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                <span className="material-symbols-outlined text-slate-400">phone</span>
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
                <span className="material-symbols-outlined text-slate-400">location_on</span>
                <div>
                  <p className="text-xs text-slate-500">Location</p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="text-sm font-medium bg-transparent border-b border-primary focus:outline-none"
                      placeholder="Add location"
                    />
                  ) : (
                    <p className="text-sm font-medium text-text-light dark:text-text-dark">{user.location || user.address || 'Not set'}</p>
                  )}
                </div>
              </div>

              {currentUser.role === 'provider' && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <span className="material-symbols-outlined text-slate-400 mt-1">description</span>
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
                <span className="material-symbols-outlined text-slate-400">calendar_today</span>
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

  return (
    <div className="p-8 max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            isEditing 
              ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' 
              : 'bg-primary text-white hover:bg-blue-600'
          }`}
        >
          <span className="material-symbols-outlined">{isEditing ? 'close' : 'edit'}</span>
          {isEditing ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column - Profile Card */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <div className="flex flex-col items-center">
              <div className="relative mb-4">
                {hasAvatar ? (
                  <div
                    className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-40 w-40 border-4 border-slate-100 shadow-md"
                    style={{ backgroundImage: `url("${displayAvatar}")` }}
                  />
                ) : (
                  <div className="bg-slate-300 aspect-square rounded-full h-40 w-40 border-4 border-slate-100 shadow-md flex items-center justify-center">
                    <span className="text-5xl font-bold text-slate-500">
                      {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                    </span>
                  </div>
                )}
                {isEditing && (
                  <button
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={isUploading}
                    className="absolute bottom-2 right-2 bg-primary rounded-full p-2 border-4 border-white hover:bg-blue-600 transition-colors shadow-md"
                  >
                    {isUploading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <span className="material-symbols-outlined text-white text-sm">camera_alt</span>
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
                    <span className="material-symbols-outlined text-white text-sm">verified</span>
                  </div>
                )}
              </div>
              
              {isEditing ? (
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="text-center text-xl font-bold bg-transparent border-b border-primary focus:outline-none mb-1 w-full"
                />
              ) : (
                <h2 className="text-xl font-bold text-slate-900 text-center">{user.name}</h2>
              )}
              <p className="text-slate-500 text-center mb-4">{user.role === 'provider' ? user.profession : 'Client'}</p>

              <div className="flex justify-around w-full py-4 border-t border-b border-slate-100 mb-4">
                <div className="flex flex-col items-center">
                  <p className="text-lg font-bold text-slate-900">{user.jobsDone || 0}</p>
                  <p className="text-xs text-slate-500">Jobs Done</p>
                </div>
                <div className="w-px bg-slate-200"></div>
                <div className="flex flex-col items-center">
                  <p className="text-lg font-bold text-slate-900">{user.rating || 0}</p>
                  <p className="text-xs text-slate-500">Rating</p>
                </div>
                <div className="w-px bg-slate-200"></div>
                <div className="flex flex-col items-center">
                  <p className="text-lg font-bold text-slate-900">{user.reviewCount || 0}</p>
                  <p className="text-xs text-slate-500">Reviews</p>
                </div>
              </div>

              {isEditing && (
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

        {/* Right Column - Profile Information */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">Profile Information</h3>
            
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 rounded-lg bg-slate-50">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">mail</span>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-500">Email</p>
                  <p className="text-sm font-medium text-slate-900">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-lg bg-slate-50">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">phone</span>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-500">Phone</p>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="text-sm font-medium bg-transparent border-b border-primary focus:outline-none w-full"
                      placeholder="Add phone number"
                    />
                  ) : (
                    <p className="text-sm font-medium text-slate-900">{user.phone || 'Not set'}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-lg bg-slate-50">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">location_on</span>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-500">Location</p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="text-sm font-medium bg-transparent border-b border-primary focus:outline-none w-full"
                      placeholder="Add location"
                    />
                  ) : (
                    <p className="text-sm font-medium text-slate-900">{user.location || user.address || 'Not set'}</p>
                  )}
                </div>
              </div>

              {currentUser.role === 'provider' && (
                <div className="flex items-start gap-4 p-4 rounded-lg bg-slate-50">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary">description</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-500 mb-2">Bio</p>
                    {isEditing ? (
                      <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        className="text-sm font-medium bg-transparent border border-slate-200 rounded-lg p-2 w-full resize-none focus:outline-none focus:border-primary"
                        rows={4}
                        placeholder="Add bio"
                      />
                    ) : (
                      <p className="text-sm font-medium text-slate-900">{user.bio || 'Not set'}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4 p-4 rounded-lg bg-slate-50">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">calendar_today</span>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Member Since</p>
                  <p className="text-sm font-medium text-slate-900">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
