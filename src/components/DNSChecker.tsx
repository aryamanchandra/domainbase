'use client';

import { useState } from 'react';
import { Search, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import dynamic from 'next/dynamic';
import styles from './DNSChecker.module.css';

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN!;

const DNSPropagationMap = dynamic(() => import('./DNSPropagationMap'), {
  ssr: false,
  loading: () => <div style={{ padding: '40px', textAlign: 'center' }}>Loading propagation map...</div>
});

interface DNSRecord {
  type: string;
  value: string | string[];
  status: 'found' | 'not_found' | 'error';
}

interface Props {
  subdomain: string;
  token: string;
}

export default function DNSChecker({ subdomain, token }: Props) {
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<Record<string, DNSRecord> | null>(null);
  const [checkedAt, setCheckedAt] = useState<string | null>(null);
  const [customDomain, setCustomDomain] = useState('');

  const checkDNS = async () => {
    const domain = customDomain || `${subdomain}.${ROOT_DOMAIN}`;
    setLoading(true);

    try {
      const response = await fetch('/api/dns/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ domain }),
      });

      if (response.ok) {
        const data = await response.json();
        setRecords(data.records);
        setCheckedAt(data.checkedAt);
      }
    } catch (error) {
      console.error('DNS check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'found':
        return <CheckCircle size={18} color="#06ffa5" />;
      case 'not_found':
        return <XCircle size={18} color="#ff0080" />;
      default:
        return <AlertCircle size={18} color="#f5a623" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'found':
        return 'Found';
      case 'not_found':
        return 'Not Found';
      default:
        return 'Error';
    }
  };

  return (
    <>
      <DNSPropagationMap subdomain={subdomain} token={token} />
      
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h3>DNS Records</h3>
            <p>Check specific DNS record types for your subdomain</p>
          </div>
        </div>

      <div className={styles.searchBar}>
        <div className={styles.inputWrapper}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            placeholder={`${subdomain}.${ROOT_DOMAIN}`}
            value={customDomain}
            onChange={(e) => setCustomDomain(e.target.value)}
            className={styles.input}
          />
        </div>
        <button onClick={checkDNS} disabled={loading} className={styles.checkButton}>
          {loading ? (
            <>
              <RefreshCw size={18} className={styles.spinning} />
              <span>Checking...</span>
            </>
          ) : (
            <>
              <Search size={18} />
              <span>Check DNS</span>
            </>
          )}
        </button>
      </div>

      {checkedAt && (
        <p className={styles.timestamp}>
          Last checked: {new Date(checkedAt).toLocaleString()}
        </p>
      )}

      {records && (
        <div className={styles.recordsGrid}>
          {Object.entries(records).map(([type, record]) => (
            <div key={type} className={styles.recordCard}>
              <div className={styles.recordHeader}>
                <div className={styles.recordType}>{type}</div>
                <div className={`${styles.recordStatus} ${styles[record.status]}`}>
                  {getStatusIcon(record.status)}
                  <span>{getStatusText(record.status)}</span>
                </div>
              </div>

              {record.status === 'found' && (
                <div className={styles.recordValues}>
                  {Array.isArray(record.value) ? (
                    record.value.map((val, idx) => (
                      <div key={idx} className={styles.recordValue}>
                        {val}
                      </div>
                    ))
                  ) : (
                    <div className={styles.recordValue}>{record.value}</div>
                  )}
                </div>
              )}

              {record.status === 'not_found' && (
                <p className={styles.notFoundMessage}>No {type} records found</p>
              )}
            </div>
          ))}
        </div>
      )}

      {!records && !loading && (
        <div className={styles.placeholder}>
          <Search size={48} strokeWidth={1.5} />
          <p>Enter a domain and click &quot;Check DNS&quot; to view records</p>
        </div>
      )}
      </div>
    </>
  );
}

