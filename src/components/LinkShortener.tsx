'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Copy, ExternalLink, BarChart3, Check, X } from 'lucide-react';
import styles from './LinkShortener.module.css';

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN!;

interface ShortLink {
  _id: string;
  slug: string;
  targetUrl: string;
  clicks: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  metadata?: {
    title?: string;
    description?: string;
  };
}

interface Props {
  token: string;
}

export default function LinkShortener({ token }: Props) {
  const [links, setLinks] = useState<ShortLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingLink, setEditingLink] = useState<ShortLink | null>(null);
  const [error, setError] = useState('');
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    slug: '',
    targetUrl: '',
    title: '',
    description: '',
  });

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/links', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch links');

      const data = await response.json();
      setLinks(data.links || []);
    } catch (err) {
      console.error('Error fetching links:', err);
      setError('Failed to load links');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const url = editingLink ? `/api/links/${editingLink.slug}` : '/api/links';
      const method = editingLink ? 'PUT' : 'POST';

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

      setShowForm(false);
      setEditingLink(null);
      setFormData({ slug: '', targetUrl: '', title: '', description: '' });
      fetchLinks();
    } catch (err) {
      setError('Operation failed');
    }
  };

  const handleEdit = (link: ShortLink) => {
    setEditingLink(link);
    setFormData({
      slug: link.slug,
      targetUrl: link.targetUrl,
      title: link.metadata?.title || '',
      description: link.metadata?.description || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (slug: string) => {
    try {
      const response = await fetch(`/api/links/${slug}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        fetchLinks();
        setDeleteConfirm(null);
      }
    } catch (err) {
      console.error('Failed to delete link:', err);
    }
  };

  const copyToClipboard = (slug: string) => {
    const shortUrl = `https://url.${ROOT_DOMAIN}/${slug}`;
    navigator.clipboard.writeText(shortUrl);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  if (loading) {
    return <div className={styles.loading}>Loading links...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2>Link Shortener</h2>
          <p>{links.length} short links</p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingLink(null);
            setFormData({ slug: '', targetUrl: '', title: '', description: '' });
          }}
          className={styles.createButton}
        >
          <Plus size={18} />
          <span>Create Short Link</span>
        </button>
      </div>

      {showForm && (
        <div className={styles.modal} onClick={() => setShowForm(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>{editingLink ? 'Edit Short Link' : 'Create Short Link'}</h3>
              <button onClick={() => setShowForm(false)} className={styles.closeButton}>
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className={styles.error}>
                <X size={16} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label>Slug *</label>
                <div className={styles.slugPreview}>
                  <span>url.{ROOT_DOMAIN}/</span>
                  <input
                    type="text"
                    placeholder="my-link"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({ ...formData, slug: e.target.value.toLowerCase() })
                    }
                    disabled={!!editingLink}
                    required
                  />
                </div>
                <small>Only letters, numbers, hyphens, and underscores</small>
              </div>

              <div className={styles.formGroup}>
                <label>Target URL *</label>
                <input
                  type="url"
                  placeholder="https://example.com"
                  value={formData.targetUrl}
                  onChange={(e) => setFormData({ ...formData, targetUrl: e.target.value })}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Title (Optional)</label>
                <input
                  type="text"
                  placeholder="My Link"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Description (Optional)</label>
                <input
                  type="text"
                  placeholder="Link description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className={styles.formActions}>
                <button type="button" onClick={() => setShowForm(false)} className={styles.cancelButton}>
                  Cancel
                </button>
                <button type="submit" className={styles.submitButton}>
                  {editingLink ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className={styles.linksList}>
        {links.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No short links yet. Create your first one!</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {links.map((link) => (
              <div key={link._id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardTitle}>
                    <h3>{link.metadata?.title || link.slug}</h3>
                    <div className={styles.statusBadge} data-active={link.isActive}>
                      {link.isActive ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                </div>

                <div className={styles.shortUrl}>
                  <code>url.{ROOT_DOMAIN}/{link.slug}</code>
                  <button
                    onClick={() => copyToClipboard(link.slug)}
                    className={styles.iconButton}
                    title="Copy"
                  >
                    {copiedSlug === link.slug ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>

                <div className={styles.targetUrl}>
                  <span>→</span>
                  <a href={link.targetUrl} target="_blank" rel="noopener noreferrer">
                    {link.targetUrl}
                  </a>
                </div>

                {link.metadata?.description && (
                  <p className={styles.description}>{link.metadata.description}</p>
                )}

                <div className={styles.stats}>
                  <div className={styles.stat}>
                    <BarChart3 size={14} />
                    <span>{link.clicks} clicks</span>
                  </div>
                  <span className={styles.date}>
                    {new Date(link.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className={styles.cardActions}>
                  <button onClick={() => handleEdit(link)} className={styles.actionButton}>
                    <Edit2 size={16} />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => window.open(`https://url.${ROOT_DOMAIN}/${link.slug}`, '_blank')}
                    className={styles.actionButton}
                  >
                    <ExternalLink size={16} />
                    <span>Visit</span>
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(link.slug)}
                    className={styles.deleteButton}
                  >
                    <Trash2 size={16} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {deleteConfirm && (
        <div className={styles.confirmModal} onClick={() => setDeleteConfirm(null)}>
          <div className={styles.confirmCard} onClick={(e) => e.stopPropagation()}>
            <h3>Delete Short Link?</h3>
            <p>
              Are you sure you want to delete <code>{deleteConfirm}</code>?
            </p>
            <p className={styles.confirmWarning}>This action cannot be undone.</p>
            <div className={styles.confirmActions}>
              <button onClick={() => setDeleteConfirm(null)} className={styles.confirmCancel}>
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteConfirm)} className={styles.confirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

