'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, LogOut, Edit2, Trash2, ExternalLink, 
  Globe, CheckCircle, XCircle, Search, Moon, Sun, BarChart3, X
} from 'lucide-react';
import dynamic from 'next/dynamic';
import styles from './page.module.css';

// Dynamic imports for heavy components
const AnalyticsDashboard = dynamic(() => import('@/components/AnalyticsDashboard'), {
  ssr: false,
  loading: () => <div style={{ padding: '40px', textAlign: 'center' }}>Loading analytics...</div>
});

const DNSChecker = dynamic(() => import('@/components/DNSChecker'), {
  ssr: false,
  loading: () => <div style={{ padding: '40px', textAlign: 'center' }}>Loading DNS checker...</div>
});

const VerificationWizard = dynamic(() => import('@/components/VerificationWizard'), {
  ssr: false,
  loading: () => <div style={{ padding: '40px', textAlign: 'center' }}>Loading verification wizard...</div>
});

interface Subdomain {
  _id: string;
  subdomain: string;
  title: string;
  description: string;
  content: string;
  customCss?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState('');
  const [subdomains, setSubdomains] = useState<Subdomain[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingSubdomain, setEditingSubdomain] = useState<Subdomain | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [detailsView, setDetailsView] = useState<{
    subdomain: Subdomain;
    activeTab: 'analytics' | 'dns' | 'verification';
  } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    subdomain: '',
    title: '',
    description: '',
    content: '',
    customCss: '',
  });

  useEffect(() => {
    // Check for token in URL (from OAuth callback)
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');
    const urlError = urlParams.get('error');
    
    if (urlError) {
      setError('Authentication failed. Please try again.');
      // Clean URL
      window.history.replaceState({}, '', '/');
    }
    
    if (urlToken) {
      localStorage.setItem('token', urlToken);
      setToken(urlToken);
      setIsLoggedIn(true);
      fetchSubdomains(urlToken);
      // Clean URL
      window.history.replaceState({}, '', '/');
      return;
    }

    // Check for saved token
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      setToken(savedToken);
      setIsLoggedIn(true);
      fetchSubdomains(savedToken);
    }

    // Check theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    
    if (newMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleGoogleLogin = () => {
    // Redirect to Google OAuth
    // In production, this will redirect to your configured OAuth endpoint
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    
    if (!clientId) {
      setError('Google OAuth is not configured. Please add NEXT_PUBLIC_GOOGLE_CLIENT_ID to your environment variables.');
      return;
    }

    const redirectUri = `${window.location.origin}/api/auth/callback/google`;
    const scope = 'openid email profile';
    const responseType = 'code';
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=${responseType}&` +
      `scope=${encodeURIComponent(scope)}`;
    
    window.location.href = authUrl;
  };

  const fetchSubdomains = async (authToken: string) => {
    try {
      const response = await fetch('/api/subdomains', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const data = await response.json();
      setSubdomains(data.subdomains || []);
    } catch (err) {
      console.error('Failed to fetch subdomains', err);
    }
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const url = editingSubdomain
        ? `/api/subdomains/${editingSubdomain.subdomain}`
        : '/api/subdomains';
      
      const method = editingSubdomain ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Operation failed');
        return;
      }

      setShowCreateForm(false);
      setEditingSubdomain(null);
      setFormData({
        subdomain: '',
        title: '',
        description: '',
        content: '',
        customCss: '',
      });
      fetchSubdomains(token);
    } catch (err) {
      setError('Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (subdomain: string) => {
    if (!confirm(`Are you sure you want to delete ${subdomain}?`)) return;

    try {
      const response = await fetch(`/api/subdomains/${subdomain}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchSubdomains(token);
      }
    } catch (err) {
      console.error('Failed to delete subdomain', err);
    }
  };

  const handleEdit = (subdomain: Subdomain) => {
    setEditingSubdomain(subdomain);
    setFormData({
      subdomain: subdomain.subdomain,
      title: subdomain.title,
      description: subdomain.description,
      content: subdomain.content,
      customCss: subdomain.customCss || '',
    });
    setShowCreateForm(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken('');
    setIsLoggedIn(false);
    setSubdomains([]);
  };

  const filteredSubdomains = subdomains.filter(sub =>
    sub.subdomain.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sub.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sub.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isLoggedIn) {
    return (
      <div className={styles.loginContainer}>
        <button onClick={toggleDarkMode} className={styles.themeToggle} aria-label="Toggle theme">
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        
        <div className={styles.loginWrapper}>
          <div className={styles.loginHeader}>
            <div className={styles.logoContainer}>
              <Globe size={32} strokeWidth={2} />
            </div>
            <h1 className={styles.loginTitle}>Welcome back</h1>
            <p className={styles.loginSubtitle}>Sign in with your Google account to manage subdomains</p>
          </div>

          <div className={styles.loginCard}>
            {error && (
              <div className={styles.errorAlert}>
                <XCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <button onClick={handleGoogleLogin} className={styles.googleButton} disabled={loading}>
              {loading ? (
                <span className={styles.buttonLoader}>Connecting...</span>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.64 9.20443C17.64 8.56625 17.5827 7.95262 17.4764 7.36353H9V10.8449H13.8436C13.635 11.9699 13.0009 12.9231 12.0477 13.5613V15.8194H14.9564C16.6582 14.2526 17.64 11.9453 17.64 9.20443Z" fill="#4285F4"/>
                    <path d="M8.99976 18C11.4298 18 13.467 17.1941 14.9561 15.8195L12.0475 13.5613C11.2416 14.1013 10.2107 14.4204 8.99976 14.4204C6.65567 14.4204 4.67158 12.8372 3.96385 10.71H0.957031V13.0418C2.43794 15.9831 5.48158 18 8.99976 18Z" fill="#34A853"/>
                    <path d="M3.96409 10.7098C3.78409 10.1698 3.68182 9.59301 3.68182 8.99983C3.68182 8.40665 3.78409 7.82983 3.96409 7.28983V4.95801H0.957273C0.347727 6.17301 0 7.54755 0 8.99983C0 10.4521 0.347727 11.8267 0.957273 13.0417L3.96409 10.7098Z" fill="#FBBC05"/>
                    <path d="M8.99976 3.57955C10.3211 3.57955 11.5075 4.03364 12.4402 4.92545L15.0216 2.34409C13.4629 0.891818 11.4257 0 8.99976 0C5.48158 0 2.43794 2.01682 0.957031 4.95818L3.96385 7.29C4.67158 5.16273 6.65567 3.57955 8.99976 3.57955Z" fill="#EA4335"/>
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>
          </div>

          <p className={styles.loginFooter}>
            Secured by Google OAuth 2.0
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <Globe size={28} strokeWidth={2.5} />
            <div>
              <h1 className={styles.headerTitle}>Subdomains</h1>
              <p className={styles.headerSubtitle}>{subdomains.length} total</p>
            </div>
          </div>
          <div className={styles.headerRight}>
            <button onClick={toggleDarkMode} className={styles.themeToggleButton} aria-label="Toggle theme">
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button onClick={handleLogout} className={styles.logoutButton}>
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className={styles.container}>
        <div className={styles.toolbar}>
          <div className={styles.searchBar}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search subdomains..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          <button
            onClick={() => {
              setShowCreateForm(true);
              setEditingSubdomain(null);
              setFormData({
                subdomain: '',
                title: '',
                description: '',
                content: '',
                customCss: '',
              });
            }}
            className={styles.createButton}
          >
            <Plus size={18} />
            <span>Create Subdomain</span>
          </button>
        </div>

        {showCreateForm && (
          <div className={styles.modal} onClick={() => setShowCreateForm(false)}>
            <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2>{editingSubdomain ? 'Edit Subdomain' : 'Create New Subdomain'}</h2>
                <button onClick={() => setShowCreateForm(false)} className={styles.closeButton}>×</button>
              </div>
              
              {error && (
                <div className={styles.errorAlert}>
                  <XCircle size={16} />
                  <span>{error}</span>
                </div>
              )}
              
              <form onSubmit={handleCreateOrUpdate} className={styles.modalForm}>
                <div className={styles.formGroup}>
                  <label htmlFor="subdomain">Subdomain *</label>
                  <input
                    id="subdomain"
                    type="text"
                    placeholder="blog"
                    value={formData.subdomain}
                    onChange={(e) => setFormData({ ...formData, subdomain: e.target.value.toLowerCase() })}
                    className={styles.input}
                    disabled={!!editingSubdomain}
                    required
                  />
                  <small className={styles.hint}>Only lowercase letters, numbers, and hyphens</small>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="title">Title *</label>
                  <input
                    id="title"
                    type="text"
                    placeholder="My Awesome Blog"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className={styles.input}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="description">Description</label>
                  <input
                    id="description"
                    type="text"
                    placeholder="A blog about technology"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className={styles.input}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="content">Content (HTML)</label>
                  <textarea
                    id="content"
                    placeholder="<h2>Welcome to my blog!</h2><p>This is my first post.</p>"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className={styles.textarea}
                    rows={10}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="customCss">Custom CSS</label>
                  <textarea
                    id="customCss"
                    placeholder=".custom-class { color: blue; }"
                    value={formData.customCss}
                    onChange={(e) => setFormData({ ...formData, customCss: e.target.value })}
                    className={styles.textarea}
                    rows={6}
                  />
                </div>

                <div className={styles.modalActions}>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className={styles.cancelButton}
                  >
                    Cancel
                  </button>
                  <button type="submit" className={styles.submitButton} disabled={loading}>
                    {loading ? 'Saving...' : editingSubdomain ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className={styles.subdomainsList}>
          {filteredSubdomains.length === 0 ? (
            <div className={styles.emptyState}>
              <Globe size={48} strokeWidth={1.5} />
              <h3>No subdomains found</h3>
              <p>
                {searchQuery 
                  ? 'Try a different search term' 
                  : 'Create your first subdomain to get started'}
              </p>
            </div>
          ) : (
            <div className={styles.grid}>
              {filteredSubdomains.map((sub) => (
                <div key={sub._id} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <div className={styles.cardTitle}>
                      <h3>{sub.title}</h3>
                      <div className={styles.statusBadge} data-active={sub.isActive}>
                        {sub.isActive ? (
                          <><CheckCircle size={14} /> Active</>
                        ) : (
                          <><XCircle size={14} /> Inactive</>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <a 
                    href={`http://${sub.subdomain}.aryamanchandra.com`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.subdomainLink}
                  >
                    {sub.subdomain}.aryamanchandra.com
                    <ExternalLink size={14} />
                  </a>
                  
                  {sub.description && (
                    <p className={styles.cardDescription}>{sub.description}</p>
                  )}
                  
                  <div className={styles.cardMeta}>
                    <span className={styles.metaDate}>
                      {new Date(sub.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  
                  <div className={styles.cardActions}>
                    <button 
                      onClick={() => setDetailsView({ subdomain: sub, activeTab: 'analytics' })} 
                      className={styles.detailsButton}
                    >
                      <BarChart3 size={16} />
                      <span>Details</span>
                    </button>
                    <button onClick={() => handleEdit(sub)} className={styles.actionButton}>
                      <Edit2 size={16} />
                      <span>Edit</span>
                    </button>
                    <button onClick={() => handleDelete(sub.subdomain)} className={styles.deleteButton}>
                      <Trash2 size={16} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Details Modal */}
      {detailsView && (
        <div className={styles.detailsModal} onClick={() => setDetailsView(null)}>
          <div className={styles.detailsPanel} onClick={(e) => e.stopPropagation()}>
            <div className={styles.detailsHeader}>
              <div>
                <h2>{detailsView.subdomain.title}</h2>
                <p className={styles.detailsSubdomain}>
                  {detailsView.subdomain.subdomain}.aryamanchandra.com
                </p>
              </div>
              <button 
                onClick={() => setDetailsView(null)} 
                className={styles.detailsClose}
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.detailsTabs}>
              <button
                className={detailsView.activeTab === 'analytics' ? styles.activeTab : ''}
                onClick={() => setDetailsView({ ...detailsView, activeTab: 'analytics' })}
              >
                Analytics
              </button>
              <button
                className={detailsView.activeTab === 'dns' ? styles.activeTab : ''}
                onClick={() => setDetailsView({ ...detailsView, activeTab: 'dns' })}
              >
                DNS Checker
              </button>
              <button
                className={detailsView.activeTab === 'verification' ? styles.activeTab : ''}
                onClick={() => setDetailsView({ ...detailsView, activeTab: 'verification' })}
              >
                Verification
              </button>
            </div>

            <div className={styles.detailsContent}>
              {detailsView.activeTab === 'analytics' && (
                <AnalyticsDashboard 
                  subdomain={detailsView.subdomain.subdomain}
                  token={token}
                />
              )}
              {detailsView.activeTab === 'dns' && (
                <DNSChecker 
                  subdomain={detailsView.subdomain.subdomain}
                  token={token}
                />
              )}
              {detailsView.activeTab === 'verification' && (
                <VerificationWizard 
                  subdomain={detailsView.subdomain.subdomain}
                  token={token}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
