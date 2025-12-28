import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import Loader from "../../components/Loader";
import CashPaymentConfirmModal from "../../components/CashPaymentConfirmModal";
import PaymentSuccessModal from "../../components/PaymentSuccessModal";
import { CONFIG, HTTP_METHODS } from "../../constants/api";
import "../../styles/PaymentReminder.scss";

const PaymentReminderPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const user = useSelector((state) => state.user);

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [showCashConfirmModal, setShowCashConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    fetchBookingDetails();
    // eslint-disable-next-line
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      const response = await fetch(
        `${CONFIG.API_BASE_URL}/payment-reminder/${bookingId}`,
        { method: HTTP_METHODS.GET }
      );

      if (response.ok) {
        const data = await response.json();
        setBooking(data.booking);
      } else {
        const error = await response.json();
        alert(error.message || "Failed to load booking details");
        navigate(`/${user?._id || user?.id}/trips`);
      }
    } catch (error) {
      console.error("Error fetching booking:", error);
      alert("Failed to load booking details");
      navigate(`/${user?._id || user?.id}/trips`);
    } finally {
      setLoading(false);
    }
  };

  const handlePayVNPay = async () => {
    if (!selectedMethod || selectedMethod !== "vnpay") {
      alert("Please select VNPay payment method");
      return;
    }

    try {
      setProcessing(true);

      const response = await fetch(
        `${CONFIG.API_BASE_URL}/payment-reminder/${bookingId}/pay-vnpay`,
        {
          method: HTTP_METHODS.POST,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ipAddr: "127.0.0.1" }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("💳 Redirecting to VNPay:", data.paymentUrl);
        window.location.href = data.paymentUrl;
      } else {
        const error = await response.json();
        alert(error.message || "Failed to create payment");
        setProcessing(false);
      }
    } catch (error) {
      console.error("Error creating VNPay payment:", error);
      alert("Failed to create payment");
      setProcessing(false);
    }
  };

  const handleConfirmCash = async () => {
    try {
      setProcessing(true);

      const response = await fetch(
        `${CONFIG.API_BASE_URL}/payment-reminder/${bookingId}/confirm-cash`,
        { method: HTTP_METHODS.POST }
      );

      if (response.ok) {
        setShowCashConfirmModal(false);
        setProcessing(false); // Reset processing state
        setShowSuccessModal(true);
      } else {
        const error = await response.json();
        alert(error.message || "Failed to confirm cash payment");
        setProcessing(false);
      }
    } catch (error) {
      console.error("Error confirming cash payment:", error);
      alert("Failed to confirm cash payment");
      setProcessing(false);
    }
  };

  const handleSubmit = () => {
    if (!selectedMethod) {
      alert("Please select a payment method");
      return;
    }

    if (selectedMethod === "vnpay") {
      handlePayVNPay();
    } else if (selectedMethod === "cash") {
      setShowCashConfirmModal(true);
    }
  };

  const getDaysUntilCheckIn = () => {
    if (!booking) return 0;
    const now = new Date();
    const checkIn = new Date(booking.startDate);
    const diff = checkIn - now;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  if (loading) return <Loader />;

  if (!booking) return null;

  const daysLeft = getDaysUntilCheckIn();

  return (
    <>
      <Navbar />
      <div className="payment-reminder-page">
        <div className="container">
          {/* Header */}
          <div className="page-header">
            <h1>⏰ Payment Reminder</h1>
            <p className="subtitle">
              Your check-in is in <strong>{daysLeft} day{daysLeft !== 1 ? 's' : ''}</strong>
            </p>
          </div>

          {/* Booking Summary */}
          <div className="booking-summary-card">
            <div className="listing-info">
              <img
                src={booking.listingId.listingPhotoPaths?.[0]}
                alt={booking.listingId.title}
                className="listing-image"
              />
              <div className="listing-details">
                <h2>{booking.listingId.title}</h2>
                <p className="location">
                  📍 {booking.listingId.city}, {booking.listingId.province}
                </p>
                <p className="dates">
                  📅 {new Date(booking.startDate).toLocaleDateString()} -{" "}
                  {new Date(booking.endDate).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="payment-breakdown">
              <h3>Payment Summary</h3>
              <div className="breakdown-row">
                <span>Total Booking:</span>
                <span className="amount">{booking.finalTotalPrice.toLocaleString('vi-VN')} VND</span>
              </div>
              <div className="breakdown-row paid">
                <span>✅ Deposit Paid:</span>
                <span className="amount">-{booking.depositAmount.toLocaleString('vi-VN')} VND</span>
              </div>
              <div className="breakdown-row remaining">
                <span>⚠️ Remaining Balance:</span>
                <span className="amount highlight">{booking.remainingAmount.toLocaleString('vi-VN')} VND</span>
              </div>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="payment-method-selection">
            <h3>Choose Payment Method</h3>

            {/* VNPay Option */}
            <div
              className={`payment-option ${selectedMethod === "vnpay" ? "selected" : ""}`}
              onClick={() => setSelectedMethod("vnpay")}
            >
              <div className="option-radio">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="vnpay"
                  checked={selectedMethod === "vnpay"}
                  onChange={() => setSelectedMethod("vnpay")}
                />
              </div>
              <div className="option-content">
                <div className="option-header">
                  <h4>💳 Pay Now via VNPay</h4>
                  <span className="badge recommended">Recommended</span>
                </div>
                <p className="option-description">
                  Complete your payment online now. Fast, secure, and convenient.
                </p>
                <ul className="option-benefits">
                  <li>✅ Instant confirmation</li>
                  <li>✅ No cash needed at check-in</li>
                  <li>✅ Secure payment gateway</li>
                </ul>
              </div>
            </div>

            {/* Cash Option */}
            <div
              className={`payment-option ${selectedMethod === "cash" ? "selected" : ""}`}
              onClick={() => setSelectedMethod("cash")}
            >
              <div className="option-radio">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cash"
                  checked={selectedMethod === "cash"}
                  onChange={() => setSelectedMethod("cash")}
                />
              </div>
              <div className="option-content">
                <div className="option-header">
                  <h4>💵 Pay Cash at Check-in</h4>
                </div>
                <p className="option-description">
                  Confirm that you will bring cash when you check in.
                </p>
                <ul className="option-benefits">
                  <li>⚠️ Bring exact amount</li>
                  <li>⚠️ Payment required at check-in</li>
                  <li>⚠️ No digital receipt</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="action-buttons">
            <button
              className="btn-secondary"
              onClick={() => navigate(`/${user?._id || user?.id}/trips`)}
              disabled={processing}
            >
              ← Back to Trips
            </button>
            <button
              className="btn-primary"
              onClick={handleSubmit}
              disabled={!selectedMethod || processing}
            >
              {processing ? (
                "Processing..."
              ) : selectedMethod === "vnpay" ? (
                "Proceed to Payment →"
              ) : selectedMethod === "cash" ? (
                "Confirm Cash Payment"
              ) : (
                "Select Payment Method"
              )}
            </button>
          </div>

          {/* Important Notice */}
          <div className="important-notice">
            <h4>📌 Important Information</h4>
            <ul>
              <li>Payment must be completed before check-in</li>
              <li>Late payments may result in booking cancellation</li>
              <li>For VNPay payments, you will receive instant confirmation</li>
              <li>For cash payments, please bring the exact amount</li>
            </ul>
          </div>
        </div>
      </div>
      <Footer />

      {/* Modals */}
      <CashPaymentConfirmModal
        isOpen={showCashConfirmModal}
        onClose={() => {
          setShowCashConfirmModal(false);
          setProcessing(false);
        }}
        onConfirm={handleConfirmCash}
        amount={booking?.remainingAmount}
        loading={processing}
      />

      <PaymentSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        amount={booking?.remainingAmount}
        navigateTo={`/${user?._id || user?.id}/trips`}
      />
    </>
  );
};

export default PaymentReminderPage;

