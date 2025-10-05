'use client';

import pageStyles from '@/styles/page.module.css';
import { useAuth } from '@/hooks';
import DNSPropagationMap from '@/components/dns/DNSPropagationMap';
import DNSRecordsChecker from '@/components/dns/DNSRecordsChecker';

export default function DNSCheckerPage() {
  const { token } = useAuth();

  return (
    <div className={pageStyles.pageContainer}>
      <div className={pageStyles.pageHeader}>
        <h1>DNS Checker</h1>
        <p>Check DNS records and global propagation worldwide</p>
      </div>
      <DNSPropagationMap subdomain="blog" token={token} />
      <DNSRecordsChecker subdomain="blog" token={token} />
    </div>
  );
}
