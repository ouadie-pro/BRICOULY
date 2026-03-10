const API_BASE = '/api';

export const getUserId = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return user.id;
};

export const api = {
  // Auth
  login: async (email, password) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return res.json();
  },

  signup: async (userData) => {
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    return res.json();
  },

  getCurrentUser: async () => {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { 'x-user-id': getUserId() },
    });
    return res.json();
  },

  updateProfile: async (updates) => {
    const res = await fetch(`${API_BASE}/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': getUserId(),
      },
      body: JSON.stringify(updates),
    });
    return res.json();
  },

  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const userId = getUserId();
    const res = await fetch(`${API_BASE}/users/avatar`, {
      method: 'POST',
      headers: { 'x-user-id': userId },
      body: formData,
    });
    return res.json();
  },

  // Professions
  getProfessions: async () => {
    const res = await fetch(`${API_BASE}/professions`);
    return res.json();
  },

  addProfession: async (professionData) => {
    const res = await fetch(`${API_BASE}/professions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(professionData),
    });
    return res.json();
  },

  // Providers
  getProviders: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.profession) queryParams.append('profession', params.profession);
    if (params.search) queryParams.append('search', params.search);
    if (params.sort) queryParams.append('sort', params.sort);

    const res = await fetch(`${API_BASE}/providers?${queryParams}`);
    return res.json();
  },

  getProvider: async (id) => {
    const res = await fetch(`${API_BASE}/providers/${id}`);
    return res.json();
  },

  // Provider Services
  getProviderServices: async (providerId) => {
    const res = await fetch(`${API_BASE}/providers/${providerId}/services`);
    return res.json();
  },

  addService: async (serviceData) => {
    const res = await fetch(`${API_BASE}/services`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': getUserId(),
      },
      body: JSON.stringify(serviceData),
    });
    return res.json();
  },

  updateService: async (serviceId, serviceData) => {
    const res = await fetch(`${API_BASE}/services/${serviceId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': getUserId(),
      },
      body: JSON.stringify(serviceData),
    });
    return res.json();
  },

  deleteService: async (serviceId) => {
    const res = await fetch(`${API_BASE}/services/${serviceId}`, {
      method: 'DELETE',
      headers: { 'x-user-id': getUserId() },
    });
    return res.json();
  },

  // Portfolio
  getProviderPortfolio: async (providerId) => {
    const res = await fetch(`${API_BASE}/providers/${providerId}/portfolio`);
    return res.json();
  },

  addPortfolio: async (portfolioData) => {
    const res = await fetch(`${API_BASE}/portfolio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': getUserId(),
      },
      body: JSON.stringify(portfolioData),
    });
    return res.json();
  },

  deletePortfolio: async (portfolioId) => {
    const res = await fetch(`${API_BASE}/portfolio/${portfolioId}`, {
      method: 'DELETE',
      headers: { 'x-user-id': getUserId() },
    });
    return res.json();
  },

  // Service Requests
  createServiceRequest: async (requestData) => {
    const res = await fetch(`${API_BASE}/service-requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': getUserId(),
      },
      body: JSON.stringify(requestData),
    });
    return res.json();
  },

  getServiceRequests: async () => {
    const res = await fetch(`${API_BASE}/service-requests`, {
      headers: { 'x-user-id': getUserId() },
    });
    return res.json();
  },

  updateServiceRequest: async (requestId, status) => {
    const res = await fetch(`${API_BASE}/service-requests/${requestId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': getUserId(),
      },
      body: JSON.stringify({ status }),
    });
    return res.json();
  },

  // Posts
  getPosts: async () => {
    const res = await fetch(`${API_BASE}/posts`);
    return res.json();
  },

  createPost: async (postData) => {
    const res = await fetch(`${API_BASE}/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': getUserId(),
      },
      body: JSON.stringify(postData),
    });
    return res.json();
  },

  likePost: async (postId) => {
    const res = await fetch(`${API_BASE}/posts/${postId}/like`, {
      method: 'POST',
    });
    return res.json();
  },

  // Videos
  getVideos: async () => {
    const res = await fetch(`${API_BASE}/videos`);
    return res.json();
  },

  uploadVideo: async (videoFile, title, description) => {
    const formData = new FormData();
    formData.append('video', videoFile);
    if (title) formData.append('title', title);
    if (description) formData.append('description', description);
    const res = await fetch(`${API_BASE}/videos`, {
      method: 'POST',
      headers: { 'x-user-id': getUserId() },
      body: formData,
    });
    return res.json();
  },

  likeVideo: async (videoId) => {
    const res = await fetch(`${API_BASE}/videos/${videoId}/like`, {
      method: 'POST',
    });
    return res.json();
  },

  deleteVideo: async (videoId) => {
    const res = await fetch(`${API_BASE}/videos/${videoId}`, {
      method: 'DELETE',
      headers: { 'x-user-id': getUserId() },
    });
    return res.json();
  },

  // Articles
  getArticles: async () => {
    const res = await fetch(`${API_BASE}/articles`);
    return res.json();
  },

  getUserArticles: async (userId) => {
    const res = await fetch(`${API_BASE}/users/${userId}/articles`);
    return res.json();
  },

  createArticle: async (articleData) => {
    const formData = new FormData();
    if (articleData.title) formData.append('title', articleData.title);
    if (articleData.content) formData.append('content', articleData.content);
    if (articleData.image) formData.append('image', articleData.image);
    const res = await fetch(`${API_BASE}/articles`, {
      method: 'POST',
      headers: { 'x-user-id': getUserId() },
      body: formData,
    });
    return res.json();
  },

  likeArticle: async (articleId) => {
    const res = await fetch(`${API_BASE}/articles/${articleId}/like`, {
      method: 'POST',
    });
    return res.json();
  },

  deleteArticle: async (articleId) => {
    const res = await fetch(`${API_BASE}/articles/${articleId}`, {
      method: 'DELETE',
      headers: { 'x-user-id': getUserId() },
    });
    return res.json();
  },

  // Reviews
  getProviderReviews: async (providerId) => {
    const res = await fetch(`${API_BASE}/providers/${providerId}/reviews`);
    return res.json();
  },

  // Fixed: now accepts an object to match ReviewScreen usage
  submitReview: async (reviewData) => {
    const res = await fetch(`${API_BASE}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': getUserId(),
      },
      body: JSON.stringify(reviewData),
    });
    return res.json();
  },

  // Follow — works for any user (client, provider, etc.)
  followUser: async (targetUserId) => {
    const res = await fetch(`${API_BASE}/follow/${targetUserId}`, {
      method: 'POST',
      headers: { 'x-user-id': getUserId() },
    });
    return res.json();
  },

  // Keep old name as alias so existing callers still work
  followProvider: async (targetUserId) => {
    const res = await fetch(`${API_BASE}/follow/${targetUserId}`, {
      method: 'POST',
      headers: { 'x-user-id': getUserId() },
    });
    return res.json();
  },

  respondToFollowRequest: async (requestId, action) => {
    const res = await fetch(`${API_BASE}/follow/respond`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': getUserId(),
      },
      body: JSON.stringify({ requestId, action }),
    });
    return res.json();
  },

  getFollowRequests: async () => {
    const res = await fetch(`${API_BASE}/follow/requests`, {
      headers: { 'x-user-id': getUserId() },
    });
    return res.json();
  },

  // Get IDs of users the CURRENT user follows (no param)
  getMyFollowing: async () => {
    const res = await fetch(`${API_BASE}/following`, {
      headers: { 'x-user-id': getUserId() },
    });
    return res.json();
  },

  // Conversations & Messages
  getConversations: async () => {
    const res = await fetch(`${API_BASE}/conversations`, {
      headers: { 'x-user-id': getUserId() },
    });
    return res.json();
  },

  getMessages: async (userId) => {
    const res = await fetch(`${API_BASE}/messages/${userId}`, {
      headers: { 'x-user-id': getUserId() },
    });
    return res.json();
  },

  sendMessage: async (receiverId, content) => {
    const res = await fetch(`${API_BASE}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': getUserId(),
      },
      body: JSON.stringify({ receiverId, content }),
    });
    return res.json();
  },

  uploadMedia: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/messages/media`, {
      method: 'POST',
      headers: { 'x-user-id': getUserId() },
      body: formData,
    });
    return res.json();
  },

  sendMediaMessage: async (receiverId, mediaUrl, type, content = '') => {
    const res = await fetch(`${API_BASE}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': getUserId(),
      },
      body: JSON.stringify({ receiverId, content, mediaUrl, type }),
    });
    return res.json();
  },

  // Notifications
  getNotifications: async () => {
    const res = await fetch(`${API_BASE}/notifications`, {
      headers: { 'x-user-id': getUserId() },
    });
    return res.json();
  },

  markNotificationsRead: async () => {
    const res = await fetch(`${API_BASE}/notifications/read`, {
      method: 'PUT',
      headers: { 'x-user-id': getUserId() },
    });
    return res.json();
  },

  getUnreadCount: async () => {
    const res = await fetch(`${API_BASE}/notifications/unread-count`, {
      headers: { 'x-user-id': getUserId() },
    });
    return res.json();
  },

  // Categories
  getCategories: async () => {
    const res = await fetch(`${API_BASE}/categories`);
    return res.json();
  },

  // User Search
  searchUsers: async (query) => {
    const res = await fetch(`${API_BASE}/users/search?q=${encodeURIComponent(query)}`);
    return res.json();
  },

  // Get single user
  getUser: async (userId) => {
    const res = await fetch(`${API_BASE}/users/${userId}`);
    return res.json();
  },

  // Followers / Following for a specific user profile
  getFollowers: async (userId) => {
    const res = await fetch(`${API_BASE}/users/${userId}/followers`);
    return res.json();
  },

  getFollowing: async (userId) => {
    const res = await fetch(`${API_BASE}/users/${userId}/following`);
    return res.json();
  },
};
