import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { DollarSign, Calendar, CreditCard, Banknote, CheckCircle, Clock, XCircle } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import Loader from '../../components/Loader';
import '../../styles/MyPayments.scss';

const MyPayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // ALL, UNPAID, PAID
  const user = useSelector((state) => state.user);

  useEffect(() => {
    if (user?.id) {
      fetchPayments();
    }
  }, [user?.id]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:3001/room-rental-advanced/payments/tenant/${user.id || user._id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch payments');

      const data = await response.json();
      setPayments(data.payments || []);
    } catch (error) {
      console.error('❌ Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayOnline = async (paymentId) => {
    try {
      const payment = payments.find((p) => p._id === paymentId);

      // Redirect to VNPay payment
      const response = await fetch('http://localhost:3001/payment/create-payment-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          amount: payment.amount,
          paymentType: 'room_rental',
          paymentId: paymentId,
          returnUrl: `${window.location.origin}/room-rental/payment-result`,
        }),
      });

      if (!response.ok) throw new Error('Failed to create payment URL');

      const data = await response.json();

      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      }
    } catch (error) {
      console.error('❌ Error creating payment:', error);
      alert('Failed to create payment. Please try again.');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  const getPaymentTypeLabel = (type) => {
    return type === 'DEPOSIT' ? 'Deposit' : 'Monthly Rent';
  };

  const getPaymentIcon = (type) => {
    return type === 'DEPOSIT' ? <DollarSign size={20} /> : <Calendar size={20} />;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PAID':
        return <CheckCircle className="status-icon paid" />;
      case 'UNPAID':
        return <Clock className="status-icon unpaid" />;
      case 'PARTIALLY_PAID':
        return <Clock className="status-icon partial" />;
      default:
        return null;
    }
  };

  const isOverdue = (dueDate, status) => {
    if (status === 'PAID') return false;
    return new Date(dueDate) < new Date();
  };

  const filteredPayments = payments.filter((payment) => {
    if (filter === 'ALL') return true;
    return payment.status === filter;
  });

  if (loading) return <Loader />;

  return (
    <>
      <Navbar />
      <div className="my-payments">
      <div className="payments-header">
        <DollarSign size={36} />
        <h1>My Payments</h1>
        <p>Track and manage your rental payments</p>
      </div>

      <div className="filter-tabs">
        <button
          className={filter === 'ALL' ? 'active' : ''}
          onClick={() => setFilter('ALL')}
        >
          All ({payments.length})
        </button>
        <button
          className={filter === 'UNPAID' ? 'active' : ''}
          onClick={() => setFilter('UNPAID')}
        >
          Unpaid ({payments.filter((p) => p.status === 'UNPAID').length})
        </button>
        <button
          className={filter === 'PAID' ? 'active' : ''}
          onClick={() => setFilter('PAID')}
        >
          Paid ({payments.filter((p) => p.status === 'PAID').length})
        </button>
      </div>

      {filteredPayments.length === 0 ? (
        <div className="no-payments">
          <DollarSign size={64} />
          <h3>No payments found</h3>
          <p>Your payment history will appear here</p>
        </div>
      ) : (
        <div className="payments-list">
          {filteredPayments.map((payment) => (
            <div
              key={payment._id}
              className={`payment-card ${
                isOverdue(payment.dueDate, payment.status) ? 'overdue' : ''
              }`}
            >
              <div className="payment-header">
                <div className="payment-type">
                  {getPaymentIcon(payment.paymentType)}
                  <div>
                    <h3>{getPaymentTypeLabel(payment.paymentType)}</h3>
                    <p className="room-name">
                      {payment.agreementId?.roomId?.title || 'Room'}
                    </p>
                  </div>
                </div>
                <div className={`status-badge ${payment.status.toLowerCase()}`}>
                  {getStatusIcon(payment.status)}
                  <span>{payment.status}</span>
                </div>
              </div>

              <div className="payment-details">
                <div className="detail-item">
                  <span className="label">Amount:</span>
                  <span className="value amount">
                    {formatCurrency(payment.amount)} VND
                  </span>
                </div>

                {payment.dueDate && (
                  <div className="detail-item">
                    <span className="label">Due Date:</span>
                    <span className={`value ${
                      isOverdue(payment.dueDate, payment.status) ? 'overdue-text' : ''
                    }`}>
                      {new Date(payment.dueDate).toLocaleDateString()}
                      {isOverdue(payment.dueDate, payment.status) && ' (OVERDUE)'}
                    </span>
                  </div>
                )}

                <div className="detail-item">
                  <span className="label">Method:</span>
                  <span className="value">
                    {payment.method === 'ONLINE' ? (
                      <span className="method online">
                        <CreditCard size={16} /> Online
                      </span>
                    ) : (
                      <span className="method cash">
                        <Banknote size={16} /> Cash
                      </span>
                    )}
                  </span>
                </div>

                {payment.paidAt && (
                  <div className="detail-item">
                    <span className="label">Paid On:</span>
                    <span className="value">
                      {new Date(payment.paidAt).toLocaleDateString()}
                    </span>
                  </div>
                )}

                {payment.notes && (
                  <div className="payment-notes">
                    <span className="label">Notes:</span>
                    <p>{payment.notes}</p>
                  </div>
                )}
              </div>

              {payment.status === 'UNPAID' && (
                <div className="payment-actions">
                  <button
                    className="pay-online-btn"
                    onClick={() => handlePayOnline(payment._id)}
                  >
                    <CreditCard size={18} />
                    Pay Online (VNPay)
                  </button>
                  <p className="cash-note">
                    <Banknote size={16} />
                    Or pay in cash and ask your host to confirm
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="payment-summary">
        <h3>Summary</h3>
        <div className="summary-grid">
          <div className="summary-card">
            <div className="summary-icon total">
              <DollarSign size={24} />
            </div>
            <div className="summary-info">
              <span className="summary-label">Total Paid</span>
              <span className="summary-value">
                {formatCurrency(
                  payments
                    .filter((p) => p.status === 'PAID')
                    .reduce((sum, p) => sum + p.amount, 0)
                )}{' '}
                VND
              </span>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-icon unpaid">
              <Clock size={24} />
            </div>
            <div className="summary-info">
              <span className="summary-label">Pending</span>
              <span className="summary-value">
                {formatCurrency(
                  payments
                    .filter((p) => p.status === 'UNPAID')
                    .reduce((sum, p) => sum + p.amount, 0)
                )}{' '}
                VND
              </span>
            </div>
          </div>
        </div>
      </div>
      </div>
      <Footer />
    </>
  );
};

export default MyPayments;

