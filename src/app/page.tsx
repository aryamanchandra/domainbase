'use client';

import { useState, useEffect } from 'react';
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

  if (!isLoggedIn) {
    return (
      <div className={styles.container}>
        <div className={styles.loginBox}>
          <h1 className={styles.title}>Subdomain Creator</h1>
          <p className={styles.subtitle}>Admin Login</p>
          
          <form onSubmit={handleLogin} className={styles.form}>
            {error && <div className={styles.error}>{error}</div>}
            
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={styles.input}
              required
            />
            
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
              required
            />
            
            <button type="submit" className={styles.button} disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Subdomain Manager</h1>
        <div className={styles.headerActions}>
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
            + Create Subdomain
          </button>
          <button onClick={handleLogout} className={styles.logoutButton}>
            Logout
          </button>
        </div>
      </header>

      {showCreateForm && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h2>{editingSubdomain ? 'Edit Subdomain' : 'Create New Subdomain'}</h2>
            
            {error && <div className={styles.error}>{error}</div>}
            
            <form onSubmit={handleCreateOrUpdate} className={styles.form}>
              <div className={styles.formGroup}>
                <label>Subdomain *</label>
                <input
                  type="text"
                  placeholder="blog"
                  value={formData.subdomain}
                  onChange={(e) => setFormData({ ...formData, subdomain: e.target.value.toLowerCase() })}
                  className={styles.input}
                  disabled={!!editingSubdomain}
                  required
                />
                <small>Only lowercase letters, numbers, and hyphens</small>
              </div>

              <div className={styles.formGroup}>
                <label>Title *</label>
                <input
                  type="text"
                  placeholder="My Blog"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Description</label>
                <input
                  type="text"
                  placeholder="A blog about technology"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Content (HTML)</label>
                <textarea
                  placeholder="<h2>Welcome to my blog!</h2><p>This is my first post.</p>"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className={styles.textarea}
                  rows={10}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Custom CSS</label>
                <textarea
                  placeholder=".custom-class { color: blue; }"
                  value={formData.customCss}
                  onChange={(e) => setFormData({ ...formData, customCss: e.target.value })}
                  className={styles.textarea}
                  rows={6}
                />
              </div>

              <div className={styles.formActions}>
                <button type="submit" className={styles.button} disabled={loading}>
                  {loading ? 'Saving...' : editingSubdomain ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingSubdomain(null);
                    setError('');
                  }}
                  className={styles.cancelButton}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className={styles.subdomainsList}>
        {subdomains.length === 0 ? (
          <p className={styles.emptyState}>No subdomains yet. Create your first one!</p>
        ) : (
          <div className={styles.grid}>
            {subdomains.map((sub) => (
              <div key={sub._id} className={styles.card}>
                <h3>{sub.title}</h3>
                <p className={styles.subdomainUrl}>
                  {sub.subdomain}.aryamanchandra.com
                </p>
                {sub.description && <p className={styles.description}>{sub.description}</p>}
                <div className={styles.cardMeta}>
                  <span className={sub.isActive ? styles.active : styles.inactive}>
                    {sub.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <span className={styles.date}>
                    {new Date(sub.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className={styles.cardActions}>
                  <button onClick={() => handleEdit(sub)} className={styles.editButton}>
                    Edit
                  </button>
                  <button onClick={() => handleDelete(sub.subdomain)} className={styles.deleteButton}>
                    Delete
                  </button>
                  <a
                    href={`http://${sub.subdomain}.aryamanchandra.com`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.viewButton}
                  >
                    View
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

