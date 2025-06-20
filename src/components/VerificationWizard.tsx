'use client';

import { useState, useEffect } from 'react';
import { Shield, Mail, Search as SearchIcon, Copy, CheckCircle, Plus, X } from 'lucide-react';
import styles from './VerificationWizard.module.css';

interface VerificationRecord {
  _id?: string;
  service: string;
  recordType: string;
  name: string;
  value: string;
  status: string;
  createdAt: Date;
}

interface Props {
  subdomain: string;
  token: string;
}

const services = [
  {
    id: 'spf',
    name: 'SPF',
    icon: Shield,
    description: 'Sender Policy Framework - Authorize email servers',
    color: '#0070f3',
  },
  {
    id: 'dkim',
    name: 'DKIM',
    icon: Mail,
    description: 'DomainKeys Identified Mail - Email authentication',
    color: '#7928ca',
  },
  {
    id: 'dmarc',
    name: 'DMARC',
    icon: Shield,
    description: 'Domain-based Message Authentication',
    color: '#ff0080',
  },
  {
    id: 'google-search-console',
    name: 'Google Search Console',
    icon: SearchIcon,
    description: 'Verify domain ownership with Google',
    color: '#06ffa5',
  },
];

export default function VerificationWizard({ subdomain, token }: Props) {
  const [records, setRecords] = useState<VerificationRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [customOptions, setCustomOptions] = useState<any>({});
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'spf' | 'dkim' | 'dmarc' | 'google-search-console'>('all');

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const response = await fetch(`/api/dns/verify?subdomain=${subdomain}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRecords(data.records);
      }
    } catch (error) {
      console.error('Failed to fetch verification records:', error);
    }
  };

  const generateRecord = async (service: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/dns/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subdomain,
          service,
          options: customOptions,
        }),
      });

      if (response.ok) {
        await fetchRecords();
        setShowForm(false);
        setSelectedService(null);
        setCustomOptions({});
      }
    } catch (error) {
      console.error('Failed to generate record:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const fqdn = `${subdomain}.aryamanchandra.com`;

  const filteredRecords = records.filter(r => filter === 'all' ? true : r.service === filter);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleBlock}>
          <h3>Verification</h3>
          <div className={styles.domainRow}>
            <code className={styles.domainMono}>{fqdn}</code>
            <button
              onClick={() => copyToClipboard(fqdn, 'fqdn')}
              className={styles.smallCopy}
              aria-label="Copy domain"
            >
              {copiedField === 'fqdn' ? <CheckCircle size={14} color="#06ffa5" /> : <Copy size={14} />}
            </button>
          </div>
          <p>Generate and manage TXT records to verify services for this subdomain</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className={styles.addButton}
        >
          <Plus size={18} />
          <span>Add Record</span>
        </button>
      </div>

      <div className={styles.segmented}>
        <button
          className={`${styles.segment} ${filter === 'all' ? styles.active : ''}`}
          onClick={() => setFilter('all')}
        >All</button>
        {services.map(s => (
          <button
            key={s.id}
            className={`${styles.segment} ${filter === (s.id as any) ? styles.active : ''}`}
            onClick={() => setFilter(s.id as any)}
          >{s.name}</button>
        ))}
      </div>

      {showForm && (
        <div className={styles.modal} onClick={() => setShowForm(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Generate Verification Record</h3>
              <button onClick={() => setShowForm(false)} className={styles.closeButton}>
                <X size={20} />
              </button>
            </div>

            <div className={styles.serviceGrid}>
              {services.map((service) => {
                const Icon = service.icon;
                return (
                  <button
                    key={service.id}
                    className={`${styles.serviceCard} ${
                      selectedService === service.id ? styles.selected : ''
                    }`}
                    onClick={() => setSelectedService(service.id)}
                  >
                    <div
                      className={styles.serviceIcon}
                      style={{ background: `${service.color}15` }}
                    >
                      <Icon size={24} color={service.color} />
                    </div>
                    <div className={styles.serviceInfo}>
                      <h4>{service.name}</h4>
                      <p>{service.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedService === 'dmarc' && (
              <div className={styles.formGroup}>
                <label>Email for Reports</label>
                <input
                  type="email"
                  placeholder="admin@aryamanchandra.com"
                  value={customOptions.email || ''}
                  onChange={(e) =>
                    setCustomOptions({ ...customOptions, email: e.target.value })
                  }
                  className={styles.input}
                />
              </div>
            )}

            {selectedService === 'google-search-console' && (
              <div className={styles.formGroup}>
                <label>Verification Code</label>
                <input
                  type="text"
                  placeholder="google-site-verification=xxxxx"
                  value={customOptions.verificationCode || ''}
                  onChange={(e) =>
                    setCustomOptions({ ...customOptions, verificationCode: e.target.value })
                  }
                  className={styles.input}
                />
                <small className={styles.hint}>
                  Get this from Google Search Console → Domain Property → Verify
                </small>
              </div>
            )}

            {selectedService === 'dkim' && (
              <div className={styles.formGroup}>
                <label>DKIM Public Key</label>
                <textarea
                  placeholder="v=DKIM1; k=rsa; p=YOUR_PUBLIC_KEY"
                  value={customOptions.dkimValue || ''}
                  onChange={(e) =>
                    setCustomOptions({ ...customOptions, dkimValue: e.target.value })
                  }
                  className={styles.textarea}
                  rows={3}
                />
                <small className={styles.hint}>
                  Generate DKIM keys using a DKIM generator tool
                </small>
              </div>
            )}

            <div className={styles.modalActions}>
              <button onClick={() => setShowForm(false)} className={styles.cancelButton}>
                Cancel
              </button>
              <button
                onClick={() => selectedService && generateRecord(selectedService)}
                disabled={loading || !selectedService}
                className={styles.generateButton}
              >
                {loading ? 'Generating...' : 'Generate Record'}
              </button>
              <p style={{ fontSize: 13, color: '#666', margin: '8px 0 0 0' }}>
                💡 To add records directly to NameSilo, use the <strong>DNS Records</strong> page from the sidebar
              </p>
            </div>
          </div>
        </div>
      )}

      {filteredRecords.length > 0 ? (
        <div className={styles.recordsList}>
          {filteredRecords.map((record) => {
            const service = services.find((s) => s.id === record.service);
            const Icon = service?.icon || Shield;
            const color = service?.color || '#666';

            return (
              <div key={record._id} className={styles.recordItem}>
                <div className={styles.recordItemHeader}>
                  <div className={styles.serviceTag}>
                    <div
                      className={styles.serviceIconSmall}
                      style={{ background: `${color}15` }}
                    >
                      <Icon size={16} color={color} />
                    </div>
                    <span>{service?.name || record.service}</span>
                    <span className={styles.recordType}>{record.recordType}</span>
                  </div>
                  <span className={`${styles.statusBadge} ${styles[record.status]}`}>
                    {record.status}
                  </span>
                </div>

                <div className={styles.recordDetails}>
                  <div className={styles.gridTwo}>
                    <div className={styles.recordField}>
                      <label>Name</label>
                      <div className={styles.copyField}>
                        <code>{record.name}</code>
                        <button
                          onClick={() => copyToClipboard(record.name, `name-${record._id}`)}
                          className={styles.copyButton}
                        >
                          {copiedField === `name-${record._id}` ? (
                            <CheckCircle size={16} color="#06ffa5" />
                          ) : (
                            <Copy size={16} />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className={styles.recordField}>
                      <label>Value</label>
                      <div className={styles.copyField}>
                        <code>{record.value}</code>
                        <button
                          onClick={() => copyToClipboard(record.value, `value-${record._id}`)}
                          className={styles.copyButton}
                        >
                          {copiedField === `value-${record._id}` ? (
                            <CheckCircle size={16} color="#06ffa5" />
                          ) : (
                            <Copy size={16} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className={styles.inlineMeta}>
                    <span>Type: <code>{record.recordType}</code></span>
                    <span>TTL: <code>300</code></span>
                  </div>
                </div>

                <div className={styles.instructions}>
                  <strong>Instructions:</strong>
                  <ol>
                    <li>Go to your DNS provider (domain registrar)</li>
                    <li>Add a new {record.recordType} record</li>
                    <li>Copy the Name and Value fields above</li>
                    <li>Save the DNS record and wait for propagation (5-30 minutes)</li>
                  </ol>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className={styles.empty}>
          <Shield size={48} strokeWidth={1.5} />
          <h4>No Verification Records</h4>
          <p>Click "Add Record" to generate DNS verification records</p>
        </div>
      )}
    </div>
  );
}

