const API_BASE = '/api';

async function safeFetch(url, options = {}) {
  try {
    const res = await fetch(url, options);
    const text = await res.text();
    
    if (!text || text.trim() === '') {
      if (res.ok) {
        return [];
      }
      return { 
        success: false, 
        error: res.status >= 500 ? 'Server error. Please try again later.' : 'Server returned empty response',
        status: res.status
      };
    }
    
    try {
      return JSON.parse(text);
    } catch (e) {
      console.error('JSON parse error at:', url, text.substring(0, 200));
      return { success: false, error: 'Invalid server response' };
    }
  } catch (err) {
    console.error('Network error connecting to:', url, err.message);
    return { success: false, error: 'Cannot connect to server. Is backend running?' };
  }
}

// Get userId from localStorage
export const getUserId = () => {
  try {
    const userStr = localStorage.getItem('user');
    
    if (!userStr) {
      return null;
    }
    
    const user = JSON.parse(userStr);
    const userId = user?.id || user?._id;

    if (!userId) {
      return null;
    }

    return userId;
  } catch (e) {
    return null;
  }
};

export const api = {
  // Auth
  login: async (email, password) => {
    return safeFetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
  },

  signup: async (userData) => {
    return safeFetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
  },

  getCurrentUser: async () => {
    return safeFetch(`${API_BASE}/auth/me`, {
      headers: { 'x-user-id': getUserId() },
    });
  },

  updateProfile: async (updates) => {
    return safeFetch(`${API_BASE}/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': getUserId(),
      },
      body: JSON.stringify(updates),
    });
  },

  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return safeFetch(`${API_BASE}/users/avatar`, {
      method: 'POST',
      headers: { 'x-user-id': getUserId() },
      body: formData,
    });
  },

  // Professions
  getProfessions: async () => {
    return safeFetch(`${API_BASE}/professions`);
  },

  addProfession: async (professionData) => {
    return safeFetch(`${API_BASE}/professions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(professionData),
    });
  },

  // Providers
  getProviders: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.profession) queryParams.append('profession', params.profession);
    if (params.search) queryParams.append('search', params.search);
    if (params.sort) queryParams.append('sort', params.sort);
    return safeFetch(`${API_BASE}/providers?${queryParams}`);
  },

  getProvider: async (id) => {
    return safeFetch(`${API_BASE}/providers/${id}`);
  },

  // Provider Services
  getProviderServices: async (providerId) => {
    return safeFetch(`${API_BASE}/providers/${providerId}/services`);
  },

  addService: async (serviceData) => {
    return safeFetch(`${API_BASE}/services`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': getUserId(),
      },
      body: JSON.stringify(serviceData),
    });
  },

  updateService: async (serviceId, serviceData) => {
    return safeFetch(`${API_BASE}/services/${serviceId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': getUserId(),
      },
      body: JSON.stringify(serviceData),
    });
  },

  deleteService: async (serviceId) => {
    return safeFetch(`${API_BASE}/services/${serviceId}`, {
      method: 'DELETE',
      headers: { 'x-user-id': getUserId() },
    });
  },

  // Portfolio
  getProviderPortfolio: async (providerId) => {
    return safeFetch(`${API_BASE}/providers/${providerId}/portfolio`);
  },

  addPortfolio: async (portfolioData) => {
    return safeFetch(`${API_BASE}/portfolio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': getUserId(),
      },
      body: JSON.stringify(portfolioData),
    });
  },

  uploadPortfolio: async (file, caption = '') => {
    const formData = new FormData();
    formData.append('image', file);
    if (caption) formData.append('caption', caption);
    return safeFetch(`${API_BASE}/portfolio/upload`, {
      method: 'POST',
      headers: { 'x-user-id': getUserId() },
      body: formData,
    });
  },

  deletePortfolio: async (portfolioId) => {
    return safeFetch(`${API_BASE}/portfolio/${portfolioId}`, {
      method: 'DELETE',
      headers: { 'x-user-id': getUserId() },
    });
  },

  // Service Requests
  createServiceRequest: async (requestData) => {
    return safeFetch(`${API_BASE}/service-requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': getUserId(),
      },
      body: JSON.stringify(requestData),
    });
  },

  getServiceRequests: async () => {
    return safeFetch(`${API_BASE}/service-requests`, {
      headers: { 'x-user-id': getUserId() },
    });
  },

  updateServiceRequest: async (requestId, status) => {
    return safeFetch(`${API_BASE}/service-requests/${requestId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': getUserId(),
      },
      body: JSON.stringify({ status }),
    });
  },

  // Posts
  getPosts: async () => {
    return safeFetch(`${API_BASE}/posts`, {
      headers: { 'x-user-id': getUserId() },
    });
  },

  createPost: async (postData) => {
    return safeFetch(`${API_BASE}/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': getUserId(),
      },
      body: JSON.stringify(postData),
    });
  },

  likePost: async (postId) => {
    return safeFetch(`${API_BASE}/posts/${postId}/like`, {
      method: 'POST',
      headers: { 'x-user-id': getUserId() },
    });
  },

  getComments: async (postId) => {
    return safeFetch(`${API_BASE}/posts/${postId}/comments`);
  },

  addComment: async (postId, content) => {
    return safeFetch(`${API_BASE}/posts/${postId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': getUserId(),
      },
      body: JSON.stringify({ content }),
    });
  },

  // Article Comments
  getArticleComments: async (articleId) => {
    return safeFetch(`${API_BASE}/articles/${articleId}/comments`);
  },

  addArticleComment: async (articleId, content) => {
    return safeFetch(`${API_BASE}/articles/${articleId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': getUserId(),
      },
      body: JSON.stringify({ content }),
    });
  },

  // Videos
  getVideos: async () => {
    return safeFetch(`${API_BASE}/videos`);
  },

  uploadVideo: async (videoFile, title, description) => {
    const formData = new FormData();
    formData.append('video', videoFile);
    if (title) formData.append('title', title);
    if (description) formData.append('description', description);
    return safeFetch(`${API_BASE}/videos`, {
      method: 'POST',
      headers: { 'x-user-id': getUserId() },
      body: formData,
    });
  },

  likeVideo: async (videoId) => {
    return safeFetch(`${API_BASE}/videos/${videoId}/like`, {
      method: 'POST',
      headers: { 'x-user-id': getUserId() },
    });
  },

  deleteVideo: async (videoId) => {
    return safeFetch(`${API_BASE}/videos/${videoId}`, {
      method: 'DELETE',
      headers: { 'x-user-id': getUserId() },
    });
  },

  // Articles
  getArticles: async () => {
    return safeFetch(`${API_BASE}/articles`);
  },

  getUserArticles: async (userId) => {
    return safeFetch(`${API_BASE}/users/${userId}/articles`);
  },

  createArticle: async (articleData) => {
    const formData = new FormData();
    if (articleData.title) formData.append('title', articleData.title);
    if (articleData.content) formData.append('content', articleData.content);
    if (articleData.image) formData.append('image', articleData.image);
    return safeFetch(`${API_BASE}/articles`, {
      method: 'POST',
      headers: { 'x-user-id': getUserId() },
      body: formData,
    });
  },

  likeArticle: async (articleId) => {
    return safeFetch(`${API_BASE}/articles/${articleId}/like`, {
      method: 'POST',
      headers: { 'x-user-id': getUserId() },
    });
  },

  deleteArticle: async (articleId) => {
    return safeFetch(`${API_BASE}/articles/${articleId}`, {
      method: 'DELETE',
      headers: { 'x-user-id': getUserId() },
    });
  },

  // Reviews
  getProviderReviews: async (providerId) => {
    return safeFetch(`${API_BASE}/providers/${providerId}/reviews`);
  },

  submitReview: async (reviewData) => {
    return safeFetch(`${API_BASE}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': getUserId(),
      },
      body: JSON.stringify(reviewData),
    });
  },

  // Follow
  followUser: async (targetUserId) => {
    return safeFetch(`${API_BASE}/follow/${targetUserId}`, {
      method: 'POST',
      headers: { 'x-user-id': getUserId() },
    });
  },

  followProvider: async (targetUserId) => {
    return safeFetch(`${API_BASE}/follow/${targetUserId}`, {
      method: 'POST',
      headers: { 'x-user-id': getUserId() },
    });
  },

  respondToFollowRequest: async (requestId, action) => {
    if (!requestId) {
      throw new Error('Request ID is required');
    }
    
    const userId = getUserId();
    console.log('respondToFollowRequest - userId:', userId, 'requestId:', requestId, 'action:', action);
    
    if (!userId) {
      throw new Error('User not logged in');
    }
    
    return safeFetch(`${API_BASE}/follow/respond`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
      body: JSON.stringify({ requestId, action }),
    });
},

  getFollowRequests: async () => {
    return safeFetch(`${API_BASE}/follow/requests`, {
      headers: { 'x-user-id': getUserId() },
    });
  },

  getMyFollowing: async () => {
    return safeFetch(`${API_BASE}/following`, {
      headers: { 'x-user-id': getUserId() },
    });
  },

  // Conversations & Messages
  getConversations: async () => {
    return safeFetch(`${API_BASE}/messages/conversations`, {
      headers: { 'x-user-id': getUserId() },
    });
  },

  getMessages: async (userId) => {
    return safeFetch(`${API_BASE}/messages/${userId}`, {
      headers: { 'x-user-id': getUserId() },
    });
  },

  sendMessage: async (receiverId, content) => {
    return safeFetch(`${API_BASE}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': getUserId(),
      },
      body: JSON.stringify({ receiverId, content }),
    });
  },

  uploadMedia: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return safeFetch(`${API_BASE}/messages/media`, {
      method: 'POST',
      headers: { 'x-user-id': getUserId() },
      body: formData,
    });
  },

  sendMediaMessage: async (receiverId, mediaUrl, type, content = '') => {
    return safeFetch(`${API_BASE}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': getUserId(),
      },
      body: JSON.stringify({ receiverId, content, mediaUrl, type }),
    });
  },

  // Notifications
  getNotifications: async () => {
    return safeFetch(`${API_BASE}/notifications`, {
      headers: { 'x-user-id': getUserId() },
    });
  },

  markNotificationsRead: async () => {
    return safeFetch(`${API_BASE}/notifications/read`, {
      method: 'PUT',
      headers: { 'x-user-id': getUserId() },
    });
  },

  getUnreadCount: async () => {
    return safeFetch(`${API_BASE}/notifications/unread-count`, {
      headers: { 'x-user-id': getUserId() },
    });
  },

  // Categories
  getCategories: async () => {
    return safeFetch(`${API_BASE}/categories`);
  },

  // User Search
  searchUsers: async (query) => {
    return safeFetch(`${API_BASE}/users/search?q=${encodeURIComponent(query)}`);
  },

  // Get single user
  getUser: async (userId) => {
    return safeFetch(`${API_BASE}/users/${userId}`);
  },

  // Followers / Following
  getFollowers: async (userId) => {
    return safeFetch(`${API_BASE}/follow/${userId}/followers`);
  },

  getFollowing: async (userId) => {
    return safeFetch(`${API_BASE}/follow/${userId}/following`);
  },
};
