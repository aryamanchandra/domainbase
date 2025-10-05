'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ExternalLink, CheckCircle, XCircle } from 'lucide-react';
import styles from '@/styles/page.module.css';
import dashStyles from '@/styles/AnalyticsDashboard.module.css';
import type { Subdomain } from '@/types';
import { useAuth, useAnalytics } from '@/hooks';
import { useSubdomains } from '@/hooks/useSubdomains';
import StatsGrid from '@/components/analytics/StatsGrid';
import TopTables from '@/components/analytics/TopTables';

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN!;

export default function AnalyticsPage() {
  const router = useRouter();
  const params = useParams();
  const subdomain = params.subdomain as string;
  const { token } = useAuth();
  const [days, setDays] = useState(30);
  const { analytics, loading: analyticsLoading } = useAnalytics(subdomain, token, days);
  
  // Get subdomain data
  const { subdomains, loading: subdomainsLoading } = useSubdomains(token);
  const subdomainData = subdomains.find(s => s.subdomain === subdomain);

  const loading = subdomainsLoading || analyticsLoading;

  if (loading) {
    return (
      <div className={styles.pageContainer}>
        <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>
      </div>
    );
  }

  if (!subdomainData) {
    return (
      <div className={styles.pageContainer}>
        <div style={{ padding: '40px', textAlign: 'center' }}>Subdomain not found</div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.detailsHeader}>
        <div className={styles.detailsHeaderTop}>
          <button onClick={() => router.push('/subdomains')} className={styles.backButton}>
            ← Back to Subdomains
          </button>
        </div>
        <div className={styles.detailsHeaderMain}>
          <div className={styles.detailsInfo}>
            <h1>{subdomainData.title}</h1>
            <a
              href={`http://${subdomainData.subdomain}.${ROOT_DOMAIN}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.detailsUrl}
            >
              {subdomainData.subdomain}.{ROOT_DOMAIN}
              <ExternalLink size={16} />
            </a>
          </div>
          <div className={styles.detailsBadge} data-active={subdomainData.isActive}>
            {subdomainData.isActive ? (
              <><CheckCircle size={16} /> Active</>
            ) : (
              <><XCircle size={16} /> Inactive</>
            )}
          </div>
        </div>
      </div>

      <div className={styles.detailsContent}>
        {!analytics ? (
          <div className={dashStyles.loading}>
            <div className={dashStyles.spinner}></div>
            <p>Loading analytics...</p>
          </div>
        ) : (
          <div className={dashStyles.dashboard}>
            <div className={dashStyles.header}>
              <div>
                <h2>Analytics Dashboard</h2>
                <p className={dashStyles.subtitle}>{subdomainData.subdomain}.{ROOT_DOMAIN}</p>
              </div>
              <div className={dashStyles.periodSelector}>
                <button className={days === 7 ? dashStyles.active : ''} onClick={() => setDays(7)}>
                  7 days
                </button>
                <button className={days === 30 ? dashStyles.active : ''} onClick={() => setDays(30)}>
                  30 days
                </button>
                <button className={days === 90 ? dashStyles.active : ''} onClick={() => setDays(90)}>
                  90 days
                </button>
              </div>
            </div>
            <StatsGrid analytics={analytics} />
            <TopTables analytics={analytics} />
          </div>
        )}
      </div>
    </div>
  );
}
