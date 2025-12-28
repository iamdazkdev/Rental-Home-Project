import React from "react";
import "../styles/CashPaymentConfirmModal.scss";

const CashPaymentConfirmModal = ({ isOpen, onClose, onConfirm, amount, loading }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="cash-confirm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="icon-wrapper">
            <span className="icon">💵</span>
          </div>
          <h2>Confirm Cash Payment</h2>
        </div>

        <div className="modal-body">
          <div className="amount-display">
            <p className="label">Amount to Pay at Check-in:</p>
            <p className="amount">{amount?.toLocaleString('vi-VN')} VND</p>
          </div>

          <div className="important-notes">
            <h4>⚠️ Important Reminders:</h4>
            <ul>
              <li>
                <strong>Bring exact amount:</strong> Please prepare{" "}
                <strong>{amount?.toLocaleString('vi-VN')} VND</strong> in cash
              </li>
              <li>
                <strong>Payment deadline:</strong> Must be paid upon check-in
              </li>
              <li>
                <strong>No receipt:</strong> Cash payments don't have digital confirmation
              </li>
              <li>
                <strong>Host confirmation required:</strong> Host will verify payment at check-in
              </li>
            </ul>
          </div>

          <div className="confirmation-question">
            <p>
              Do you confirm that you will bring{" "}
              <strong>{amount?.toLocaleString('vi-VN')} VND</strong> in cash at check-in?
            </p>
          </div>
        </div>

        <div className="modal-footer">
          <button
            className="btn-cancel"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="btn-confirm"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Processing..." : "Yes, I Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CashPaymentConfirmModal;

