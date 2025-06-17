'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, Eye, Monitor, Globe, ExternalLink } from 'lucide-react';
import styles from './AnalyticsDashboard.module.css';

interface AnalyticsData {
  totalViews: number;
  uniqueVisitors: number;
  topPages: Array<{ path: string; views: number }>;
  topReferers: Array<{ referer: string; views: number }>;
  deviceBreakdown: Array<{ device: string; count: number }>;
  browserBreakdown: Array<{ browser: string; count: number }>;
  viewsByDate: Array<{ date: string; views: number }>;
}

interface Props {
  subdomain: string;
  token: string;
}

const COLORS = ['#0070f3', '#7928ca', '#ff0080', '#f81ce5', '#06ffa5'];

export default function AnalyticsDashboard({ subdomain, token }: Props) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    fetchAnalytics();
  }, [subdomain, days]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/analytics/${subdomain}?days=${days}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.analytics);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading analytics...</p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className={styles.empty}>
        <Eye size={48} strokeWidth={1.5} />
        <h3>No Analytics Data</h3>
        <p>Data will appear once visitors access your subdomain</p>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <div>
          <h2>Analytics Dashboard</h2>
          <p className={styles.subtitle}>{subdomain}.aryamanchandra.com</p>
        </div>
        <div className={styles.periodSelector}>
          <button 
            className={days === 7 ? styles.active : ''}
            onClick={() => setDays(7)}
          >
            7 days
          </button>
          <button 
            className={days === 30 ? styles.active : ''}
            onClick={() => setDays(30)}
          >
            30 days
          </button>
          <button 
            className={days === 90 ? styles.active : ''}
            onClick={() => setDays(90)}
          >
            90 days
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(0, 112, 243, 0.1)' }}>
            <Eye size={20} color="#0070f3" />
          </div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Total Views</p>
            <p className={styles.statValue}>{analytics.totalViews.toLocaleString()}</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(121, 40, 202, 0.1)' }}>
            <Users size={20} color="#7928ca" />
          </div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Unique Visitors</p>
            <p className={styles.statValue}>{analytics.uniqueVisitors.toLocaleString()}</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(255, 0, 128, 0.1)' }}>
            <TrendingUp size={20} color="#ff0080" />
          </div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Avg. Views/Day</p>
            <p className={styles.statValue}>
              {Math.round(analytics.totalViews / (analytics.viewsByDate.length || 1))}
            </p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(6, 255, 165, 0.1)' }}>
            <Monitor size={20} color="#06ffa5" />
          </div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Top Device</p>
            <p className={styles.statValue}>
              {analytics.deviceBreakdown[0]?.device || 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Views Over Time Chart */}
      <div className={styles.chartCard}>
        <h3>Views Over Time</h3>
        <div className={styles.chart}>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.viewsByDate}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis 
                dataKey="date" 
                stroke="#666"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#666"
                style={{ fontSize: '12px' }}
              />
              <Tooltip 
                contentStyle={{
                  background: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
              <Line 
                type="monotone" 
                dataKey="views" 
                stroke="#0070f3" 
                strokeWidth={2}
                dot={{ fill: '#0070f3', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Device & Browser Breakdown */}
      <div className={styles.chartsRow}>
        <div className={styles.chartCard}>
          <h3>Device Breakdown</h3>
          <div className={styles.chart}>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={analytics.deviceBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ device, percent }) => `${device} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="device"
                >
                  {analytics.deviceBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    background: '#1a1a1a',
                    border: '1px solid #333',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={styles.chartCard}>
          <h3>Browser Breakdown</h3>
          <div className={styles.chart}>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={analytics.browserBreakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis 
                  dataKey="browser" 
                  stroke="#666"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#666"
                  style={{ fontSize: '12px' }}
                />
                <Tooltip 
                  contentStyle={{
                    background: '#1a1a1a',
                    border: '1px solid #333',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
                <Bar dataKey="count" fill="#7928ca" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Pages & Referers */}
      <div className={styles.tablesRow}>
        <div className={styles.tableCard}>
          <h3>Top Pages</h3>
          <div className={styles.table}>
            {analytics.topPages.length === 0 ? (
              <p className={styles.emptyTable}>No page data yet</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Page</th>
                    <th>Views</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.topPages.map((page, index) => (
                    <tr key={index}>
                      <td>{page.path}</td>
                      <td>{page.views}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className={styles.tableCard}>
          <h3>Top Referers</h3>
          <div className={styles.table}>
            {analytics.topReferers.length === 0 ? (
              <p className={styles.emptyTable}>No referer data yet</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Source</th>
                    <th>Views</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.topReferers.map((referer, index) => (
                    <tr key={index}>
                      <td className={styles.refererCell}>
                        <Globe size={14} />
                        <span>{new URL(referer.referer).hostname}</span>
                      </td>
                      <td>{referer.views}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

