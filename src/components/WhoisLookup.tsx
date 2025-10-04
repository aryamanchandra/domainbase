'use client';

import { useState } from 'react';
import { RefreshCw, Search } from 'lucide-react';
import styles from './WhoisLookup.module.css';

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN!;

interface Props {
  token: string;
}

export default function WhoisLookup({ token }: Props) {
  const [domain, setDomain] = useState(ROOT_DOMAIN);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<any | null>(null);

  async function fetchInfo() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/domain/info?domain=${encodeURIComponent(domain)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch');
      }
      setInfo(data.info);
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>WHOIS Lookup</h3>
          <p className={styles.subtitle}>Looks up domains available in your NameSilo account</p>
        </div>
      </div>

      <div className={styles.searchContainer}>
        <div className={styles.searchBox}>
          <input
            className={styles.input}
            placeholder="example.com"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
          />
          <button className={styles.searchButton} onClick={fetchInfo} disabled={loading || !domain}>
            {loading ? <RefreshCw size={16} className={styles.spinner} /> : <Search size={16} />}
            {loading ? 'Searching…' : 'Search'}
          </button>
        </div>
      </div>

      {error && (
        <div className={styles.error}>{error}</div>
      )}

      {info && (
        <div className={styles.resultsCard}>
          <h4>Domain Information</h4>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <div className={styles.infoLabel}>Created</div>
              <div className={styles.infoValue}>{info.created || '—'}</div>
            </div>
            <div className={styles.infoItem}>
              <div className={styles.infoLabel}>Expires</div>
              <div className={styles.infoValue}>{info.expires || '—'}</div>
            </div>
            <div className={styles.infoItem}>
              <div className={styles.infoLabel}>Status</div>
              <div className={styles.infoValue}>{info.status || '—'}</div>
            </div>
            <div className={styles.infoItem}>
              <div className={styles.infoLabel}>Locked</div>
              <div className={styles.infoValue}>{info.locked || '—'}</div>
            </div>
            <div className={styles.infoItem}>
              <div className={styles.infoLabel}>Privacy</div>
              <div className={styles.infoValue}>{info.private || '—'}</div>
            </div>
          </div>

          <div className={styles.section}>
            <h5>Nameservers</h5>
            <ul className={styles.list}>
              {(info.nameservers || []).map((ns: string, idx: number) => (
                <li key={idx} className={styles.mono}>{ns}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}


