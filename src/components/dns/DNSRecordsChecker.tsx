'use client';

import { useState } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import dnsStyles from '@/styles/DNSChecker.module.css';
import type { DNSRecord } from '@/types';
import { getStatusIcon, getStatusText } from '@/helpers/dns';

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN!;

interface Props {
  subdomain: string;
  token: string;
}

export default function DNSRecordsChecker({ subdomain, token }: Props) {
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

  return (
    <div className={dnsStyles.container}>
      <div className={dnsStyles.header}>
        <div>
          <h3>DNS Records</h3>
          <p>Check specific DNS record types for your subdomain</p>
        </div>
      </div>

      <div className={dnsStyles.searchBar}>
        <div className={dnsStyles.inputWrapper}>
          <Search size={18} className={dnsStyles.searchIcon} />
          <input
            type="text"
            placeholder={`${subdomain}.${ROOT_DOMAIN}`}
            value={customDomain}
            onChange={(e) => setCustomDomain(e.target.value)}
            className={dnsStyles.input}
          />
        </div>
        <button onClick={checkDNS} disabled={loading} className={dnsStyles.checkButton}>
          {loading ? (
            <>
              <RefreshCw size={18} className={dnsStyles.spinning} />
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
        <p className={dnsStyles.timestamp}>Last checked: {new Date(checkedAt).toLocaleString()}</p>
      )}

      {records && (
        <div className={dnsStyles.recordsGrid}>
          {Object.entries(records).map(([type, record]) => (
            <div key={type} className={dnsStyles.recordCard}>
              <div className={dnsStyles.recordHeader}>
                <div className={dnsStyles.recordType}>{type}</div>
                <div className={`${dnsStyles.recordStatus} ${dnsStyles[record.status]}`}>
                  {getStatusIcon(record.status)}
                  <span>{getStatusText(record.status)}</span>
                </div>
              </div>

              {record.status === 'found' && (
                <div className={dnsStyles.recordValues}>
                  {Array.isArray(record.value) ? (
                    (record.value as string[]).map((val, idx) => (
                      <div key={idx} className={dnsStyles.recordValue}>{val}</div>
                    ))
                  ) : (
                    <div className={dnsStyles.recordValue}>{record.value as string}</div>
                  )}
                </div>
              )}

              {record.status === 'not_found' && (
                <p className={dnsStyles.notFoundMessage}>No {type} records found</p>
              )}
            </div>
          ))}
        </div>
      )}

      {!records && !loading && (
        <div className={dnsStyles.placeholder}>
          <Search size={48} strokeWidth={1.5} />
          <p>Enter a domain and click &quot;Check DNS&quot; to view records</p>
        </div>
      )}
    </div>
  );
}

