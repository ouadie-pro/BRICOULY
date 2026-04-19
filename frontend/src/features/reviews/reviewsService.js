import { api } from '../../services/api';

export const reviewsService = {
  getProviderReviews: async (providerId) => {
    return await api.getProviderReviews(providerId);
  },

  submitReview: async (reviewData) => {
    return await api.submitReview(reviewData);
  },

  deleteReview: async (reviewId) => {
    return await api.deleteReview(reviewId);
  },

  checkCanReview: async (providerId) => {
    return await api.checkCanReview(providerId);
  }
};

export default reviewsService;