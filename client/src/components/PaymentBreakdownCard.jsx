import React, { useState } from 'react';
import { AttachMoney, Warning, CheckCircle } from '@mui/icons-material';
import PaymentHistory from './PaymentHistory';
import '../styles/PaymentBreakdownCard.scss';

const PaymentBreakdownCard = ({ booking }) => {
  const [showHistory, setShowHistory] = useState(false);

  if (!booking) return null;

  // Debug log to see what data we're receiving
  console.log('💳 PaymentBreakdownCard - Booking data:', {
    totalPrice: booking.totalPrice,
    finalTotalPrice: booking.finalTotalPrice,
    paymentMethod: booking.paymentMethod,
    paymentType: booking.paymentType,
    paymentStatus: booking.paymentStatus,
    depositAmount: booking.depositAmount,
    depositPercentage: booking.depositPercentage,
    remainingAmount: booking.remainingAmount,
  });

  const {
    totalPrice,
    finalTotalPrice,
    paymentStatus,
    paymentMethod,
    paymentType,
    depositAmount,
    depositPercentage,
    remainingAmount,
    remainingDueDate,
    paymentHistory = [],
    confirmPaymentMethod, // NEW: Track confirmed payment method
  } = booking;

  const formatAmount = (amount) => {
    if (!amount && amount !== 0) return '0';
    return amount?.toLocaleString('vi-VN') || '0';
  };

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('vi-VN');
  };

  const getPaymentMethodLabel = () => {
    console.log('🔍 Getting payment method label:', { paymentMethod, paymentType });

    if (paymentMethod === 'vnpay') {
      if (paymentType === 'full') {
        return 'VNPay - Full Payment (100%)';
      } else if (paymentType === 'deposit') {
        return `VNPay - Deposit (${depositPercentage || 30}%)`;
      }
      return 'VNPay';
    } else if (paymentMethod === 'cash') {
      return 'Cash Payment at Check-in';
    }

    // Fallback for undefined or unknown payment method
    console.warn('⚠️ Unknown payment method:', paymentMethod, 'paymentType:', paymentType);
    return paymentMethod || 'Payment Method Not Set';
  };

  const getDisplayAmount = () => {
    // VNPay + Deposit: Show deposit amount
    if (paymentMethod === 'vnpay' && paymentType === 'deposit') {
      return depositAmount || (finalTotalPrice || totalPrice) * 0.3;
    }
    // VNPay + Full OR Cash: Show final total price
    return finalTotalPrice || totalPrice || 0;
  };

  const getTotalAmount = () => {
    const total = finalTotalPrice || totalPrice || 0;
    console.log('💰 Total Amount:', total, '(finalTotalPrice:', finalTotalPrice, 'totalPrice:', totalPrice, ')');
    return total;
  };

  const isPaidInFull = paymentStatus === 'paid';
  const isPartiallyPaid = paymentStatus === 'partially_paid';
  const isUnpaid = paymentStatus === 'unpaid';

  return (
    <div className="payment-breakdown-card">
      {/* Payment Status Header */}
      <div className={`payment-status-header ${paymentStatus}`}>
        {isPaidInFull && (
          <>
            <CheckCircle sx={{ fontSize: 20 }} />
            <span>PAID IN FULL</span>
          </>
        )}
        {isPartiallyPaid && (
          <>
            <Warning sx={{ fontSize: 20 }} />
            <span>PARTIALLY PAID</span>
          </>
        )}
        {isUnpaid && (
          <>
            <Warning sx={{ fontSize: 20 }} />
            <span>UNPAID</span>
          </>
        )}
      </div>

      {/* Payment Summary */}
      <div className="payment-summary">
        <div className="summary-row total">
          <span className="label">Total Booking:</span>
          <span className="value">{formatAmount(getTotalAmount())} VND</span>
        </div>

        {/* Show payment method and type info */}
        <div className="summary-row info">
          <span className="label">Payment:</span>
          <span className="value">{getPaymentMethodLabel()}</span>
        </div>

        {/* Full Payment */}
        {isPaidInFull && paymentMethod === 'vnpay' && paymentType === 'full' && (
          <div className="payment-detail success">
            <div className="detail-row">
              <CheckCircle sx={{ fontSize: 16 }} />
              <span>Paid via VNPay (100%)</span>
            </div>
            <div className="amount-row">
              <span className="amount">{formatAmount(getDisplayAmount())} VND</span>
            </div>
            <p className="success-message">✅ Nothing more to pay!</p>
          </div>
        )}

        {/* Deposit Payment */}
        {(isPartiallyPaid || (paymentMethod === 'vnpay' && paymentType === 'deposit')) && (
          <>
            <div className="payment-detail success">
              <div className="detail-row">
                <CheckCircle sx={{ fontSize: 16 }} />
                <span>Deposit Paid ({depositPercentage || 30}%)</span>
              </div>
              <div className="amount-row">
                <span className="amount">{formatAmount(depositAmount || getDisplayAmount())} VND</span>
                <span className="method">via VNPay</span>
              </div>
            </div>

            <div className="payment-detail warning">
              <div className="detail-row">
                <Warning sx={{ fontSize: 16 }} />
                <span>Remaining Balance</span>
              </div>
              <div className="amount-row">
                <span className="amount highlight">
                  {formatAmount(remainingAmount || (getTotalAmount() - (depositAmount || getDisplayAmount())))} VND
                </span>
                <span className="percentage">({100 - (depositPercentage || 30)}%)</span>
              </div>
              {remainingDueDate && (
                <p className="due-date">
                  Due at check-in: {formatDate(remainingDueDate)}
                </p>
              )}
              {/* Show confirmation status if guest confirmed payment method */}
              {confirmPaymentMethod === 'cash' && (
                <p className="success-message" style={{ color: '#4CAF50', marginTop: '8px' }}>
                  ✅ You confirmed to pay in cash at check-in
                </p>
              )}
              {!confirmPaymentMethod && (
                <p className="payment-methods">
                  <strong>Accepted:</strong> VNPay or Cash at Check-in
                </p>
              )}
            </div>
          </>
        )}

        {/* Unpaid (Cash) */}
        {(isUnpaid || paymentMethod === 'cash') && (
          <div className="payment-detail warning">
            <div className="detail-row">
              <Warning sx={{ fontSize: 16 }} />
              <span>Pay at Check-in</span>
            </div>
            <div className="amount-row">
              <span className="amount highlight">{formatAmount(getTotalAmount())} VND</span>
            </div>
            {remainingDueDate && (
              <p className="due-date">
                Payment due: {formatDate(remainingDueDate)}
              </p>
            )}
            <p className="payment-methods">
              <strong>Accepted:</strong> Cash, Bank Transfer
            </p>
          </div>
        )}
      </div>

      {/* Payment History Toggle */}
      {paymentHistory && paymentHistory.length > 0 && (
        <>
          <button
            className="view-history-btn"
            onClick={(e) => {
              e.stopPropagation(); // Prevent card click event
              setShowHistory(!showHistory);
            }}
          >
            <AttachMoney sx={{ fontSize: 16 }} />
            {showHistory ? 'Hide' : 'View'} Payment History ({paymentHistory.length})
          </button>

          {showHistory && (
            <div className="payment-history-section">
              <PaymentHistory
                paymentHistory={paymentHistory}
                totalAmount={totalPrice}
                remainingAmount={remainingAmount || 0}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PaymentBreakdownCard;

