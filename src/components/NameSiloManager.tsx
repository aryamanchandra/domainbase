'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, Plus, Shield, Edit2, Trash2, Check, X } from 'lucide-react';
import styles from './NameSiloManager.module.css';

interface Props {
  token: string;
  subdomains?: Array<{ subdomain: string; userId: string }>;
}

interface RecordItem {
  record_id: string;
  type: string;
  host: string;
  value: string;
  ttl: string;
  distance?: number;
}

interface EditingRecord {
  record_id: string;
  type: string;
  host: string;
  value: string;
  ttl: number;
  distance?: number;
}

export default function NameSiloManager({ token, subdomains = [] }: Props) {
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Add form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [addType, setAddType] = useState<string>('A');
  const [addHost, setAddHost] = useState('');
  const [addValue, setAddValue] = useState('');
  const [addTtl, setAddTtl] = useState<number>(3600);
  const [addDistance, setAddDistance] = useState<number>(10);
  const [adding, setAdding] = useState(false);
  
  // Edit state
  const [editingRecord, setEditingRecord] = useState<EditingRecord | null>(null);
  const [updating, setUpdating] = useState(false);
  
  // Verification state
  const [showVerificationForm, setShowVerificationForm] = useState(false);
  const [verifySubdomain, setVerifySubdomain] = useState('');

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

  async function addRecord() {
    setAdding(true);
    setError(null);
    try {
      const res = await fetch('/api/dns/namesilo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ 
          action: 'ADD',
          type: addType,
          host: addHost,
          value: addValue,
          ttl: addTtl,
          distance: addType === 'MX' ? addDistance : undefined
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((data as any).error || 'Failed to add record');
      }
      setAddHost('');
      setAddValue('');
      setShowAddForm(false);
      await fetchRecords();
    } catch (e: any) {
      console.error('Failed to add record', e);
      setError(e?.message || 'Failed to add record');
    } finally {
      setAdding(false);
    }
  }

  async function updateRecord() {
    if (!editingRecord) return;
    setUpdating(true);
    setError(null);
    try {
      const res = await fetch('/api/dns/namesilo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ 
          action: 'UPDATE',
          recordId: editingRecord.record_id,
          host: editingRecord.host,
          value: editingRecord.value,
          ttl: editingRecord.ttl,
          distance: editingRecord.type === 'MX' ? editingRecord.distance : undefined
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((data as any).error || 'Failed to update record');
      }
      setEditingRecord(null);
      await fetchRecords();
    } catch (e: any) {
      console.error('Failed to update record', e);
      setError(e?.message || 'Failed to update record');
    } finally {
      setUpdating(false);
    }
  }

  async function removeRecord(id: string) {
    if (!confirm('Are you sure you want to delete this DNS record?')) return;
    
    setError(null);
    try {
      const res = await fetch('/api/dns/namesilo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'DELETE', recordId: id }),
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

  function startEdit(record: RecordItem) {
    setEditingRecord({
      record_id: record.record_id,
      type: record.type,
      host: record.host,
      value: record.value,
      ttl: parseInt(record.ttl, 10),
      distance: record.distance,
    });
  }

  async function generateVerificationRecord() {
    if (!verifySubdomain.trim()) {
      setError('Please enter a subdomain name');
      return;
    }
    
    const domain = 'aryamanchandra.com'; // From env
    const code = `verify-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    const host = `_verify.${verifySubdomain}.${domain}`;
    
    setAddType('TXT');
    setAddHost(host);
    setAddValue(code);
    setAddTtl(3600);
    setShowAddForm(true);
    setShowVerificationForm(false);
  }

  const RECORD_TYPES = ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SRV'];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>DNS Records Manager</h3>
        <div className={styles.actions}>
          <button className={styles.button} onClick={fetchRecords} disabled={loading}>
            <RefreshCw size={16} />
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
          <button className={styles.buttonPrimary} onClick={() => setShowVerificationForm(!showVerificationForm)}>
            <Shield size={16} />
            Generate Verification
          </button>
          <button className={styles.buttonPrimary} onClick={() => setShowAddForm(!showAddForm)}>
            <Plus size={16} />
            Add Record
          </button>
        </div>
      </div>

      {/* Verification Form */}
      {showVerificationForm && (
        <div className={styles.formCard}>
          <h4>Generate Verification Record</h4>
          <p style={{ fontSize: 14, color: '#666', marginBottom: 16 }}>
            Create a TXT verification record for subdomain ownership verification
          </p>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select 
              value={verifySubdomain} 
              onChange={(e) => setVerifySubdomain(e.target.value)}
              className={styles.input}
              style={{ flex: 1 }}
            >
              <option value="">Select subdomain...</option>
              {subdomains.map((s) => (
                <option key={s.subdomain} value={s.subdomain}>{s.subdomain}</option>
              ))}
            </select>
            <button className={styles.buttonPrimary} onClick={generateVerificationRecord}>
              Generate
            </button>
            <button className={styles.button} onClick={() => setShowVerificationForm(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Add Form */}
      {showAddForm && (
        <div className={styles.formCard}>
          <h4>Add New DNS Record</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr 120px', gap: 8, marginBottom: 12 }}>
            <select value={addType} onChange={(e) => setAddType(e.target.value)} className={styles.input}>
              {RECORD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <input 
              placeholder="Host (e.g. blog.example.com)" 
              value={addHost} 
              onChange={(e) => setAddHost(e.target.value)} 
              className={styles.input} 
            />
            <input 
              placeholder="Value" 
              value={addValue} 
              onChange={(e) => setAddValue(e.target.value)} 
              className={styles.input} 
            />
            <input 
              type="number" 
              placeholder="TTL" 
              value={addTtl} 
              onChange={(e) => setAddTtl(parseInt(e.target.value || '3600', 10))} 
              className={styles.input} 
            />
          </div>
          {addType === 'MX' && (
            <div style={{ marginBottom: 12 }}>
              <input 
                type="number" 
                placeholder="Priority (10)" 
                value={addDistance} 
                onChange={(e) => setAddDistance(parseInt(e.target.value || '10', 10))} 
                className={styles.input}
                style={{ width: 120 }}
              />
            </div>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <button 
              className={styles.buttonPrimary} 
              onClick={addRecord} 
              disabled={adding || !addHost || !addValue}
            >
              {adding ? 'Adding…' : 'Add Record'}
            </button>
            <button className={styles.button} onClick={() => setShowAddForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Error Display */}
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

      {/* Records Table */}
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Type</th>
            <th>Host</th>
            <th>Value</th>
            <th>TTL</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {records.map((r) => (
            editingRecord?.record_id === r.record_id ? (
              <tr key={r.record_id} className={styles.editRow}>
                <td className={styles.mono}>{editingRecord.type}</td>
                <td>
                  <input 
                    value={editingRecord.host} 
                    onChange={(e) => setEditingRecord({...editingRecord, host: e.target.value})}
                    className={styles.inputInline}
                  />
                </td>
                <td>
                  <input 
                    value={editingRecord.value} 
                    onChange={(e) => setEditingRecord({...editingRecord, value: e.target.value})}
                    className={styles.inputInline}
                  />
                </td>
                <td>
                  <input 
                    type="number"
                    value={editingRecord.ttl} 
                    onChange={(e) => setEditingRecord({...editingRecord, ttl: parseInt(e.target.value, 10)})}
                    className={styles.inputInline}
                    style={{ width: 80 }}
                  />
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button 
                      className={styles.buttonSmall} 
                      onClick={updateRecord}
                      disabled={updating}
                    >
                      {updating ? '...' : <Check size={14} />}
                    </button>
                    <button 
                      className={styles.buttonSmall} 
                      onClick={() => setEditingRecord(null)}
                    >
                      <X size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              <tr key={r.record_id}>
                <td className={styles.mono}>{r.type}</td>
                <td className={styles.mono}>{r.host}</td>
                <td className={styles.mono} style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.value}</td>
                <td className={styles.mono}>{r.ttl}</td>
                <td>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className={styles.buttonSmall} onClick={() => startEdit(r)}>
                      <Edit2 size={14} />
                    </button>
                    <button className={`${styles.buttonSmall} ${styles.danger}`} onClick={() => removeRecord(r.record_id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            )
          ))}
          {records.length === 0 && !loading && (
            <tr>
              <td colSpan={5} style={{ textAlign: 'center', padding: 24, color: '#999' }}>
                No DNS records found. Click "Add Record" to create one.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
