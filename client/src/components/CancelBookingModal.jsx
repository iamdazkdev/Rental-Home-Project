import React, { useState } from 'react';
import '../styles/CancelBookingModal.scss';

const CancelBookingModal = ({ booking, onClose, onConfirm }) => {
  const [cancellationReason, setCancellationReason] = useState('');
  const [selectedReason, setSelectedReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const predefinedReasons = [
    'Found a better property',
    'Change in travel plans',
    'Property not as expected',
    'Host not responding',
    'Budget constraints',
    'Booking was a mistake',
    'Other (please specify below)'
  ];

  const handleConfirm = async () => {
    const reason = selectedReason === 'Other (please specify below)'
      ? cancellationReason
      : selectedReason;

    if (!reason.trim()) {
      alert('Please select or enter a cancellation reason');
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(reason);
      onClose();
    } catch (error) {
      console.error('Error confirming cancellation:', error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="cancel-modal-overlay" onClick={onClose}>
      <div className="cancel-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="cancel-modal-header">
          <h2>🚫 Cancel Booking Request</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {/* Body */}
        <div className="cancel-modal-body">
          {/* Booking Info */}
          <div className="booking-info">
            <div className="info-icon">🏠</div>
            <div className="info-details">
              <h3>{booking.listingId?.title || 'Property'}</h3>
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
              <strong>This action cannot be undone</strong>
              <p>Your booking request will be cancelled and the host will be notified.</p>
            </div>
          </div>

          {/* Reason Selection */}
          <div className="reason-section">
            <label className="section-label">
              <span className="required">*</span> Reason for cancellation:
            </label>

            <div className="reason-options">
              {predefinedReasons.map((reason) => (
                <label key={reason} className="reason-option">
                  <input
                    type="radio"
                    name="cancellation-reason"
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
                  placeholder="Please provide your reason for cancelling..."
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  rows={4}
                  maxLength={500}
                />
                <div className="char-count">
                  {cancellationReason.length}/500
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="cancel-modal-footer">
          <button
            className="modal-btn keep-btn"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Keep Booking
          </button>
          <button
            className="modal-btn cancel-confirm-btn"
            onClick={handleConfirm}
            disabled={isSubmitting || !selectedReason}
          >
            {isSubmitting ? (
              <>
                <span className="spinner"></span>
                Cancelling...
              </>
            ) : (
              'Yes, Cancel Booking'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CancelBookingModal;

