'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, Edit2, Trash2, ExternalLink, 
  Globe, CheckCircle, XCircle, Search, BarChart3, Moon, Sun, Shield
} from 'lucide-react';
import dynamic from 'next/dynamic';
import Sidebar from '@/components/Sidebar';
import NameSiloManager from '@/components/NameSiloManager';
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

const WhoisLookup = dynamic(() => import('@/components/WhoisLookup'), {
  ssr: false,
  loading: () => <div style={{ padding: '40px', textAlign: 'center' }}>Loading WHOIS…</div>
});

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'aryamanchandra.com';

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

interface UserInfo {
  name?: string;
  email?: string;
  picture?: string;
}

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState('');
  const [userInfo, setUserInfo] = useState<UserInfo | undefined>(undefined);
  const [subdomains, setSubdomains] = useState<Subdomain[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingSubdomain, setEditingSubdomain] = useState<Subdomain | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [currentView, setCurrentView] = useState<'subdomains' | 'dns' | 'details' | 'dns-records' | 'whois'>('subdomains');
  const [selectedSubdomain, setSelectedSubdomain] = useState<Subdomain | null>(null);
  const [detailsTab, setDetailsTab] = useState<'analytics' | 'dns' | 'verification'>('analytics');
  const [deleteConfirm, setDeleteConfirm] = useState<{ subdomain: string; title: string } | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    subdomain: '',
    title: '',
    description: '',
    content: '',
    customCss: '',
  });

  useEffect(() => {
    // Profile picture cache helpers
    const PROFILE_PIC_CACHE_KEY = 'cachedProfilePic';
    const PROFILE_PIC_CACHE_TIME_KEY = 'cachedProfilePicTime';
    const PROFILE_PIC_CACHE_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days

    async function cacheProfilePicture(url: string) {
      try {
        const response = await fetch(url);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          localStorage.setItem(PROFILE_PIC_CACHE_KEY, base64);
          localStorage.setItem(PROFILE_PIC_CACHE_TIME_KEY, String(Date.now()));
        };
        reader.readAsDataURL(blob);
      } catch (e) {
        console.error('Failed to cache profile picture:', e);
      }
    }

    async function loadCachedProfilePicture(originalUrl?: string): Promise<string | null> {
      const cached = localStorage.getItem(PROFILE_PIC_CACHE_KEY);
      const cachedTime = localStorage.getItem(PROFILE_PIC_CACHE_TIME_KEY);
      
      if (cached && cachedTime) {
        const age = Date.now() - parseInt(cachedTime, 10);
        if (age < PROFILE_PIC_CACHE_TTL) {
          return cached;
        }
      }
      
      // Cache expired or missing, fetch fresh if we have URL
      if (originalUrl) {
        cacheProfilePicture(originalUrl);
      }
      
      return null;
    }

    // Main effect logic
    (async () => {
      // Check for token in URL (from OAuth callback)
      const urlParams = new URLSearchParams(window.location.search);
      const urlToken = urlParams.get('token');
      const urlError = urlParams.get('error');
      const urlUserInfo = urlParams.get('userInfo');
      
      if (urlError) {
        setError('Authentication failed. Please try again.');
        window.history.replaceState({}, '', '/');
      }
      
      if (urlToken) {
        localStorage.setItem('token', urlToken);
        setToken(urlToken);
        setIsLoggedIn(true);
        
        if (urlUserInfo) {
          try {
            const parsedUserInfo = JSON.parse(decodeURIComponent(urlUserInfo));
            localStorage.setItem('userInfo', JSON.stringify(parsedUserInfo));
            setUserInfo(parsedUserInfo);
            
            // Cache profile picture
            if (parsedUserInfo.picture) {
              const cached = await loadCachedProfilePicture(parsedUserInfo.picture);
              if (cached) {
                setUserInfo({ ...parsedUserInfo, picture: cached });
              }
            }
          } catch (e) {
            console.error('Failed to parse user info:', e);
          }
        }
        
        fetchSubdomains(urlToken);
        window.history.replaceState({}, '', '/');
        return;
      }

      // Check for saved token and user info
      const savedToken = localStorage.getItem('token');
      const savedUserInfo = localStorage.getItem('userInfo');
      
      if (savedToken) {
        setToken(savedToken);
        setIsLoggedIn(true);
        fetchSubdomains(savedToken);
        
        if (savedUserInfo) {
          try {
            const parsedUserInfo = JSON.parse(savedUserInfo);
            
            // Try to load cached profile picture first
            if (parsedUserInfo.picture) {
              const cached = await loadCachedProfilePicture(parsedUserInfo.picture);
              if (cached) {
                setUserInfo({ ...parsedUserInfo, picture: cached });
              } else {
                setUserInfo(parsedUserInfo);
              }
            } else {
              setUserInfo(parsedUserInfo);
            }
          } catch (e) {
            console.error('Failed to parse saved user info:', e);
          }
        }
      }

      // Check theme
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'dark') {
        setDarkMode(true);
        document.documentElement.setAttribute('data-theme', 'dark');
      }
    })();
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

  const toggleSidebarCollapse = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', String(newState));
    
    if (newState) {
      document.documentElement.setAttribute('data-sidebar-collapsed', 'true');
    } else {
      document.documentElement.removeAttribute('data-sidebar-collapsed');
    }
  };

  // Load sidebar state
  useEffect(() => {
    const savedCollapsed = localStorage.getItem('sidebarCollapsed');
    if (savedCollapsed === 'true') {
      setSidebarCollapsed(true);
      document.documentElement.setAttribute('data-sidebar-collapsed', 'true');
    }
  }, []);

  const handleGoogleLogin = () => {
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
    try {
      const response = await fetch(`/api/subdomains/${subdomain}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchSubdomains(token);
        setDeleteConfirm(null);
      }
    } catch (err) {
      console.error('Failed to delete subdomain', err);
    }
  };

  const openDetails = (sub: Subdomain) => {
    setSelectedSubdomain(sub);
    setDetailsTab('analytics');
    setCurrentView('details');
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
    localStorage.removeItem('userInfo');
    localStorage.removeItem('cachedProfilePic');
    localStorage.removeItem('cachedProfilePicTime');
    setToken('');
    setIsLoggedIn(false);
    setSubdomains([]);
    setUserInfo(undefined);
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
    <div className={styles.appLayout}>
      <Sidebar
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
        onLogout={handleLogout}
        currentView={currentView}
        onNavigate={setCurrentView}
        userInfo={userInfo}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapse}
      />

      <main className={styles.mainContent}>
        {/* Domain Manager */}
        {currentView === 'dns-records' && (
          <div className={styles.pageContainer}>

            <NameSiloManager 
              token={token} 
              subdomains={subdomains.map(s => ({ subdomain: s.subdomain, userId: s._id }))}
            />
          </div>
        )}

        {/* DNS Checker View */}
        {currentView === 'dns' && (
          <div className={styles.pageContainer}>
            <div className={styles.pageHeader}>
              <h1>DNS Checker</h1>
              <p>Check DNS records and global propagation worldwide</p>
            </div>
            <DNSChecker subdomain="blog" token={token} />
          </div>
        )}

        {/* WHOIS Lookup */}
        {currentView === 'whois' && (
          <div className={styles.pageContainer}>
            <div className={styles.pageHeader}>
              <h1>WHOIS Lookup</h1>
              <p>Domain info from your NameSilo account</p>
            </div>
            <WhoisLookup token={token} />
          </div>
        )}

        {/* Subdomain Details View with Tabs */}
        {currentView === 'details' && selectedSubdomain && (
          <div className={styles.pageContainer}>
            <div className={styles.detailsHeader}>
              <div className={styles.detailsHeaderTop}>
                <button 
                  onClick={() => setCurrentView('subdomains')} 
                  className={styles.backButton}
                >
                  ← Back to Subdomains
                </button>
              </div>
              <div className={styles.detailsHeaderMain}>
                <div className={styles.detailsInfo}>
                  <h1>{selectedSubdomain.title}</h1>
                  <a 
                    href={`http://${selectedSubdomain.subdomain}.${ROOT_DOMAIN}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.detailsUrl}
                  >
                    {selectedSubdomain.subdomain}.{ROOT_DOMAIN}
                    <ExternalLink size={16} />
                  </a>
                </div>
                <div className={styles.detailsBadge} data-active={selectedSubdomain.isActive}>
                  {selectedSubdomain.isActive ? (
                    <><CheckCircle size={16} /> Active</>
                  ) : (
                    <><XCircle size={16} /> Inactive</>
                  )}
                </div>
              </div>
            </div>

            <div className={styles.detailsTabs}>
              <button
                className={detailsTab === 'analytics' ? styles.activeTab : ''}
                onClick={() => setDetailsTab('analytics')}
              >
                <BarChart3 size={18} />
                <span>Analytics</span>
              </button>
              <button
                className={detailsTab === 'verification' ? styles.activeTab : ''}
                onClick={() => setDetailsTab('verification')}
              >
                <Shield size={18} />
                <span>Verification</span>
              </button>
            </div>

            <div className={styles.detailsContent}>
              {detailsTab === 'analytics' && (
                <AnalyticsDashboard subdomain={selectedSubdomain.subdomain} token={token} />
              )}
              {detailsTab === 'verification' && (
                <VerificationWizard subdomain={selectedSubdomain.subdomain} token={token} />
              )}
            </div>
          </div>
        )}

        {/* Subdomains View (default) */}
        {currentView === 'subdomains' && (
          <div className={styles.pageContainer}>
            <div className={styles.pageHeader}>
              <div>
                <h1>Subdomains</h1>
                <p>{subdomains.length} total</p>
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
                  <div key={sub._id} className={styles.card} onClick={() => openDetails(sub)}>
                    <div className={styles.cardTop}>
                      <div className={styles.cardTitleRow}>
                        <h3 className={styles.cardTitle}>{sub.title}</h3>
                        <div className={styles.statusBadge} data-active={sub.isActive}>
                          {sub.isActive ? (
                            <><CheckCircle size={12} /> Active</>
                          ) : (
                            <><XCircle size={12} /> Inactive</>
                          )}
                        </div>
                      </div>
                      
                      <div className={styles.subdomainUrl}>
                        <Globe size={14} />
                        <span>{sub.subdomain}.{ROOT_DOMAIN}</span>
                      </div>
                      
                      {sub.description && (
                        <p className={styles.cardDescription}>{sub.description}</p>
                      )}
                    </div>
                    
                    <div className={styles.cardBottom}>
                      <div className={styles.cardMeta}>
                        <span className={styles.metaDate}>
                          {new Date(sub.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                      
                      <div className={styles.cardQuickActions}>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(sub);
                          }} 
                          className={styles.iconButton}
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`http://${sub.subdomain}.${ROOT_DOMAIN}`, '_blank');
                          }} 
                          className={styles.iconButton}
                          title="Open"
                        >
                          <ExternalLink size={16} />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirm({ subdomain: sub.subdomain, title: sub.title });
                          }} 
                          className={styles.iconButtonDanger}
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Create/Edit Modal */}
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

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className={styles.confirmModal} onClick={() => setDeleteConfirm(null)}>
            <div className={styles.confirmCard} onClick={(e) => e.stopPropagation()}>
              <div className={styles.confirmIcon}>
                <Trash2 size={24} color="#ff0080" />
              </div>
              <h3>Delete Subdomain</h3>
              <p>
                Are you sure you want to delete <strong>{deleteConfirm.title}</strong>?
              </p>
              <p className={styles.confirmSubtext}>
                {deleteConfirm.subdomain}.{ROOT_DOMAIN}
              </p>
              <p className={styles.confirmWarning}>
                This action cannot be undone. All data and analytics for this subdomain will be permanently deleted.
              </p>
              <div className={styles.confirmActions}>
                <button 
                  onClick={() => setDeleteConfirm(null)} 
                  className={styles.confirmCancel}
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleDelete(deleteConfirm.subdomain)} 
                  className={styles.confirmDelete}
                >
                  <Trash2 size={16} />
                  <span>Delete Subdomain</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

