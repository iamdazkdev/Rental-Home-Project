import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/VerificationSuccessModal.scss';

const VerificationSuccessModal = ({ onClose, verificationData }) => {
  const navigate = useNavigate();

  const handleViewStatus = () => {
    onClose();
    // Redirect to create-listing page which will show verification status
    navigate('/create-listing');
  };

  const handleContinue = () => {
    onClose();
  };

  return (
    <div className="verification-success-modal-overlay" onClick={handleContinue}>
      <div className="verification-success-modal" onClick={(e) => e.stopPropagation()}>
        {/* Success Animation */}
        <div className="success-animation">
          <div className="checkmark-circle">
            <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
              <circle className="checkmark-circle-path" cx="26" cy="26" r="25" fill="none"/>
              <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
            </svg>
          </div>
        </div>

        {/* Success Message */}
        <div className="success-content">
          <h2>🎉 Verification Submitted!</h2>
          <p className="success-message">
            Your identity verification has been submitted successfully.
          </p>
          <p className="info-message">
            Our admin team will review your documents within 24-48 hours.
            You'll receive a notification once your verification is approved.
          </p>

          {/* Verification Info Card */}
          <div className="verification-info-card">
            <div className="info-row">
              <span className="info-label">Status:</span>
              <span className="info-value status-pending">
                <span className="status-dot"></span>
                Pending Review
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">Submitted:</span>
              <span className="info-value">
                {new Date().toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">Name:</span>
              <span className="info-value">{verificationData?.fullName || 'N/A'}</span>
            </div>
          </div>

          {/* Next Steps */}
          <div className="next-steps">
            <h3>📋 What's Next?</h3>
            <ul>
              <li>✅ Your documents are being reviewed by our team</li>
              <li>📧 You'll receive an email notification</li>
              <li>🔔 Check your notifications for updates</li>
              <li>✨ Once approved, you can create Shared Room & Roommate listings</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="modal-actions">
            <button
              className="btn-view-status"
              onClick={handleViewStatus}
            >
              <span className="btn-icon">👁️</span>
              View Verification Status
            </button>
            <button
              className="btn-continue"
              onClick={handleContinue}
            >
              Continue
            </button>
          </div>
        </div>

        {/* Close Button */}
        <button className="modal-close-btn" onClick={handleContinue}>
          ✕
        </button>
      </div>
    </div>
  );
};

export default VerificationSuccessModal;

