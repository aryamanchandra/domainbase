import { Globe } from 'lucide-react';
import dashStyles from '@/styles/AnalyticsDashboard.module.css';
import type { AnalyticsData } from '@/types';

interface Props {
  analytics: AnalyticsData;
}

export default function TopTables({ analytics }: Props) {
  return (
    <div className={dashStyles.tablesRow}>
      <div className={dashStyles.tableCard}>
        <h3>Top Pages</h3>
        <div className={dashStyles.table}>
          {analytics.topPages.length === 0 ? (
            <p className={dashStyles.emptyTable}>No page data yet</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Page</th>
                  <th>Views</th>
                </tr>
              </thead>
              <tbody>
                {analytics.topPages.map((p: any, i: number) => (
                  <tr key={i}>
                    <td>{p.path}</td>
                    <td>{p.views}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className={dashStyles.tableCard}>
        <h3>Top Referers</h3>
        <div className={dashStyles.table}>
          {analytics.topReferers.length === 0 ? (
            <p className={dashStyles.emptyTable}>No referer data yet</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Source</th>
                  <th>Views</th>
                </tr>
              </thead>
              <tbody>
                {analytics.topReferers.map((r: any, i: number) => (
                  <tr key={i}>
                    <td className={dashStyles.refererCell}>
                      <Globe size={14} />
                      <span>{new URL(r.referer).hostname}</span>
                    </td>
                    <td>{r.views}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

