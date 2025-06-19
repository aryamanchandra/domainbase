'use client';

import { useEffect, useState } from 'react';
import styles from './NameSiloManager.module.css';

interface Props {
  token: string;
}

interface RecordItem {
  record_id: string;
  type: string;
  host: string;
  value: string;
  ttl: string;
}

export default function NameSiloManager({ token }: Props) {
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [host, setHost] = useState('');
  const [value, setValue] = useState('');
  const [ttl, setTtl] = useState<number>(3600);

  async function fetchRecords() {
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
  }

  useEffect(() => { fetchRecords(); }, []);

  async function addTxt() {
    setAdding(true);
    setError(null);
    try {
      const res = await fetch('/api/dns/namesilo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type: 'TXT', host, value, ttl }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((data as any).error || 'Failed to add record');
      }
      setHost('');
      setValue('');
      await fetchRecords();
    } catch (e: any) {
      console.error('Failed to add record', e);
      setError(e?.message || 'Failed to add record');
    } finally {
      setAdding(false);
    }
  }

  async function removeRecord(id: string) {
    try {
      const res = await fetch('/api/dns/namesilo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type: 'DELETE', recordId: id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((data as any).error || 'Failed to delete record');
      }
      await fetchRecords();
    } catch (e: any) {
      console.error('Failed to delete record', e);
      setError(e?.message || 'Failed to delete record');
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>NameSilo DNS Records</h3>
        <div className={styles.actions}>
          <button className={styles.button} onClick={fetchRecords} disabled={loading}>
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 140px 120px', gap: 8, marginBottom: 12 }}>
        <input placeholder="Host (e.g. blog.example.com)" value={host} onChange={(e) => setHost(e.target.value)} className={styles.button} />
        <input placeholder="Value (TXT)" value={value} onChange={(e) => setValue(e.target.value)} className={styles.button} />
        <input type="number" placeholder="TTL" value={ttl} onChange={(e) => setTtl(parseInt(e.target.value || '3600', 10))} className={styles.button} />
        <button className={styles.button} onClick={addTxt} disabled={adding || !host || !value}>{adding ? 'Adding…' : 'Add TXT'}</button>
      </div>

      {error && (
        <div style={{ 
          marginBottom: 12, 
          padding: '12px 16px', 
          background: error.includes('error 113') ? '#ffe5e5' : '#fff5f5',
          border: `1px solid ${error.includes('error 113') ? '#ff4444' : '#ff0080'}`,
          borderRadius: 8,
          color: '#000'
        }}>
          <strong>{error.includes('error 113') ? '⚠️ IP Restriction Error' : 'Error'}:</strong> {error}
          {error.includes('error 113') && (
            <div style={{ marginTop: 8, fontSize: 14 }}>
              <p style={{ margin: 0 }}>Your server IP is not allowlisted. Add the IP shown above to NameSilo → API Manager → IP Address Restrictions.</p>
            </div>
          )}
        </div>
      )}

      <table className={styles.table}>
        <thead>
          <tr>
            <th>Type</th>
            <th>Host</th>
            <th>Value</th>
            <th>TTL</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {records.map((r) => (
            <tr key={r.record_id}>
              <td className={styles.mono}>{r.type}</td>
              <td className={styles.mono}>{r.host}</td>
              <td className={styles.mono}>{r.value}</td>
              <td className={styles.mono}>{r.ttl}</td>
              <td>
                <button className={`${styles.button} ${styles.danger}`} onClick={() => removeRecord(r.record_id)}>Delete</button>
              </td>
            </tr>
          ))}
          {records.length === 0 && (
            <tr>
              <td colSpan={5}>No records found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}


