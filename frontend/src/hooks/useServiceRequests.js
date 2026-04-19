import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

export function useServiceRequests(params = {}) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.getServiceRequests(params);
      if (response.success) {
        setRequests(response.data || []);
        setPagination(response.pagination);
      } else {
        setError(response.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [params.status, params.serviceType, params.page, params.limit]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  return { requests, loading, error, pagination, refetch: fetchRequests };
}

export function useProviderRequests(params = {}) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.getProviderServiceRequests(params);
      if (response.success) {
        setRequests(response.data || []);
        setPagination(response.pagination);
      } else {
        setError(response.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [params.status, params.page, params.limit]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  return { requests, loading, error, pagination, refetch: fetchRequests };
}

export function useClientRequests(params = {}) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.getClientServiceRequests(params);
      if (response.success) {
        setRequests(response.data || []);
        setPagination(response.pagination);
      } else {
        setError(response.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [params.status, params.page, params.limit]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  return { requests, loading, error, pagination, refetch: fetchRequests };
}

export function useServiceRequest(requestId) {
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRequest = useCallback(async () => {
    if (!requestId) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await api.getServiceRequest(requestId);
      if (response.success) {
        setRequest(response.data.request);
      } else {
        setError(response.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    fetchRequest();
  }, [fetchRequest]);

  return { request, loading, error, refetch: fetchRequest };
}

export default useServiceRequests;