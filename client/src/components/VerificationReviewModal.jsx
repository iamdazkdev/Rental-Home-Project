import React from 'react';
import '../styles/VerificationReviewModal.scss';

const VerificationReviewModal = ({ type, userName, onClose }) => {
  const isApproved = type === 'approved';

  return (
    <div className="verification-review-modal-overlay" onClick={onClose}>
      <div className="verification-review-modal" onClick={(e) => e.stopPropagation()}>
        {/* Animated Icon */}
        <div className={`animated-icon ${isApproved ? 'success' : 'error'}`}>
          {isApproved ? (
            <div className="checkmark-wrapper">
              <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
                <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
              </svg>
            </div>
          ) : (
            <div className="cross-wrapper">
              <svg className="cross" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                <circle className="cross-circle" cx="26" cy="26" r="25" fill="none"/>
                <path className="cross-line cross-line-1" d="M16 16 36 36"/>
                <path className="cross-line cross-line-2" d="M16 36 36 16"/>
              </svg>
            </div>
          )}
        </div>

        {/* Message Content */}
        <div className="modal-message">
          <h2 className={isApproved ? 'success-title' : 'error-title'}>
            {isApproved ? '🎉 Verification Approved!' : '⚠️ Verification Rejected'}
          </h2>
          <p className="user-message">
            {isApproved ? (
              <>
                <strong>{userName}</strong>'s identity verification has been
                <span className="highlight success"> approved successfully</span>!
              </>
            ) : (
              <>
                <strong>{userName}</strong>'s identity verification has been
                <span className="highlight error"> rejected</span>.
              </>
            )}
          </p>

          {isApproved ? (
            <div className="info-box success-box">
              <p>✓ User can now create listings as a host</p>
              <p>✓ Email notification sent</p>
              <p>✓ Status updated in database</p>
            </div>
          ) : (
            <div className="info-box error-box">
              <p>• User has been notified via email</p>
              <p>• They can update and resubmit documents</p>
              <p>• Status changed to rejected</p>
            </div>
          )}
        </div>

        {/* Action Button */}
        <button
          className={`modal-action-btn ${isApproved ? 'success-btn' : 'error-btn'}`}
          onClick={onClose}
        >
          {isApproved ? '✓ Got it!' : 'Close'}
        </button>
      </div>
    </div>
  );
};

export default VerificationReviewModal;

