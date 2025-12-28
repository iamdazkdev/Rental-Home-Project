import React, { useState } from 'react';
import { AttachMoney, Warning, CheckCircle } from '@mui/icons-material';
import PaymentHistory from './PaymentHistory';
import '../styles/PaymentBreakdownCard.scss';

const PaymentBreakdownCard = ({ booking }) => {
  const [showHistory, setShowHistory] = useState(false);

  if (!booking) return null;

  const {
    totalPrice,
    paymentStatus,
    paymentMethod,
    depositAmount,
    depositPercentage,
    remainingAmount,
    remainingDueDate,
    paymentHistory = [],
  } = booking;

  const formatAmount = (amount) => {
    return amount?.toLocaleString('vi-VN') || '0';
  };

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('vi-VN');
  };

  const getPaymentMethodLabel = (method) => {
    switch (method) {
      case 'vnpay_full':
        return 'VNPay - Full Payment';
      case 'vnpay_deposit':
        return 'VNPay - Deposit';
      case 'cash':
        return 'Cash';
      default:
        return method;
    }
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
          <span className="label">Total Amount:</span>
          <span className="value">{formatAmount(totalPrice)} VND</span>
        </div>

        {/* Full Payment */}
        {isPaidInFull && (
          <div className="payment-detail success">
            <div className="detail-row">
              <CheckCircle sx={{ fontSize: 16 }} />
              <span>Paid via {getPaymentMethodLabel(paymentMethod)}</span>
            </div>
            <p className="success-message">✅ Nothing more to pay!</p>
          </div>
        )}

        {/* Deposit Payment */}
        {isPartiallyPaid && (
          <>
            <div className="payment-detail success">
              <div className="detail-row">
                <CheckCircle sx={{ fontSize: 16 }} />
                <span>Deposit Paid ({depositPercentage}%)</span>
              </div>
              <div className="amount-row">
                <span className="amount">{formatAmount(depositAmount)} VND</span>
                <span className="method">via VNPay</span>
              </div>
            </div>

            <div className="payment-detail warning">
              <div className="detail-row">
                <Warning sx={{ fontSize: 16 }} />
                <span>Remaining Balance</span>
              </div>
              <div className="amount-row">
                <span className="amount highlight">{formatAmount(remainingAmount)} VND</span>
                <span className="percentage">({100 - depositPercentage}%)</span>
              </div>
              {remainingDueDate && (
                <p className="due-date">
                  Due at check-in: {formatDate(remainingDueDate)}
                </p>
              )}
              <p className="payment-methods">
                <strong>Accepted:</strong> Cash, Bank Transfer
              </p>
            </div>
          </>
        )}

        {/* Unpaid (Cash) */}
        {isUnpaid && (
          <div className="payment-detail warning">
            <div className="detail-row">
              <Warning sx={{ fontSize: 16 }} />
              <span>Pay at Check-in</span>
            </div>
            <div className="amount-row">
              <span className="amount highlight">{formatAmount(totalPrice)} VND</span>
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
            onClick={() => setShowHistory(!showHistory)}
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

