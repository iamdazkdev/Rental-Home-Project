import React, { useState } from 'react';
import { AttachMoney, Close } from '@mui/icons-material';
import '../styles/RecordPaymentModal.scss';

const RecordPaymentModal = ({ booking, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    amount: booking?.remainingAmount || 0,
    method: 'cash',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/booking/${booking._id}/record-payment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to record payment');
      }

      const data = await response.json();
      console.log('✅ Payment recorded:', data);

      if (onSuccess) {
        onSuccess(data.booking);
      }

      onClose();
    } catch (err) {
      console.error('❌ Error recording payment:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount) => {
    return amount.toLocaleString('vi-VN');
  };

  return (
    <div className="record-payment-modal-overlay">
      <div className="record-payment-modal">
        <div className="modal-header">
          <h2>
            <AttachMoney sx={{ fontSize: 24 }} />
            Record Payment Received
          </h2>
          <button className="close-button" onClick={onClose} disabled={loading}>
            <Close sx={{ fontSize: 20 }} />
          </button>
        </div>

        <div className="booking-info">
          <p><strong>Guest:</strong> {booking?.customerId?.firstName} {booking?.customerId?.lastName}</p>
          <p><strong>Total Remaining:</strong> <span className="highlight">{formatAmount(booking?.remainingAmount)} VND</span></p>
        </div>

        <form onSubmit={handleSubmit} className="payment-form">
          <div className="form-group">
            <label htmlFor="amount">
              Amount Received <span className="required">*</span>
            </label>
            <input
              type="number"
              id="amount"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
              min="0"
              max={booking?.remainingAmount}
              step="1000"
              required
              disabled={loading}
            />
            <small>Maximum: {formatAmount(booking?.remainingAmount)} VND</small>
          </div>

          <div className="form-group">
            <label htmlFor="method">
              Payment Method <span className="required">*</span>
            </label>
            <select
              id="method"
              value={formData.method}
              onChange={(e) => setFormData({ ...formData, method: e.target.value })}
              required
              disabled={loading}
            >
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="vnpay">VNPay</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="notes">Notes (Optional)</label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="E.g., Received at check-in, cash payment..."
              rows="3"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Recording...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecordPaymentModal;

