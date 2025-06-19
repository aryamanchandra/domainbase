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
  const [host, setHost] = useState('');
  const [value, setValue] = useState('');
  const [ttl, setTtl] = useState<number>(3600);

  async function fetchRecords() {
    setLoading(true);
    try {
      const res = await fetch('/api/dns/namesilo', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setRecords(data.records || []);
    } catch (e) {
      console.error('Failed to fetch records', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchRecords(); }, []);

  async function addTxt() {
    setAdding(true);
    try {
      await fetch('/api/dns/namesilo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type: 'TXT', host, value, ttl }),
      });
      setHost('');
      setValue('');
      await fetchRecords();
    } catch (e) {
      console.error('Failed to add record', e);
    } finally {
      setAdding(false);
    }
  }

  async function removeRecord(id: string) {
    try {
      await fetch('/api/dns/namesilo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type: 'DELETE', recordId: id }),
      });
      await fetchRecords();
    } catch (e) {
      console.error('Failed to delete record', e);
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


