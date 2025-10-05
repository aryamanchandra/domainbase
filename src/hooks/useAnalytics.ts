import { useState, useEffect, useCallback } from 'react';
import type { AnalyticsData } from '@/types';

export const useAnalytics = (subdomain: string, token: string, days: number = 30) => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    if (!token || !subdomain) return;

    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/analytics/${subdomain}?days=${days}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const data = await response.json();
      setAnalytics(data.analytics);
    } catch (err: any) {
      setError(err.message || 'Failed to load analytics');
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  }, [subdomain, token, days]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return { analytics, loading, error, refetch: fetchAnalytics };
};

