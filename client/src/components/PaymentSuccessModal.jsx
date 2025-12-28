import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/CashPaymentConfirmModal.scss";

const PaymentSuccessModal = ({ isOpen, onClose, amount, navigateTo = "/trips" }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleNavigate = () => {
    console.log("✅ Navigating to:", navigateTo);

    // Close modal first
    if (onClose) {
      onClose();
    }

    // Navigate immediately (no delay needed)
    navigate(navigateTo, { replace: true });
  };

  return (
    <div className="modal-overlay">
      <div className="cash-confirm-modal success-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="icon-wrapper">
            <span className="icon">✅</span>
          </div>
          <h2>Payment Confirmed!</h2>
        </div>

        <div className="success-message">
          <h3>Cash Payment Confirmed</h3>
          <p>
            You have confirmed to pay <strong>{amount?.toLocaleString('vi-VN')} VND</strong> in cash at check-in.
          </p>
          <p>
            Please make sure to bring the exact amount when you arrive.
          </p>
          <div className="important-notes" style={{ marginTop: '20px', textAlign: 'left' }}>
            <h4>📝 Next Steps:</h4>
            <ul>
              <li>Prepare <strong>{amount?.toLocaleString('vi-VN')} VND</strong> in cash</li>
              <li>Bring the money when you check in</li>
              <li>Host will verify and confirm payment</li>
              <li>Enjoy your stay!</li>
            </ul>
          </div>
        </div>

        <div className="modal-footer">
          <button
            className="btn-confirm"
            onClick={handleNavigate}
            style={{ width: '100%' }}
          >
            Go to My Trips
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessModal;

