import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

export function useReviews(providerId) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);

  const fetchReviews = useCallback(async () => {
    if (!providerId) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await api.getProviderReviews(providerId);
      if (response.success) {
        setReviews(response.data || []);
        if (response.data && response.data.length > 0) {
          const sum = response.data.reduce((acc, r) => acc + r.rating, 0);
          setAverageRating(Math.round((sum / response.data.length) * 10) / 10);
          setReviewCount(response.data.length);
        }
      } else {
        setError(response.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [providerId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  return { 
    reviews, 
    loading, 
    error, 
    averageRating, 
    reviewCount,
    refetch: fetchReviews 
  };
}

export function useCanReview(providerId) {
  const [canReview, setCanReview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const checkCanReview = useCallback(async () => {
    if (!providerId) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await api.checkCanReview(providerId);
      if (response.success) {
        setCanReview(response.data?.canReview || false);
      } else {
        setError(response.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [providerId]);

  useEffect(() => {
    checkCanReview();
  }, [checkCanReview]);

  return { canReview, loading, error, refetch: checkCanReview };
}

export default useReviews;