const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('token');
}

async function safeFetch(url, options = {}) {
  try {
    const token = getToken();
    
    const headers = {
      ...options.headers,
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const isFormData = options.body instanceof FormData;
    
    if (!isFormData && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
    
    const res = await fetch(url, { ...options, headers });
    let data;
    
    try {
      const text = await res.text();
      data = text ? JSON.parse(text) : {};
    } catch (e) {
      console.error('JSON parse error at:', url);
      return { 
        success: false, 
        error: res.status >= 500 ? 'Server error. Please try again later.' : 'Invalid server response',
        status: res.status
      };
    }
    
    if (!res.ok) {
      console.error('API Error:', res.status, data);
      if (res.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/auth';
      }
      return { 
        ...data,
        success: false, 
        status: res.status,
        error: data?.error || `Request failed (${res.status})`
      };
    }
    
    return data;
  } catch (err) {
    console.error('Network error:', url, err);
    return { success: false, error: 'Cannot connect to server. Is backend running?' };
  }
}

export const api = {
  // Auth
  login: async (email, password) => {
    return safeFetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  signup: async (userData) => {
    return safeFetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  getCurrentUser: async () => {
    return safeFetch(`${API_BASE}/auth/me`);
  },

  updateProfile: async (updates) => {
    return safeFetch(`${API_BASE}/auth/profile`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return safeFetch(`${API_BASE}/auth/avatar`, {
      method: 'POST',
      body: formData,
    });
  },

  getSpecializations: async () => {
    return safeFetch(`${API_BASE}/auth/specializations`);
  },

  // Professions
  getProfessions: async () => {
    return safeFetch(`${API_BASE}/professions`);
  },

  addProfession: async (professionData) => {
    return safeFetch(`${API_BASE}/professions`, {
      method: 'POST',
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
    if (!providerId) return [];
    return safeFetch(`${API_BASE}/providers/${providerId}/services`);
  },

  addService: async (serviceData) => {
    return safeFetch(`${API_BASE}/services`, {
      method: 'POST',
      body: JSON.stringify(serviceData),
    });
  },

  updateService: async (serviceId, serviceData) => {
    return safeFetch(`${API_BASE}/services/${serviceId}`, {
      method: 'PUT',
      body: JSON.stringify(serviceData),
    });
  },

  deleteService: async (serviceId) => {
    return safeFetch(`${API_BASE}/services/${serviceId}`, {
      method: 'DELETE',
    });
  },

  // Portfolio
  getPortfolio: async (providerId) => {
    return safeFetch(`${API_BASE}/portfolio/${providerId}`);
  },

  addPortfolioItem: async (formData) => {
    return safeFetch(`${API_BASE}/portfolio`, { 
      method: 'POST', 
      body: formData 
    });
  },

  deletePortfolioItem: async (id) => {
    return safeFetch(`${API_BASE}/portfolio/${id}`, { 
      method: 'DELETE'
    });
  },

  // Service Requests (Service Marketplace)
  getServiceTypes: async () => {
    return safeFetch(`${API_BASE}/service-requests/service-types`);
  },

  getServiceRequests: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.status) queryParams.append('status', params.status);
    if (params.serviceType) queryParams.append('serviceType', params.serviceType);
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    const query = queryParams.toString();
    return safeFetch(`${API_BASE}/service-requests/all${query ? '?' + query : ''}`);
  },

  getProviderServiceRequests: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.status) queryParams.append('status', params.status);
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    const query = queryParams.toString();
    return safeFetch(`${API_BASE}/service-requests/provider${query ? '?' + query : ''}`);
  },

  getClientServiceRequests: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.status) queryParams.append('status', params.status);
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    const query = queryParams.toString();
    return safeFetch(`${API_BASE}/service-requests/client${query ? '?' + query : ''}`);
  },

  getServiceRequest: async (requestId) => {
    return safeFetch(`${API_BASE}/service-requests/${requestId}`);
  },

  createServiceRequest: async (requestData) => {
    return safeFetch(`${API_BASE}/service-requests`, {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
  },

  updateServiceRequest: async (requestId, updateData) => {
    return safeFetch(`${API_BASE}/service-requests/${requestId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  },

  deleteServiceRequest: async (requestId) => {
    return safeFetch(`${API_BASE}/service-requests/${requestId}`, {
      method: 'DELETE',
    });
  },

  applyToServiceRequest: async (requestId, applicationData) => {
    return safeFetch(`${API_BASE}/service-requests/${requestId}/apply`, {
      method: 'POST',
      body: JSON.stringify(applicationData || {}),
    });
  },

  cancelServiceApplication: async (requestId) => {
    return safeFetch(`${API_BASE}/service-requests/${requestId}/apply`, {
      method: 'DELETE',
    });
  },

  updateApplicationStatus: async (requestId, applicationId, status, message) => {
    return safeFetch(`${API_BASE}/service-requests/${requestId}/applications/${applicationId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, message }),
    });
  },

  completeServiceRequest: async (requestId) => {
    return safeFetch(`${API_BASE}/service-requests/${requestId}/complete`, {
      method: 'PUT',
    });
  },

  // Posts
  getPosts: async () => {
    return safeFetch(`${API_BASE}/posts`);
  },

  createPost: async (postData) => {
    const formData = new FormData();
    if (postData.content) formData.append('content', postData.content);
    if (postData.type) formData.append('type', postData.type);
    if (postData.serviceCategory) formData.append('serviceCategory', postData.serviceCategory);
    if (postData.images && postData.images.length > 0) {
      postData.images.forEach(image => formData.append('images', image));
    }
    return safeFetch(`${API_BASE}/posts`, {
      method: 'POST',
      body: formData,
    });
  },

  likePost: async (postId) => {
    return safeFetch(`${API_BASE}/posts/${postId}/like`, {
      method: 'POST',
    });
  },

  deletePost: async (postId) => {
    return safeFetch(`${API_BASE}/posts/${postId}`, {
      method: 'DELETE',
    });
  },

  getComments: async (postId) => {
    return safeFetch(`${API_BASE}/posts/${postId}/comments`);
  },

  addComment: async (postId, content) => {
    return safeFetch(`${API_BASE}/posts/${postId}/comments`, {
      method: 'POST',
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
      body: formData,
    });
  },

  likeVideo: async (videoId) => {
    return safeFetch(`${API_BASE}/videos/${videoId}/like`, {
      method: 'POST',
    });
  },

  incrementVideoView: async (videoId) => {
    return safeFetch(`${API_BASE}/videos/${videoId}/view`, {
      method: 'POST',
    });
  },

  deleteVideo: async (videoId) => {
    return safeFetch(`${API_BASE}/videos/${videoId}`, {
      method: 'DELETE',
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
    if (articleData.type) formData.append('type', articleData.type);
    if (articleData.images && articleData.images.length > 0) {
      articleData.images.forEach(image => formData.append('images', image));
    }
    return safeFetch(`${API_BASE}/articles`, {
      method: 'POST',
      body: formData,
    });
  },

  likeArticle: async (articleId) => {
    return safeFetch(`${API_BASE}/articles/${articleId}/like`, {
      method: 'POST',
    });
  },

  deleteArticle: async (articleId) => {
    return safeFetch(`${API_BASE}/articles/${articleId}`, {
      method: 'DELETE',
    });
  },

  // Reviews
  getProviderReviews: async (providerId) => {
    return safeFetch(`${API_BASE}/reviews/provider/${providerId}`);
  },

  submitReview: async (reviewData) => {
    if (reviewData.reviewId) {
      const { reviewId, ...updateData } = reviewData;
      return safeFetch(`${API_BASE}/reviews/${reviewId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });
    }
    return safeFetch(`${API_BASE}/reviews`, {
      method: 'POST',
      body: JSON.stringify(reviewData),
    });
  },

  deleteReview: async (reviewId) => {
    return safeFetch(`${API_BASE}/reviews/${reviewId}`, {
      method: 'DELETE',
    });
  },

  checkCanReview: async (providerId) => {
    return safeFetch(`${API_BASE}/reviews/can-review/${providerId}`);
  },

  getCompletedBookings: async () => {
    return safeFetch(`${API_BASE}/bookings?status=completed`);
  },

  // Follow
  followUser: async (targetUserId) => {
    return safeFetch(`${API_BASE}/follow/${targetUserId}`, {
      method: 'POST',
    });
  },

  respondToFollowRequest: async (requestId, action) => {
    if (!requestId) {
      throw new Error('Request ID is required');
    }
    
    console.log('respondToFollowRequest - requestId:', requestId, 'action:', action);
    
    return safeFetch(`${API_BASE}/follow/respond`, {
      method: 'POST',
      body: JSON.stringify({ requestId, action }),
    });
  },

  getFollowRequests: async () => {
    return safeFetch(`${API_BASE}/follow/requests`);
  },

  getMyFollowing: async () => {
    return safeFetch(`${API_BASE}/follow/following`);
  },

  // Conversations & Messages
  getConversations: async () => {
    return safeFetch(`${API_BASE}/messages/conversations`);
  },

  getMessages: async (userId) => {
    return safeFetch(`${API_BASE}/messages/${userId}`);
  },

  sendMessage: async (receiverId, content) => {
    return safeFetch(`${API_BASE}/messages`, {
      method: 'POST',
      body: JSON.stringify({ receiverId, content }),
    });
  },

  uploadMedia: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return safeFetch(`${API_BASE}/messages/media`, {
      method: 'POST',
      body: formData,
    });
  },

  sendMediaMessage: async (receiverId, mediaUrl, type, content = '') => {
    return safeFetch(`${API_BASE}/messages`, {
      method: 'POST',
      body: JSON.stringify({ receiverId, content, mediaUrl, type }),
    });
  },

  // Notifications
  getNotifications: async () => {
    return safeFetch(`${API_BASE}/notifications`);
  },

  markNotificationsRead: async () => {
    return safeFetch(`${API_BASE}/notifications/read`, {
      method: 'PUT',
    });
  },

  getUnreadCount: async () => {
    return safeFetch(`${API_BASE}/notifications/unread-count`);
  },

  // Categories
  getCategories: async () => {
    return safeFetch(`${API_BASE}/categories`);
  },

  // User Search
  searchUsers: async (query) => {
    return safeFetch(`${API_BASE}/users/search?q=${encodeURIComponent(query)}`);
  },

  // Search Providers by Service
  searchProvidersByService: async (service) => {
    return safeFetch(`${API_BASE}/providers/search?service=${encodeURIComponent(service)}`);
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

  checkFollowStatus: async (targetUserId) => {
    return safeFetch(`${API_BASE}/follow/status/${targetUserId}`);
  },

  // Provider Dashboard Stats
  getProviderStats: async (providerId) => {
    return safeFetch(`${API_BASE}/providers/${providerId}/stats`);
  },

  getWeeklyActivity: async (providerId) => {
    return safeFetch(`${API_BASE}/providers/${providerId}/activity`);
  },

  incrementProfileView: async (targetUserId) => {
    return safeFetch(`${API_BASE}/auth/users/${targetUserId}/view`, {
      method: 'PATCH',
    });
  },
};
