import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/BookingSuccessModal.scss';
import { CheckCircle, CalendarToday, Home, CreditCard, X } from '@mui/icons-material';

const BookingSuccessModal = ({ isOpen, onClose, bookingData, paymentMethod, userId }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleViewTrips = () => {
    navigate(`/${userId}/trips`);
    onClose();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('vi-VN', {
        weekday: 'short',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return 'N/A';
    }
  };

  const formatVND = (amount) => {
    if (!amount && amount !== 0) return '0 VND';
    const rounded = Math.round(amount);
    const formatted = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${formatted} VND`;
  };

  const getPaymentMethodText = () => {
    switch(paymentMethod) {
      case 'cash':
        return 'Cash Payment on Check-in';
      case 'vnpay_full':
        return 'Full Payment via VNPay';
      case 'vnpay_deposit':
        return '50% Deposit via VNPay';
      default:
        return paymentMethod;
    }
  };

  return (
    <div className="booking-success-modal-overlay" onClick={onClose}>
      <div className="booking-success-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>
          <X />
        </button>

        {/* Success Icon */}
        <div className="success-icon">
          <CheckCircle sx={{ fontSize: 80 }} />
        </div>

        {/* Success Message */}
        <h1 className="success-title">Booking Request Sent!</h1>
        <p className="success-subtitle">
          Your booking request has been submitted successfully.
          {paymentMethod === 'cash' && ' Please pay in cash when you check in.'}
        </p>

        {/* Booking Details */}
        <div className="booking-details-card">
          <div className="detail-item">
            <Home className="detail-icon" />
            <div className="detail-content">
              <span className="detail-label">Property</span>
              <span className="detail-value">{bookingData.listing?.title || 'Property'}</span>
            </div>
          </div>

          <div className="detail-item">
            <CalendarToday className="detail-icon" />
            <div className="detail-content">
              <span className="detail-label">Check-in - Check-out</span>
              <span className="detail-value">
                {formatDate(bookingData.startDate)} - {formatDate(bookingData.endDate)}
              </span>
            </div>
          </div>

          <div className="detail-item">
            <CalendarToday className="detail-icon" />
            <div className="detail-content">
              <span className="detail-label">Duration</span>
              <span className="detail-value">{bookingData.dayCount} night{bookingData.dayCount > 1 ? 's' : ''}</span>
            </div>
          </div>

          <div className="detail-item">
            <CreditCard className="detail-icon" />
            <div className="detail-content">
              <span className="detail-label">Payment Method</span>
              <span className="detail-value">{getPaymentMethodText()}</span>
            </div>
          </div>

          <div className="total-price">
            <span>Total Amount</span>
            <span className="price">{formatVND(bookingData.totalPrice)}</span>
          </div>
        </div>

        {/* Next Steps */}
        {paymentMethod === 'cash' && (
          <div className="next-steps">
            <h3>📝 Next Steps</h3>
            <ul>
              <li>Wait for the host to accept your booking request</li>
              <li>You'll receive a notification once it's confirmed</li>
              <li>Prepare cash payment for check-in</li>
              <li>Bring a valid ID for verification</li>
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div className="action-buttons">
          <button className="btn-secondary" onClick={onClose}>
            Continue Browsing
          </button>
          <button className="btn-primary" onClick={handleViewTrips}>
            View My Trips
          </button>
        </div>

        {/* Confirmation Note */}
        <p className="confirmation-note">
          ℹ️ This is a booking request. The host will review and confirm within 24 hours.
        </p>
      </div>
    </div>
  );
};

export default BookingSuccessModal;

