// frontend/src/services/api.js
const API_BASE = (import.meta.env.VITE_API_URL || '') + '/api';

function getStoredUser() {
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    return JSON.parse(userStr);
  } catch (e) {
    console.error('Error parsing stored user:', e);
    return null;
  }
}

function getUserId() {
  const user = getStoredUser();
  if (!user) return null;
  return user?.id || user?._id || null;
}

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  const userId = getUserId();
  const headers = {};
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (userId) {
    headers['x-user-id'] = userId;
  }
  return headers;
}

async function safeFetch(url, options = {}) {
  try {
    const token = localStorage.getItem('token');
    const userId = getUserId();
    
    const headers = {
      ...options.headers,
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    if (userId) {
      headers['x-user-id'] = userId;
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

export { getUserId };

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

  // FIXED: Use correct /auth/profile endpoint
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
    const result = await safeFetch(`${API_BASE}/professions`);
    return Array.isArray(result) ? result : [];
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
    if (params.profession && params.profession !== '') queryParams.append('profession', params.profession);
    if (params.search && params.search.trim()) queryParams.append('search', params.search);
    if (params.sort) queryParams.append('sort', params.sort);
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    
    const url = `${API_BASE}/providers?${queryParams.toString()}`;
    const result = await safeFetch(url);
    
    if (result.data && Array.isArray(result.data)) {
      return result.data;
    }
    if (Array.isArray(result)) {
      return result;
    }
    return [];
  },

  getProvider: async (id) => {
    if (!id) return null;
    const result = await safeFetch(`${API_BASE}/providers/${id}`);
    return result;
  },

  // Provider Services
  getProviderServices: async (providerId) => {
    if (!providerId) return [];
    const result = await safeFetch(`${API_BASE}/providers/${providerId}/services`);
    return Array.isArray(result) ? result : [];
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
    return safeFetch(`${API_BASE}/providers/${providerId}/portfolio`);
  },

  addPortfolioItem: async (formData) => {
    return safeFetch(`${API_BASE}/portfolio/upload`, { 
      method: 'POST', 
      headers: getAuthHeaders(), 
      body: formData 
    });
  },

  deletePortfolioItem: async (id) => {
    return safeFetch(`${API_BASE}/portfolio/${id}`, { 
      method: 'DELETE', 
      headers: getAuthHeaders() 
    });
  },

  // Service Requests
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
    if (params.city) queryParams.append('city', params.city);
    if (params.minBudget) queryParams.append('minBudget', params.minBudget);
    if (params.maxBudget) queryParams.append('maxBudget', params.maxBudget);
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

  applyForServiceRequest: async (requestId, applicationData = {}) => {
    return safeFetch(`${API_BASE}/service-requests/${requestId}/apply`, {
      method: 'POST',
      body: JSON.stringify(applicationData),
    });
  },

  cancelServiceApplication: async (requestId) => {
    return safeFetch(`${API_BASE}/service-requests/${requestId}/cancel-application`, {
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

  sendMessage: async (receiverId, content, mediaUrl = null, audioUrl = null, type = 'text') => {
    return safeFetch(`${API_BASE}/messages`, {
      method: 'POST',
      body: JSON.stringify({ receiverId, content, mediaUrl, audioUrl, type }),
    });
  },

  uploadMessageMedia: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return safeFetch(`${API_BASE}/messages/media`, {
      method: 'POST',
      body: formData,
    });
  },

  markMessagesAsRead: async (otherUserId) => {
    return safeFetch(`${API_BASE}/messages/${otherUserId}/read`, {
      method: 'PUT',
    });
  },

  sendTypingIndicator: async (toUserId, isTyping) => {
    return safeFetch(`${API_BASE}/messages/typing`, {
      method: 'POST',
      body: JSON.stringify({ toUserId, isTyping }),
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

  searchProvidersByService: async (service) => {
    return safeFetch(`${API_BASE}/providers/search?service=${encodeURIComponent(service)}`);
  },

  getUser: async (userId) => {
    return safeFetch(`${API_BASE}/users/${userId}`);
  },

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

  // Bookings
  getBookings: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.status) queryParams.append('status', params.status);
    if (params.role) queryParams.append('role', params.role);
    return safeFetch(`${API_BASE}/bookings?${queryParams.toString()}`);
  },

  createBooking: async (bookingData) => {
    return safeFetch(`${API_BASE}/bookings`, {
      method: 'POST',
      body: JSON.stringify(bookingData),
    });
  },

  updateBookingStatus: async (bookingId, status) => {
    return safeFetch(`${API_BASE}/bookings/${bookingId}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  cancelBooking: async (bookingId) => {
    return safeFetch(`${API_BASE}/bookings/${bookingId}`, {
      method: 'DELETE',
    });
  },

  updateProviderAvailability: async (available, unavailableUntil = null) => {
    return safeFetch(`${API_BASE}/providers/me/availability`, {
      method: 'PATCH',
      body: JSON.stringify({ available, unavailableUntil }),
    });
  },

  updateWorkingHours: async (workingHours) => {
    return safeFetch(`${API_BASE}/providers/me/working-hours`, {
      method: 'PATCH',
      body: JSON.stringify({ workingHours }),
    });
  },

  // Applications
  getMyApplications: async () => {
    return safeFetch(`${API_BASE}/applications/my`);
  },

  applyToPost: async (data) => {
    return safeFetch(`${API_BASE}/applications`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getPostApplications: async (postId) => {
    return safeFetch(`${API_BASE}/applications/post/${postId}`);
  },

  updateApplication: async (applicationId, status) => {
    return safeFetch(`${API_BASE}/applications/status`, {
      method: 'PUT',
      body: JSON.stringify({ applicationId, status }),
    });
  },

  withdrawApplication: async (applicationId) => {
    return safeFetch(`${API_BASE}/applications/${applicationId}`, {
      method: 'DELETE',
    });
  },
};