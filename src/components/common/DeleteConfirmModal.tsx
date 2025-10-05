import styles from '@/styles/page.module.css';

interface Props {
  title: string;
  message: string;
  itemName?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteConfirmModal({ title, message, itemName, onConfirm, onCancel }: Props) {
  return (
    <div className={styles.modal} onClick={onCancel}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        <p>{message}</p>
        {itemName && (
          <p style={{ fontWeight: 600, margin: '8px 0' }}>
            <code>{itemName}</code>
          </p>
        )}
        <p className={styles.warning}>This action cannot be undone.</p>
        <div className={styles.modalActions}>
          <button onClick={onCancel} className={styles.cancelButton}>
            Cancel
          </button>
          <button onClick={onConfirm} className={styles.confirmDelete}>
            Delete Subdomain
          </button>
        </div>
      </div>
    </div>
  );
}

