import { Edit2, Trash2, ExternalLink, BarChart3, CheckCircle, XCircle } from 'lucide-react';
import styles from '@/styles/page.module.css';
import type { Subdomain } from '@/types';

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN!;

interface Props {
  subdomain: Subdomain;
  onEdit: (subdomain: Subdomain) => void;
  onDelete: (subdomain: string, title: string) => void;
  onViewAnalytics: (subdomain: string) => void;
}

export default function SubdomainCard({ subdomain, onEdit, onDelete, onViewAnalytics }: Props) {
  return (
    <div
      className={styles.subdomainCard}
      data-active={subdomain.isActive}
      onClick={() => onViewAnalytics(subdomain.subdomain)}
    >
      <div className={styles.cardHeader}>
        <div className={styles.cardTitle}>
          <h3>{subdomain.title}</h3>
          <div className={styles.statusBadge} data-active={subdomain.isActive}>
            {subdomain.isActive ? (
              <><CheckCircle size={14} /> Active</>
            ) : (
              <><XCircle size={14} /> Inactive</>
            )}
          </div>
        </div>
        <div className={styles.cardActions}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(subdomain);
            }}
            className={styles.iconButton}
            title="Edit"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(subdomain.subdomain, subdomain.title);
            }}
            className={styles.iconButtonDanger}
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className={styles.subdomainUrl}>
        <code>{subdomain.subdomain}.{ROOT_DOMAIN}</code>
        <a
          href={`http://${subdomain.subdomain}.${ROOT_DOMAIN}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          title="Open subdomain"
        >
          <ExternalLink size={14} />
        </a>
      </div>

      <p className={styles.description}>{subdomain.description || 'No description'}</p>

      <div className={styles.cardFooter}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onViewAnalytics(subdomain.subdomain);
          }}
          className={styles.analyticsButton}
        >
          <BarChart3 size={14} />
          <span>View Analytics</span>
        </button>
      </div>
    </div>
  );
}

