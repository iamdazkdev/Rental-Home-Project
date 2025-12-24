import React, { useState } from 'react';
import '../styles/RejectBookingModal.scss';

const RejectBookingModal = ({ booking, onClose, onConfirm }) => {
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedReason, setSelectedReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const predefinedReasons = [
    'Property not available for selected dates',
    'Guest requirements do not match property rules',
    'Maintenance or repairs needed',
    'Personal or family use',
    'Booking duration too short/long',
    'Suspicious or incomplete profile',
    'Other (please specify below)'
  ];

  const handleConfirm = async () => {
    const reason = selectedReason === 'Other (please specify below)'
      ? rejectionReason
      : selectedReason;

    if (!reason.trim()) {
      alert('Please select or enter a rejection reason');
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(reason);
      onClose();
    } catch (error) {
      console.error('Error confirming rejection:', error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="reject-modal-overlay" onClick={onClose}>
      <div className="reject-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="reject-modal-header">
          <h2>✗ Reject Booking Request</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {/* Body */}
        <div className="reject-modal-body">
          {/* Booking Info */}
          <div className="booking-info">
            <div className="info-icon">👤</div>
            <div className="info-details">
              <h3>
                {booking.customerId?.firstName} {booking.customerId?.lastName}
              </h3>
              <p className="property">🏠 {booking.listingId?.title || 'Property'}</p>
              <p className="dates">
                📅 {booking.startDate} → {booking.endDate}
              </p>
              <p className="price">💰 ${booking.totalPrice?.toFixed(2)}</p>
            </div>
          </div>

          {/* Warning Message */}
          <div className="warning-message">
            <div className="warning-icon">⚠️</div>
            <div className="warning-text">
              <strong>Important</strong>
              <p>The guest will be notified about the rejection and the reason you provide.</p>
            </div>
          </div>

          {/* Reason Selection */}
          <div className="reason-section">
            <label className="section-label">
              <span className="required">*</span> Reason for rejection:
            </label>

            <div className="reason-options">
              {predefinedReasons.map((reason) => (
                <label key={reason} className="reason-option">
                  <input
                    type="radio"
                    name="rejection-reason"
                    value={reason}
                    checked={selectedReason === reason}
                    onChange={(e) => setSelectedReason(e.target.value)}
                  />
                  <span className="reason-text">{reason}</span>
                </label>
              ))}
            </div>

            {/* Custom Reason Input */}
            {selectedReason === 'Other (please specify below)' && (
              <div className="custom-reason">
                <textarea
                  className="reason-textarea"
                  placeholder="Please provide your reason for rejecting this booking..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                  maxLength={500}
                />
                <div className="char-count">
                  {rejectionReason.length}/500
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="reject-modal-footer">
          <button
            className="modal-btn keep-btn"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            className="modal-btn reject-confirm-btn"
            onClick={handleConfirm}
            disabled={isSubmitting || !selectedReason}
          >
            {isSubmitting ? (
              <>
                <span className="spinner"></span>
                Rejecting...
              </>
            ) : (
              'Reject Booking'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RejectBookingModal;

