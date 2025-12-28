import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { API_ENDPOINTS, HTTP_METHODS } from '../constants/api';
import Loader from '../components/Loader';
import '../styles/PaymentResult.scss';

const PaymentResultPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status] = useState(searchParams.get('status'));
  const [bookingId] = useState(searchParams.get('bookingId'));
  const [transactionNo] = useState(searchParams.get('transactionNo'));
  const [message] = useState(searchParams.get('message'));
  const [paymentStatus] = useState(searchParams.get('paymentStatus'));
  const [loading, setLoading] = useState(true);
  const [bookingDetails, setBookingDetails] = useState(null);

  const fetchBookingDetails = useCallback(async () => {
    try {
      const response = await fetch(
        API_ENDPOINTS.PAYMENT.STATUS(bookingId),
        { method: HTTP_METHODS.GET }
      );

      if (response.ok) {
        const data = await response.json();
        setBookingDetails(data);
      }
    } catch (error) {
      console.error('Failed to fetch booking details:', error);
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    window.scrollTo(0, 0);

    // Fetch booking details if successful payment
    if (status === 'success' && bookingId) {
      fetchBookingDetails();
    } else {
      setLoading(false);
    }
  }, [status, bookingId, fetchBookingDetails]);

  const handleNavigateToTrips = () => {
    navigate('/trips');
  };

  const handleNavigateToHome = () => {
    navigate('/');
  };

  // Format date from ISO string or Date object
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return 'N/A';
    }
  };

  // Format datetime with time
  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return 'N/A';
    }
  };

  // Format VND currency (Vietnamese format: 8.000.000)
  const formatVND = (amount) => {
    if (!amount && amount !== 0) return 'N/A';
    const rounded = Math.round(amount);
    const formatted = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${formatted} VND`;
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="payment-result-page">
      <div className="result-container">
        {status === 'success' ? (
          <div className="result-content success">
            <div className="icon-wrapper">
              <div className="success-icon">✓</div>
            </div>
            <h1>Payment Successful!</h1>
            <p className="message">
              {paymentStatus === 'partially_paid'
                ? 'You have successfully paid the deposit! Please pay the remaining amount upon check-in.'
                : 'Your booking has been confirmed and payment completed successfully.'}
            </p>

            {bookingDetails && (
              <div className="booking-summary">
                <h3>Booking Details</h3>
                <div className="detail-item">
                  <span className="label">Property Name:</span>
                  <span className="value">{bookingDetails.listing?.title || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Check-in:</span>
                  <span className="value">{formatDate(bookingDetails.startDate)}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Check-out:</span>
                  <span className="value">{formatDate(bookingDetails.endDate)}</span>
                </div>
                {bookingDetails.paymentMethod === 'vnpay_deposit' && (
                  <>
                    <div className="detail-item">
                      <span className="label">Paid (Deposit {bookingDetails.depositPercentage}%):</span>
                      <span className="value paid">{formatVND(bookingDetails.depositAmount)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Remaining (Pay at check-in):</span>
                      <span className="value pending">{formatVND(bookingDetails.totalPrice - bookingDetails.depositAmount)}</span>
                    </div>
                  </>
                )}
                <div className="detail-item total">
                  <span className="label">Total Amount:</span>
                  <span className="value">{formatVND(bookingDetails.totalPrice)}</span>
                </div>
              </div>
            )}

            <div className="details">
              <div className="detail-item">
                <span className="label">Booking ID:</span>
                <span className="value">{bookingId}</span>
              </div>
              {transactionNo && (
                <div className="detail-item">
                  <span className="label">VNPay Transaction ID:</span>
                  <span className="value">{transactionNo}</span>
                </div>
              )}
              {bookingDetails?.paidAt && (
                <div className="detail-item">
                  <span className="label">Payment Time:</span>
                  <span className="value">{formatDateTime(bookingDetails.paidAt)}</span>
                </div>
              )}
            </div>

            <div className="actions">
              <button className="btn btn-primary" onClick={handleNavigateToTrips}>
                View My Trips
              </button>
              <button className="btn btn-secondary" onClick={handleNavigateToHome}>
                Go to Home
              </button>
            </div>
          </div>
        ) : status === 'failed' ? (
          <div className="result-content failed">
            <div className="icon-wrapper">
              <div className="failed-icon">✕</div>
            </div>
            <h1>Payment Failed</h1>
            <p className="message">
              {message || 'Your transaction was unsuccessful. Please try again.'}
            </p>
            <div className="payment-tips">
              <h4>Common reasons for payment failure:</h4>
              <ul>
                <li>Insufficient account balance</li>
                <li>Card/Account not registered for Internet Banking</li>
                <li>Incorrect OTP code</li>
                <li>Transaction cancelled</li>
              </ul>
            </div>
            <div className="actions">
              <button className="btn btn-primary" onClick={() => navigate(-1)}>
                Try Again
              </button>
              <button className="btn btn-secondary" onClick={handleNavigateToHome}>
                Go to Home
              </button>
            </div>
          </div>
        ) : (
          <div className="result-content error">
            <div className="icon-wrapper">
              <div className="error-icon">⚠</div>
            </div>
            <h1>An Error Occurred</h1>
            <p className="message">
              {message || 'An error occurred during processing. Please contact support.'}
            </p>
            <div className="actions">
              <button className="btn btn-primary" onClick={handleNavigateToHome}>
                Go to Home
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentResultPage;

