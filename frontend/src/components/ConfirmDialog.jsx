import Modal from './Modal';

export default function ConfirmDialog({
  title = 'Please confirm',
  message,
  confirmLabel = 'Delete',
  busy = false,
  onConfirm,
  onCancel,
}) {
  return (
    <Modal
      title={title}
      onClose={busy ? () => {} : onCancel}
      footer={
        <>
          <button type="button" className="cancel-button" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button type="button" className="delete-button" onClick={onConfirm} disabled={busy}>
            {busy ? 'Working...' : confirmLabel}
          </button>
        </>
      }
    >
      <p>{message}</p>
    </Modal>
  );
}
