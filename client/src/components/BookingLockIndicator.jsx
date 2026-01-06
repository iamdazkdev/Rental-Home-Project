/**
 * BookingLockIndicator Component
 *
 * Displays the booking lock status and countdown timer
 * Shows warnings when lock is about to expire
 */

import React from 'react';
import { Clock, AlertTriangle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import '../styles/BookingLockIndicator.scss';

const BookingLockIndicator = ({
  timeRemaining,
  isExpired,
  hasActiveLock,
  onExtend,
  onCancel,
  formatTimeRemaining,
  isExtending = false,
}) => {
  if (!hasActiveLock && !isExpired) {
    return null;
  }

  const isWarning = timeRemaining > 0 && timeRemaining <= 60; // Last minute warning
  const isCritical = timeRemaining > 0 && timeRemaining <= 30; // Last 30 seconds

  const getStatusColor = () => {
    if (isExpired) return 'expired';
    if (isCritical) return 'critical';
    if (isWarning) return 'warning';
    return 'active';
  };

  return (
    <div className={`booking-lock-indicator ${getStatusColor()}`}>
      <div className="lock-content">
        {isExpired ? (
          <>
            <XCircle className="lock-icon expired-icon" />
            <div className="lock-info">
              <span className="lock-title">Reservation Expired</span>
              <span className="lock-description">
                Your temporary reservation has expired. Please start again.
              </span>
            </div>
          </>
        ) : (
          <>
            {isCritical ? (
              <AlertTriangle className="lock-icon critical-icon pulse" />
            ) : isWarning ? (
              <Clock className="lock-icon warning-icon" />
            ) : (
              <CheckCircle className="lock-icon active-icon" />
            )}
            <div className="lock-info">
              <span className="lock-title">
                {isCritical
                  ? 'Hurry! Reservation expiring soon'
                  : isWarning
                  ? 'Reservation expiring'
                  : 'Listing Reserved'}
              </span>
              <span className="lock-timer">
                <Clock size={14} />
                Time remaining: <strong>{formatTimeRemaining()}</strong>
              </span>
            </div>
          </>
        )}
      </div>

      <div className="lock-actions">
        {!isExpired && onExtend && (
          <button
            className="extend-btn"
            onClick={onExtend}
            disabled={isExtending || timeRemaining > 180} // Only allow extend when less than 3 minutes
            title={timeRemaining > 180 ? 'You can extend when less than 3 minutes remain' : 'Extend reservation'}
          >
            <RefreshCw size={16} className={isExtending ? 'spinning' : ''} />
            {isExtending ? 'Extending...' : 'Extend'}
          </button>
        )}
        {onCancel && (
          <button className="cancel-btn" onClick={onCancel}>
            Cancel Reservation
          </button>
        )}
      </div>
    </div>
  );
};

export default BookingLockIndicator;

