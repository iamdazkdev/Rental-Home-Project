import React, { useState } from 'react';
import { API_ENDPOINTS, HTTP_METHODS } from '../constants/api';
import { DEFAULT_HEADERS } from '../constants';
import '../styles/PaymentButton.scss';

const PaymentButton = ({ bookingId, amount, disabled, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handlePayment = async () => {
    try {
      setLoading(true);
      setError(null);

      // Create payment URL
      const response = await fetch(API_ENDPOINTS.PAYMENT.CREATE_URL, {
        method: HTTP_METHODS.POST,
        headers: DEFAULT_HEADERS,
        body: JSON.stringify({
          bookingId,
          ipAddr: '127.0.0.1', // In production, get real IP
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment URL');
      }

      const data = await response.json();
      console.log('✅ Payment URL created:', data);

      // Redirect to VNPay
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        throw new Error('No payment URL returned');
      }
    } catch (err) {
      console.error('❌ Payment error:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="payment-button-wrapper">
      <button
        className="payment-btn"
        onClick={handlePayment}
        disabled={disabled || loading}
      >
        {loading ? (
          <>
            <span className="spinner"></span>
            Đang xử lý...
          </>
        ) : (
          <>
            💳 Thanh toán {amount && `- ${amount.toLocaleString('vi-VN')} VND`}
          </>
        )}
      </button>
      {error && <div className="payment-error">{error}</div>}
    </div>
  );
};

export default PaymentButton;

