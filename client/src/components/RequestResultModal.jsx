import React from "react";
import "../styles/RequestResultModal.scss";

const RequestResultModal = ({ type, message, onClose, onViewRequests }) => {
  const isSuccess = type === "success";

  return (
    <div className="result-modal-overlay" onClick={onClose}>
      <div className="result-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className={`result-icon ${isSuccess ? "success" : "error"}`}>
          {isSuccess ? (
            <div className="success-checkmark">
              <div className="check-icon">
                <span className="icon-line line-tip"></span>
                <span className="icon-line line-long"></span>
                <div className="icon-circle"></div>
                <div className="icon-fix"></div>
              </div>
            </div>
          ) : (
            <div className="error-icon">
              <span className="error-x">✕</span>
            </div>
          )}
        </div>

        <h2 className={isSuccess ? "success-title" : "error-title"}>
          {isSuccess ? "Request Submitted Successfully!" : "Request Failed"}
        </h2>

        <p className="result-message">{message}</p>

        {isSuccess && (
          <div className="next-steps">
            <h4>What's next?</h4>
            <ul>
              <li>✓ The host will review your request</li>
              <li>✓ You'll receive a notification of their decision</li>
              <li>✓ If approved, you can proceed with the rental agreement</li>
            </ul>
          </div>
        )}

        <div className="result-actions">
          {isSuccess ? (
            <>
              <button className="primary-btn" onClick={onViewRequests}>
                View My Requests
              </button>
              <button className="secondary-btn" onClick={onClose}>
                Browse More Rooms
              </button>
            </>
          ) : (
            <>
              <button className="primary-btn" onClick={onClose}>
                Try Again
              </button>
              <button className="secondary-btn" onClick={() => window.location.href = "/"}>
                Go to Homepage
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RequestResultModal;

