import { TrendingUp, Users, Eye, Monitor } from 'lucide-react';
import dashStyles from '@/styles/AnalyticsDashboard.module.css';
import type { AnalyticsData } from '@/types';

interface Props {
  analytics: AnalyticsData;
}

export default function StatsGrid({ analytics }: Props) {
  return (
    <div className={dashStyles.statsGrid}>
      <div className={dashStyles.statCard}>
        <div className={dashStyles.statIcon} style={{ background: 'rgba(0, 112, 243, 0.1)' }}>
          <Eye size={20} color="#0070f3" />
        </div>
        <div className={dashStyles.statContent}>
          <p className={dashStyles.statLabel}>Total Views</p>
          <p className={dashStyles.statValue}>{analytics.totalViews.toLocaleString()}</p>
        </div>
      </div>

      <div className={dashStyles.statCard}>
        <div className={dashStyles.statIcon} style={{ background: 'rgba(121, 40, 202, 0.1)' }}>
          <Users size={20} color="#7928ca" />
        </div>
        <div className={dashStyles.statContent}>
          <p className={dashStyles.statLabel}>Unique Visitors</p>
          <p className={dashStyles.statValue}>{analytics.uniqueVisitors.toLocaleString()}</p>
        </div>
      </div>

      <div className={dashStyles.statCard}>
        <div className={dashStyles.statIcon} style={{ background: 'rgba(255, 0, 128, 0.1)' }}>
          <TrendingUp size={20} color="#ff0080" />
        </div>
        <div className={dashStyles.statContent}>
          <p className={dashStyles.statLabel}>Avg. Views/Day</p>
          <p className={dashStyles.statValue}>
            {Math.round(analytics.totalViews / (analytics.viewsByDate.length || 1))}
          </p>
        </div>
      </div>

      <div className={dashStyles.statCard}>
        <div className={dashStyles.statIcon} style={{ background: 'rgba(6, 255, 165, 0.1)' }}>
          <Monitor size={20} color="#06ffa5" />
        </div>
        <div className={dashStyles.statContent}>
          <p className={dashStyles.statLabel}>Top Device</p>
          <p className={dashStyles.statValue}>{analytics.deviceBreakdown[0]?.device || 'N/A'}</p>
        </div>
      </div>
    </div>
  );
}

