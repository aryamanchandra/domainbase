'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, LogOut, Edit2, Trash2, ExternalLink, 
  Globe, CheckCircle, XCircle, Search, Filter 
} from 'lucide-react';
import styles from './page.module.css';

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
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [subdomains, setSubdomains] = useState<Subdomain[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingSubdomain, setEditingSubdomain] = useState<Subdomain | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    subdomain: '',
    title: '',
    description: '',
    content: '',
    customCss: '',
  });

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      setToken(savedToken);
      setIsLoggedIn(true);
      fetchSubdomains(savedToken);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Login failed');
        return;
      }

      localStorage.setItem('token', data.token);
      setToken(data.token);
      setIsLoggedIn(true);
      fetchSubdomains(data.token);
    } catch (err) {
      setError('Failed to login');
    } finally {
      setLoading(false);
    }
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
        <div className={styles.loginCard}>
          <div className={styles.loginHeader}>
            <Globe className={styles.loginIcon} size={40} />
            <h1 className={styles.loginTitle}>Subdomain Manager</h1>
            <p className={styles.loginSubtitle}>Sign in to manage your subdomains</p>
          </div>
          
          <form onSubmit={handleLogin} className={styles.loginForm}>
            {error && (
              <div className={styles.errorAlert}>
                <XCircle size={16} />
                <span>{error}</span>
              </div>
            )}
            
            <div className={styles.formGroup}>
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={styles.input}
                required
                autoFocus
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.input}
                required
              />
            </div>
            
            <button type="submit" className={styles.loginButton} disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
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
    </div>
  );
}
