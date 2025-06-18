'use client';

import { useState } from 'react';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import { Globe as GlobeIcon, RefreshCw, CheckCircle, XCircle, Clock, Zap } from 'lucide-react';
import styles from './DNSPropagationMap.module.css';

interface PropagationResult {
  server: {
    name: string;
    location: string;
    coordinates: [number, number];
    ip: string;
    provider: string;
  };
  status: 'resolved' | 'failed' | 'timeout';
  records: string[];
  responseTime: number;
  error?: string;
}

interface PropagationData {
  domain: string;
  timestamp: string;
  statistics: {
    totalServers: number;
    resolved: number;
    failed: number;
    timeout: number;
    propagationPercentage: number;
    avgResponseTime: number;
  };
  results: PropagationResult[];
}

interface Props {
  subdomain: string;
  token: string;
}

const geoUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

export default function DNSPropagationMap({ subdomain, token }: Props) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PropagationData | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<PropagationResult | null>(null);
  const [customDomain, setCustomDomain] = useState('');

  const checkPropagation = async () => {
    const domain = customDomain || `${subdomain}.aryamanchandra.com`;
    setLoading(true);
    setSelectedMarker(null);

    try {
      const response = await fetch('/api/dns/propagation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ domain }),
      });

      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Failed to check DNS propagation:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMarkerColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return '#06ffa5';
      case 'failed':
        return '#ff0080';
      case 'timeout':
        return '#f5a623';
      default:
        return '#666';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved':
        return <CheckCircle size={16} />;
      case 'failed':
        return <XCircle size={16} />;
      case 'timeout':
        return <Clock size={16} />;
      default:
        return null;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h3>Global DNS Propagation</h3>
          <p>Check if your DNS records have propagated worldwide</p>
        </div>
      </div>

      <div className={styles.inputSection}>
        <div className={styles.inputWrapper}>
          <GlobeIcon size={18} className={styles.inputIcon} />
          <input
            type="text"
            placeholder={`${subdomain}.aryamanchandra.com`}
            value={customDomain}
            onChange={(e) => setCustomDomain(e.target.value)}
            className={styles.domainInput}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !loading) {
                checkPropagation();
              }
            }}
          />
        </div>
        <button 
          onClick={checkPropagation} 
          disabled={loading} 
          className={styles.checkButton}
        >
          {loading ? (
            <>
              <RefreshCw size={18} className={styles.spinning} />
              <span>Checking...</span>
            </>
          ) : (
            <>
              <GlobeIcon size={18} />
              <span>Check Propagation</span>
            </>
          )}
        </button>
      </div>

      {data && (
        <>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: 'rgba(6, 255, 165, 0.1)' }}>
                <CheckCircle size={20} color="#06ffa5" />
              </div>
              <div>
                <div className={styles.statValue}>{data.statistics.propagationPercentage}%</div>
                <div className={styles.statLabel}>Propagated</div>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: 'rgba(0, 112, 243, 0.1)' }}>
                <GlobeIcon size={20} color="#0070f3" />
              </div>
              <div>
                <div className={styles.statValue}>{data.statistics.resolved}/{data.statistics.totalServers}</div>
                <div className={styles.statLabel}>Locations</div>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: 'rgba(121, 40, 202, 0.1)' }}>
                <Zap size={20} color="#7928ca" />
              </div>
              <div>
                <div className={styles.statValue}>{data.statistics.avgResponseTime}ms</div>
                <div className={styles.statLabel}>Avg Response</div>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: 'rgba(255, 0, 128, 0.1)' }}>
                <XCircle size={20} color="#ff0080" />
              </div>
              <div>
                <div className={styles.statValue}>{data.statistics.failed + data.statistics.timeout}</div>
                <div className={styles.statLabel}>Failed</div>
              </div>
            </div>
          </div>

          <div className={styles.mapContainer}>
            <ComposableMap
              projection="geoMercator"
              projectionConfig={{
                scale: 140,
              }}
              className={styles.map}
            >
              <Geographies geography={geoUrl}>
                {({ geographies }) =>
                  geographies.map((geo) => (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill="#f5f5f5"
                      stroke="#e0e0e0"
                      strokeWidth={0.5}
                      style={{
                        default: { outline: 'none' },
                        hover: { outline: 'none', fill: '#e0e0e0' },
                        pressed: { outline: 'none' },
                      }}
                    />
                  ))
                }
              </Geographies>
              
              {data.results.map((result, index) => (
                <Marker
                  key={index}
                  coordinates={result.server.coordinates}
                  onClick={() => setSelectedMarker(result)}
                  style={{ cursor: 'pointer' }}
                >
                  <circle
                    r={6}
                    fill={getMarkerColor(result.status)}
                    stroke="#fff"
                    strokeWidth={2}
                    className={styles.marker}
                  />
                  {result.status === 'resolved' && (
                    <circle
                      r={8}
                      fill="none"
                      stroke={getMarkerColor(result.status)}
                      strokeWidth={1.5}
                      opacity={0.5}
                      className={styles.pulse}
                    />
                  )}
                </Marker>
              ))}
            </ComposableMap>

            {selectedMarker && (
              <div className={styles.tooltip}>
                <button 
                  onClick={() => setSelectedMarker(null)} 
                  className={styles.tooltipClose}
                >
                  ×
                </button>
                <div className={styles.tooltipHeader}>
                  <div 
                    className={styles.tooltipStatus}
                    style={{ color: getMarkerColor(selectedMarker.status) }}
                  >
                    {getStatusIcon(selectedMarker.status)}
                    <span>{selectedMarker.status.toUpperCase()}</span>
                  </div>
                </div>
                <h4>{selectedMarker.server.name}</h4>
                <div className={styles.tooltipDetails}>
                  <div className={styles.tooltipRow}>
                    <span>Location:</span>
                    <strong>{selectedMarker.server.location}</strong>
                  </div>
                  <div className={styles.tooltipRow}>
                    <span>Provider:</span>
                    <strong>{selectedMarker.server.provider}</strong>
                  </div>
                  <div className={styles.tooltipRow}>
                    <span>DNS Server:</span>
                    <strong>{selectedMarker.server.ip}</strong>
                  </div>
                  <div className={styles.tooltipRow}>
                    <span>Response Time:</span>
                    <strong>{selectedMarker.responseTime}ms</strong>
                  </div>
                  {selectedMarker.records.length > 0 && (
                    <div className={styles.tooltipRow}>
                      <span>IP Address:</span>
                      <strong>{selectedMarker.records[0]}</strong>
                    </div>
                  )}
                  {selectedMarker.error && (
                    <div className={styles.tooltipError}>
                      Error: {selectedMarker.error}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className={styles.legend}>
            <div className={styles.legendItem}>
              <div className={styles.legendDot} style={{ background: '#06ffa5' }}></div>
              <span>Resolved ({data.statistics.resolved})</span>
            </div>
            <div className={styles.legendItem}>
              <div className={styles.legendDot} style={{ background: '#ff0080' }}></div>
              <span>Failed ({data.statistics.failed})</span>
            </div>
            <div className={styles.legendItem}>
              <div className={styles.legendDot} style={{ background: '#f5a623' }}></div>
              <span>Timeout ({data.statistics.timeout})</span>
            </div>
          </div>
        </>
      )}

      {!data && !loading && (
        <div className={styles.empty}>
          <GlobeIcon size={64} strokeWidth={1.5} />
          <h4>Check Global DNS Propagation</h4>
          <p>Test your DNS records across {12} worldwide locations</p>
          <p className={styles.emptySubtext}>
            This checks public DNS servers from North America, Europe, Asia, Australia, South America, and Africa
          </p>
        </div>
      )}
    </div>
  );
}

