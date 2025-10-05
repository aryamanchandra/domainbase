import { useState } from 'react';
import { X } from 'lucide-react';
import styles from '@/styles/page.module.css';
import type { Subdomain } from '@/types';

interface FormData {
  subdomain: string;
  title: string;
  description: string;
  content: string;
  customCss: string;
}

interface Props {
  editingSubdomain: Subdomain | null;
  initialData: FormData;
  onSubmit: (data: FormData) => Promise<void>;
  onClose: () => void;
  error: string;
  loading: boolean;
}

export default function SubdomainForm({ 
  editingSubdomain, 
  initialData, 
  onSubmit, 
  onClose, 
  error,
  loading 
}: Props) {
  const [formData, setFormData] = useState<FormData>(initialData);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <div className={styles.modal} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>{editingSubdomain ? 'Edit Subdomain' : 'Create New Subdomain'}</h3>
          <button onClick={onClose} className={styles.closeButton}>
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
            <label>Subdomain *</label>
            <input
              type="text"
              placeholder="mysite"
              value={formData.subdomain}
              onChange={(e) =>
                setFormData({ ...formData, subdomain: e.target.value.toLowerCase() })
              }
              disabled={!!editingSubdomain}
              required
            />
            <small>Only lowercase letters, numbers, and hyphens</small>
          </div>

          <div className={styles.formGroup}>
            <label>Title *</label>
            <input
              type="text"
              placeholder="My Awesome Site"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Description</label>
            <input
              type="text"
              placeholder="A brief description of your subdomain"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Content (HTML)</label>
            <textarea
              placeholder="<h1>Welcome!</h1><p>Your content here...</p>"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={10}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Custom CSS (Optional)</label>
            <textarea
              placeholder="body { background: #f0f0f0; }"
              value={formData.customCss}
              onChange={(e) => setFormData({ ...formData, customCss: e.target.value })}
              rows={6}
            />
          </div>

          <div className={styles.formActions}>
            <button type="button" onClick={onClose} className={styles.cancelButton}>
              Cancel
            </button>
            <button type="submit" disabled={loading} className={styles.submitButton}>
              {loading ? 'Saving...' : editingSubdomain ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

