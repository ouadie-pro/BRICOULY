import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

export function useProviders(params = {}) {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProviders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.getProviders(params);
      if (response.success) {
        setProviders(response.data || []);
      } else {
        setError(response.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [params.profession, params.search, params.sort]);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  return { providers, loading, error, refetch: fetchProviders };
}

export function useProvider(providerId) {
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProvider = useCallback(async () => {
    if (!providerId) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await api.getProvider(providerId);
      if (response.success) {
        setProvider(response.data.provider);
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
    fetchProvider();
  }, [fetchProvider]);

  return { provider, loading, error, refetch: fetchProvider };
}

export default useProviders;