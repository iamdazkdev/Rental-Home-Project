import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { DollarSign, Calendar, CheckCircle, Clock, AlertCircle, Eye, CreditCard } from "lucide-react";
import Navbar from "../../components/Navbar";
import "../../styles/HostPayments.scss";

const HostPayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selectedPayment, setSelectedPayment] = useState(null);
  const user = useSelector((state) => state.user);

  useEffect(() => {
    fetchPayments();
  }, [user]);

  const fetchPayments = async () => {
    try {
      const response = await fetch(
        `http://localhost:3001/room-rental/payments/host/${user._id}`
      );
      const data = await response.json();
      if (data.success) {
        setPayments(data.payments);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching payments:", error);
      setLoading(false);
    }
  };

  const handleConfirmPayment = async (paymentId) => {
    if (!window.confirm("Confirm that you have received this cash payment?")) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:3001/room-rental/payments/${paymentId}/confirm`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        alert("Payment confirmed successfully!");
        fetchPayments();
      }
    } catch (error) {
      console.error("Error confirming payment:", error);
      alert("Failed to confirm payment");
    }
  };

  const filteredPayments = payments.filter((payment) => {
    if (filter === "all") return true;
    if (filter === "paid") return payment.status === "PAID";
    if (filter === "unpaid") return payment.status === "UNPAID";
    if (filter === "deposit") return payment.paymentType === "DEPOSIT";
    if (filter === "monthly") return payment.paymentType === "MONTHLY";
    return true;
  });

  const calculateStats = () => {
    const totalReceived = payments
      .filter((p) => p.status === "PAID")
      .reduce((sum, p) => sum + p.amount, 0);

    const pendingAmount = payments
      .filter((p) => p.status === "UNPAID")
      .reduce((sum, p) => sum + p.amount, 0);

    return { totalReceived, pendingAmount };
  };

  const stats = calculateStats();

  const getStatusBadge = (status) => {
    const statusConfig = {
      PAID: { color: "#28a745", label: "Paid" },
      UNPAID: { color: "#ffc107", label: "Unpaid" },
      PARTIALLY_PAID: { color: "#ff9800", label: "Partially Paid" },
    };
    const config = statusConfig[status] || statusConfig.UNPAID;
    return (
      <span className="status-badge" style={{ backgroundColor: config.color }}>
        {config.label}
      </span>
    );
  };

  const getPaymentTypeBadge = (type) => {
    const typeConfig = {
      DEPOSIT: { color: "#6f42c1", label: "Deposit" },
      MONTHLY: { color: "#007bff", label: "Monthly Rent" },
    };
    const config = typeConfig[type] || typeConfig.MONTHLY;
    return (
      <span className="type-badge" style={{ backgroundColor: config.color }}>
        {config.label}
      </span>
    );
  };

  const getMethodBadge = (method) => {
    const methodConfig = {
      ONLINE: { icon: <CreditCard size={14} />, label: "Online", color: "#17a2b8" },
      CASH: { icon: <DollarSign size={14} />, label: "Cash", color: "#6c757d" },
    };
    const config = methodConfig[method] || methodConfig.CASH;
    return (
      <span className="method-badge" style={{ backgroundColor: config.color }}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="host-payments">
          <div className="loading">Loading payments...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="host-payments">
        <div className="payments-header">
          <DollarSign size={48} />
          <h1>Payment Management</h1>
          <p>Track and manage rental payments from your tenants</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card received">
            <div className="stat-icon">
              <CheckCircle size={32} />
            </div>
            <div className="stat-content">
              <h3>Total Received</h3>
              <p className="stat-value">{formatCurrency(stats.totalReceived)}</p>
              <span className="stat-label">All time earnings</span>
            </div>
          </div>

          <div className="stat-card pending">
            <div className="stat-icon">
              <Clock size={32} />
            </div>
            <div className="stat-content">
              <h3>Pending Amount</h3>
              <p className="stat-value">{formatCurrency(stats.pendingAmount)}</p>
              <span className="stat-label">Awaiting payment</span>
            </div>
          </div>

          <div className="stat-card total">
            <div className="stat-icon">
              <DollarSign size={32} />
            </div>
            <div className="stat-content">
              <h3>Total Payments</h3>
              <p className="stat-value">{payments.length}</p>
              <span className="stat-label">All transactions</span>
            </div>
          </div>
        </div>

        <div className="filter-tabs">
          <button
            className={filter === "all" ? "active" : ""}
            onClick={() => setFilter("all")}
          >
            All ({payments.length})
          </button>
          <button
            className={filter === "paid" ? "active" : ""}
            onClick={() => setFilter("paid")}
          >
            Paid ({payments.filter((p) => p.status === "PAID").length})
          </button>
          <button
            className={filter === "unpaid" ? "active" : ""}
            onClick={() => setFilter("unpaid")}
          >
            Unpaid ({payments.filter((p) => p.status === "UNPAID").length})
          </button>
          <button
            className={filter === "deposit" ? "active" : ""}
            onClick={() => setFilter("deposit")}
          >
            Deposits ({payments.filter((p) => p.paymentType === "DEPOSIT").length})
          </button>
          <button
            className={filter === "monthly" ? "active" : ""}
            onClick={() => setFilter("monthly")}
          >
            Monthly ({payments.filter((p) => p.paymentType === "MONTHLY").length})
          </button>
        </div>

        {filteredPayments.length === 0 ? (
          <div className="no-payments">
            <DollarSign size={64} />
            <h3>No Payments Found</h3>
            <p>You don't have any payments in this category yet.</p>
          </div>
        ) : (
          <div className="payments-list">
            {filteredPayments.map((payment) => (
              <div key={payment._id} className="payment-card">
                <div className="payment-header">
                  <div className="payment-info">
                    <div className="badges">
                      {getPaymentTypeBadge(payment.paymentType)}
                      {getMethodBadge(payment.method)}
                    </div>
                    <h3>{formatCurrency(payment.amount)}</h3>
                  </div>
                  {getStatusBadge(payment.status)}
                </div>

                <div className="payment-details">
                  <div className="detail-row">
                    <Calendar size={16} />
                    <span>
                      {payment.status === "PAID"
                        ? `Paid on: ${formatDate(payment.paidAt)}`
                        : `Due: ${formatDate(payment.dueDate)}`}
                    </span>
                  </div>

                  {payment.agreementId?.tenantId && (
                    <div className="detail-row tenant">
                      <div className="tenant-avatar">
                        {payment.agreementId.tenantId.profileImagePath ? (
                          <img
                            src={payment.agreementId.tenantId.profileImagePath}
                            alt="Tenant"
                          />
                        ) : (
                          <div className="avatar-placeholder">
                            {payment.agreementId.tenantId.firstName?.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="tenant-info">
                        <strong>
                          {payment.agreementId.tenantId.firstName}{" "}
                          {payment.agreementId.tenantId.lastName}
                        </strong>
                        <span>{payment.agreementId.roomId?.title || "Room"}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="payment-actions">
                  <button
                    className="view-btn"
                    onClick={() => setSelectedPayment(payment)}
                  >
                    <Eye size={16} />
                    View Details
                  </button>

                  {payment.status === "UNPAID" && payment.method === "CASH" && (
                    <button
                      className="confirm-btn"
                      onClick={() => handleConfirmPayment(payment._id)}
                    >
                      <CheckCircle size={16} />
                      Confirm Cash Payment
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedPayment && (
          <div className="payment-modal" onClick={() => setSelectedPayment(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Payment Details</h2>
                <button
                  className="close-btn"
                  onClick={() => setSelectedPayment(null)}
                >
                  ×
                </button>
              </div>

              <div className="modal-body">
                <div className="payment-section">
                  <h3>Payment Information</h3>
                  <div className="info-grid">
                    <div>
                      <strong>Amount:</strong>
                      <p>{formatCurrency(selectedPayment.amount)}</p>
                    </div>
                    <div>
                      <strong>Type:</strong>
                      <p>{selectedPayment.paymentType}</p>
                    </div>
                    <div>
                      <strong>Method:</strong>
                      <p>{selectedPayment.method}</p>
                    </div>
                    <div>
                      <strong>Status:</strong>
                      <p>{selectedPayment.status}</p>
                    </div>
                  </div>
                </div>

                <div className="payment-section">
                  <h3>Dates</h3>
                  <div className="info-grid">
                    <div>
                      <strong>Due Date:</strong>
                      <p>{formatDate(selectedPayment.dueDate)}</p>
                    </div>
                    {selectedPayment.paidAt && (
                      <div>
                        <strong>Paid At:</strong>
                        <p>{formatDate(selectedPayment.paidAt)}</p>
                      </div>
                    )}
                  </div>
                </div>

                {selectedPayment.agreementId && (
                  <div className="payment-section">
                    <h3>Rental Details</h3>
                    <div className="info-grid">
                      <div>
                        <strong>Tenant:</strong>
                        <p>
                          {selectedPayment.agreementId.tenantId?.firstName}{" "}
                          {selectedPayment.agreementId.tenantId?.lastName}
                        </p>
                      </div>
                      <div>
                        <strong>Property:</strong>
                        <p>{selectedPayment.agreementId.roomId?.title || "N/A"}</p>
                      </div>
                      <div>
                        <strong>Monthly Rent:</strong>
                        <p>{formatCurrency(selectedPayment.agreementId.rentAmount)}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default HostPayments;

