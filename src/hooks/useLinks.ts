import { useState, useEffect, useCallback } from 'react';
import type { ShortLink } from '@/types';

export const useLinks = (token: string) => {
  const [links, setLinks] = useState<ShortLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLinks = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/links', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch links');
      }

      const data = await response.json();
      setLinks(data.links || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load links');
      console.error('Error fetching links:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  return { links, loading, error, refetch: fetchLinks };
};

