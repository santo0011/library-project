import { Modal } from './Modal.jsx';

export const ConfirmModal = ({ show, title, message, onCancel, onConfirm, busy }) => {

  return (
    <Modal
      show={show}
      title={title}
      size="sm"
      onClose={onCancel}
      footer={
        <div className="d-flex justify-content-end gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={onCancel}
            disabled={busy}
          >
            {busy ? "Please wait..." : "Cancel"}
          </button>

          <button
            type="button"
            className="btn btn-danger"
            onClick={onConfirm}
            disabled={busy}
          >
            {busy
              ? `${title?.split(" ")[0] || "Delete"}...`
              : title?.split(" ")[0] || "Delete"}
          </button>
        </div>
      }
    >
      <p className="mb-0">{message}</p>
    </Modal>
  );
};