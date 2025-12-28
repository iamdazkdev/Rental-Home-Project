import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import '../../styles/PaymentCallback.scss';

const PaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState('processing'); // processing, success, failed
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState('');

  const handlePaymentReturn = useCallback(async () => {
    try {
      const responseCode = searchParams.get('vnp_ResponseCode');
      const tempOrderId = searchParams.get('vnp_TxnRef');
      const transactionId = searchParams.get('vnp_TransactionNo');

      // Build payment data object from all vnp_ params
      const paymentData = {};
      for (const [key, value] of searchParams.entries()) {
        paymentData[key] = value;
      }

      console.log('Payment callback received:', {
        responseCode,
        tempOrderId,
        transactionId
      });

      if (responseCode !== '00') {
        setStatus('failed');
        setError('Payment was cancelled or failed');
        return;
      }

      // Create booking from payment
      const response = await fetch('http://localhost:3001/entire-place-booking/create-from-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          tempOrderId,
          transactionId,
          paymentData
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create booking');
      }

      const bookingData = await response.json();
      setBooking(bookingData);
      setStatus('success');

      // Redirect to confirmation page after 2 seconds
      setTimeout(() => {
        navigate('/booking/confirmation', {
          state: {
            booking: bookingData,
            paymentMethod: bookingData.paymentMethod
          }
        });
      }, 2000);

    } catch (error) {
      console.error('Error processing payment callback:', error);
      setStatus('failed');
      setError(error.message || 'Failed to process payment');
    }
  }, [searchParams, navigate]);

  useEffect(() => {
    handlePaymentReturn();
  }, [handlePaymentReturn]);

  return (
    <div className="payment-callback">
      <div className="callback-container">
        {status === 'processing' && (
          <div className="status processing">
            <Loader className="spin" size={64} />
            <h2>Processing your payment...</h2>
            <p>Please wait while we confirm your booking</p>
          </div>
        )}

        {status === 'success' && booking && (
          <div className="status success">
            <CheckCircle size={64} />
            <h2>Payment Successful!</h2>
            <p>Your booking request has been sent to the host</p>

            {/* v2.0: Show both statuses */}
            <div className="booking-status-info">
              <div className="status-item">
                <strong>Booking Status:</strong>
                <span className={`status-badge ${booking.bookingStatus || booking.status}`}>
                  {(booking.bookingStatus || booking.status || 'pending').toUpperCase()}
                </span>
              </div>
              <div className="status-item">
                <strong>Payment Status:</strong>
                <span className={`status-badge ${booking.paymentStatus}`}>
                  {(booking.paymentStatus || 'unknown').toUpperCase()}
                </span>
              </div>

              {booking.paymentStatus === 'partially_paid' && (
                <div className="payment-notice">
                  <p>✅ Deposit paid: {booking.depositAmount?.toLocaleString('vi-VN')} VND</p>
                  <p>⏳ Remaining: {booking.remainingAmount?.toLocaleString('vi-VN')} VND (cash at check-in)</p>
                </div>
              )}

              {booking.paymentStatus === 'paid' && (
                <div className="payment-notice">
                  <p>✅ Full payment: {booking.totalPrice?.toLocaleString('vi-VN')} VND</p>
                </div>
              )}
            </div>

            <p className="redirect-notice">Redirecting to confirmation page...</p>
          </div>
        )}

        {status === 'failed' && (
          <div className="status failed">
            <XCircle size={64} />
            <h2>Payment Failed</h2>
            <p>{error}</p>
            <button onClick={() => navigate('/')}>
              Return to Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentCallback;

