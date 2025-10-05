import { useState, useEffect, useCallback } from 'react';
import type { Subdomain } from '@/types';

export const useSubdomains = (token: string) => {
  const [subdomains, setSubdomains] = useState<Subdomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubdomains = useCallback(async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/subdomains', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch subdomains');
      }

      const data = await response.json();
      setSubdomains(data.subdomains || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load subdomains');
      console.error('Error fetching subdomains:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchSubdomains();
  }, [fetchSubdomains]);

  return { subdomains, loading, error, refetch: fetchSubdomains };
};

