import { useState, useEffect, useCallback } from 'react';
import type { RecordItem } from '@/types';

export const useDNSRecords = (token: string) => {
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecords = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/dns/namesilo', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch records');
      }
      setRecords(data.records || []);
    } catch (e: any) {
      console.error('Failed to fetch records', e);
      setError(e?.message || 'Failed to fetch records');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  return { records, loading, error, refetch: fetchRecords };
};

