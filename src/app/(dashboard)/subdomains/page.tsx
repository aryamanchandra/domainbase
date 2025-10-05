'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search } from 'lucide-react';
import styles from '@/styles/page.module.css';
import type { Subdomain } from '@/types';
import { useAuth, useSubdomains } from '@/hooks';
import SubdomainCard from '@/components/subdomains/SubdomainCard';
import SubdomainForm from '@/components/subdomains/SubdomainForm';
import DeleteConfirmModal from '@/components/common/DeleteConfirmModal';

export default function SubdomainsPage() {
  const router = useRouter();
  const { token } = useAuth();
  const { subdomains, refetch } = useSubdomains(token);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingSubdomain, setEditingSubdomain] = useState<Subdomain | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ subdomain: string; title: string } | null>(null);

  const [formData, setFormData] = useState({
    subdomain: '',
    title: '',
    description: '',
    content: '',
    customCss: '',
  });

  const handleCreateOrUpdate = async (data: typeof formData) => {
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
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Operation failed');
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
      refetch();
    } catch (err) {
      setError('Operation failed');
    } finally {
      setLoading(false);
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

  const handleDelete = async (subdomain: string) => {
    try {
      const response = await fetch(`/api/subdomains/${subdomain}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        refetch();
        setDeleteConfirm(null);
      }
    } catch (err) {
      console.error('Failed to delete subdomain:', err);
    }
  };

  const handleCloseForm = () => {
    setShowCreateForm(false);
    setEditingSubdomain(null);
    setFormData({
      subdomain: '',
      title: '',
      description: '',
      content: '',
      customCss: '',
    });
    setError('');
  };

  const filteredSubdomains = subdomains.filter((sub) =>
    sub.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sub.subdomain.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div>
          <h1>Subdomains</h1>
          <p>{subdomains.length} total subdomains</p>
        </div>
        <button onClick={() => setShowCreateForm(true)} className={styles.createButton}>
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
        <div className={styles.empty}>
          <p>{searchQuery ? 'No subdomains match your search' : 'No subdomains yet. Create your first one!'}</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredSubdomains.map((subdomain) => (
            <SubdomainCard
              key={subdomain._id}
              subdomain={subdomain}
              onEdit={handleEdit}
              onDelete={(sub, title) => setDeleteConfirm({ subdomain: sub, title })}
              onViewAnalytics={(sub) => router.push(`/analytics/${sub}`)}
            />
          ))}
        </div>
      )}

      {showCreateForm && (
        <SubdomainForm
          editingSubdomain={editingSubdomain}
          initialData={formData}
          onSubmit={handleCreateOrUpdate}
          onClose={handleCloseForm}
          error={error}
          loading={loading}
        />
      )}

      {deleteConfirm && (
        <DeleteConfirmModal
          title="Delete Subdomain?"
          message={`Are you sure you want to delete "${deleteConfirm.title}"?`}
          itemName={deleteConfirm.subdomain}
          onConfirm={() => handleDelete(deleteConfirm.subdomain)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}
