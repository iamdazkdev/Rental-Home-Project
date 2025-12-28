import React from 'react';
import {
  CheckCircle,
  AccessTime,
  Cancel,
  AttachMoney
} from '@mui/icons-material';
import '../styles/PaymentHistory.scss';

const PaymentHistory = ({ paymentHistory = [], totalAmount, remainingAmount }) => {
  if (!paymentHistory || paymentHistory.length === 0) {
    return null;
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="status-icon success" />;
      case 'pending':
        return <AccessTime className="status-icon pending" />;
      case 'failed':
      case 'refunded':
        return <Cancel className="status-icon error" />;
      default:
        return <AttachMoney className="status-icon" />;
    }
  };

  const getPaymentTypeLabel = (type) => {
    switch (type) {
      case 'deposit':
        return 'Deposit Payment';
      case 'full':
        return 'Full Payment';
      case 'remaining':
        return 'Remaining Payment';
      case 'partial':
        return 'Partial Payment';
      default:
        return 'Payment';
    }
  };

  const getMethodLabel = (method) => {
    switch (method) {
      case 'vnpay':
        return 'VNPay';
      case 'cash':
        return 'Cash';
      case 'bank_transfer':
        return 'Bank Transfer';
      default:
        return method;
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatAmount = (amount) => {
    return amount.toLocaleString('vi-VN');
  };

  const totalPaid = paymentHistory
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="payment-history">
      <h3 className="payment-history-title">
        <AttachMoney sx={{ fontSize: 20 }} />
        Payment History
      </h3>

      {/* Summary */}
      <div className="payment-summary">
        <div className="summary-row">
          <span className="summary-label">Total Amount:</span>
          <span className="summary-value">{formatAmount(totalAmount)} VND</span>
        </div>
        <div className="summary-row">
          <span className="summary-label">Total Paid:</span>
          <span className="summary-value success">{formatAmount(totalPaid)} VND</span>
        </div>
        {remainingAmount > 0 && (
          <div className="summary-row highlight">
            <span className="summary-label">Remaining Balance:</span>
            <span className="summary-value warning">{formatAmount(remainingAmount)} VND</span>
          </div>
        )}
      </div>

      {/* Payment Timeline */}
      <div className="payment-timeline">
        {paymentHistory.map((payment, index) => (
          <div key={index} className={`payment-item ${payment.status}`}>
            <div className="payment-header">
              <div className="payment-type">
                {getStatusIcon(payment.status)}
                <span className="type-label">{getPaymentTypeLabel(payment.type)}</span>
              </div>
              <div className="payment-amount">
                {formatAmount(payment.amount)} VND
              </div>
            </div>

            <div className="payment-details">
              <div className="detail-row">
                <span className="detail-label">Method:</span>
                <span className="detail-value">{getMethodLabel(payment.method)}</span>
              </div>

              {payment.transactionId && (
                <div className="detail-row">
                  <span className="detail-label">Transaction ID:</span>
                  <span className="detail-value transaction-id">
                    {payment.transactionId}
                  </span>
                </div>
              )}

              <div className="detail-row">
                <span className="detail-label">Date:</span>
                <span className="detail-value">{formatDate(payment.paidAt)}</span>
              </div>

              {payment.notes && (
                <div className="detail-row">
                  <span className="detail-label">Notes:</span>
                  <span className="detail-value notes">{payment.notes}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PaymentHistory;

