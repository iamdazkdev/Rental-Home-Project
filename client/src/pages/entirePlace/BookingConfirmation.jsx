import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, Calendar, MapPin, Users, CreditCard } from 'lucide-react';
import '../../styles/BookingConfirmation.scss';

const BookingConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { booking, paymentMethod } = location.state || {};

  if (!booking) {
    navigate('/');
    return null;
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getPaymentMethodLabel = () => {
    switch (paymentMethod) {
      case 'vnpay_full':
        return 'VNPay - Full Payment';
      case 'vnpay_deposit':
        return 'VNPay - Deposit (30%)';
      case 'cash':
        return 'Cash Payment';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="booking-confirmation">
      <div className="confirmation-container">
        <div className="success-header">
          <CheckCircle size={64} className="success-icon" />
          <h1>Booking Request Sent!</h1>
          <p>Your reservation request is awaiting host approval</p>
        </div>

        <div className="booking-summary">
          <div className="summary-section">
            <h2>Booking Details</h2>

            <div className="detail-row">
              <span className="label">Booking ID:</span>
              <span className="value">{booking._id}</span>
            </div>

            <div className="detail-row">
              <span className="label">Status:</span>
              <span className={`value status-${booking.status}`}>
                {booking.status === 'pending' ? 'Pending Host Approval' : booking.status}
              </span>
            </div>

            <div className="detail-row">
              <MapPin size={18} />
              <div>
                <strong>{booking.listingId?.title}</strong>
                <p>{booking.listingId?.city}, {booking.listingId?.country}</p>
              </div>
            </div>

            <div className="detail-row">
              <Calendar size={18} />
              <div>
                <strong>Check-in</strong>
                <p>{formatDate(booking.startDate)}</p>
              </div>
            </div>

            <div className="detail-row">
              <Calendar size={18} />
              <div>
                <strong>Check-out</strong>
                <p>{formatDate(booking.endDate)}</p>
              </div>
            </div>

            <div className="detail-row">
              <Users size={18} />
              <div>
                <strong>Guests</strong>
                <p>{booking.guestCount || 1} guest(s)</p>
              </div>
            </div>
          </div>

          <div className="summary-section">
            <h2>Payment Information</h2>

            <div className="detail-row">
              <CreditCard size={18} />
              <div>
                <strong>Payment Method</strong>
                <p>{getPaymentMethodLabel()}</p>
              </div>
            </div>

            <div className="detail-row">
              <span className="label">Total Amount:</span>
              <span className="value">{formatPrice(booking.totalPrice)} VND</span>
            </div>

            {booking.paymentStatus === 'paid' && (
              <div className="detail-row">
                <span className="label">Paid:</span>
                <span className="value success">{formatPrice(booking.totalPrice)} VND</span>
              </div>
            )}

            {booking.paymentStatus === 'partially_paid' && (
              <>
                <div className="detail-row">
                  <span className="label">Deposit Paid:</span>
                  <span className="value success">{formatPrice(booking.depositAmount)} VND</span>
                </div>
                <div className="detail-row">
                  <span className="label">Remaining:</span>
                  <span className="value warning">{formatPrice(booking.remainingAmount)} VND</span>
                </div>
                <p className="payment-note">
                  ⚠️ Pay remaining amount in cash at check-in
                </p>
              </>
            )}

            {booking.paymentStatus === 'unpaid' && (
              <div className="detail-row">
                <span className="label">Payment Due:</span>
                <span className="value warning">At Check-in (Cash)</span>
              </div>
            )}
          </div>

          <div className="summary-section">
            <h2>What Happens Next?</h2>

            <div className="timeline">
              <div className="timeline-item completed">
                <div className="timeline-marker">✓</div>
                <div className="timeline-content">
                  <strong>Booking Request Sent</strong>
                  <p>Your request has been sent to the host</p>
                </div>
              </div>

              <div className="timeline-item pending">
                <div className="timeline-marker">2</div>
                <div className="timeline-content">
                  <strong>Waiting for Host Approval</strong>
                  <p>Host has 24 hours to respond</p>
                </div>
              </div>

              <div className="timeline-item">
                <div className="timeline-marker">3</div>
                <div className="timeline-content">
                  <strong>Confirmation</strong>
                  <p>You'll receive an email when approved</p>
                </div>
              </div>

              <div className="timeline-item">
                <div className="timeline-marker">4</div>
                <div className="timeline-content">
                  <strong>Check-in</strong>
                  <p>{formatDate(booking.startDate)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="action-buttons">
          <button
            className="btn-primary"
            onClick={() => navigate(`/booking/${booking._id}`)}
          >
            View Booking Details
          </button>

          <button
            className="btn-secondary"
            onClick={() => navigate('/account/trips')}
          >
            Go to My Trips
          </button>

          <button
            className="btn-secondary"
            onClick={() => navigate('/')}
          >
            Back to Home
          </button>
        </div>

        <div className="confirmation-footer">
          <p>
            A confirmation email has been sent to {booking.customerId?.email}
          </p>
          <p>
            Questions? Contact the host via the messaging system
          </p>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmation;

