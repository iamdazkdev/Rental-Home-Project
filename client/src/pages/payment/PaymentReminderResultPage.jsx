import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import "../../styles/PaymentResult.scss";

const PaymentReminderResultPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const user = useSelector((state) => state.user);

  const success = searchParams.get("success") === "true";
  const bookingId = searchParams.get("bookingId");
  const amount = searchParams.get("amount");
  const message = searchParams.get("message");
  const code = searchParams.get("code");

  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate(`/${user?._id || user?.id}/trips`);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <>
      <Navbar />
      <div className="payment-result-page">
        <div className="result-container">
          {success ? (
            // Success State
            <div className="result-content success">
              <div className="result-icon">
                <div className="checkmark-circle">
                  <div className="checkmark"></div>
                </div>
              </div>

              <h1 className="result-title">Payment Successful! ✅</h1>
              <p className="result-message">
                Your remaining payment has been completed successfully.
              </p>

              <div className="payment-details">
                <div className="detail-row">
                  <span className="label">Amount Paid:</span>
                  <span className="value highlight">
                    {parseInt(amount).toLocaleString('vi-VN')} VND
                  </span>
                </div>
                <div className="detail-row">
                  <span className="label">Booking ID:</span>
                  <span className="value">{bookingId?.slice(-12)}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Payment Status:</span>
                  <span className="value success-badge">PAID IN FULL</span>
                </div>
              </div>

              <div className="info-box success-info">
                <h3>✨ What's Next?</h3>
                <ul>
                  <li>Your booking is now fully paid</li>
                  <li>Check-in confirmation has been sent to your email</li>
                  <li>You can view your booking details in "My Trips"</li>
                  <li>Get ready for your upcoming stay!</li>
                </ul>
              </div>

              <div className="action-buttons">
                <button
                  className="btn-primary"
                  onClick={() => navigate(`/${user?._id || user?.id}/trips`)}
                >
                  View My Trips
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => navigate(`/booking/${bookingId}`)}
                >
                  View Booking Details
                </button>
              </div>

              <p className="redirect-notice">
                Redirecting to your trips in {countdown} seconds...
              </p>
            </div>
          ) : (
            // Failure State
            <div className="result-content failure">
              <div className="result-icon">
                <div className="error-circle">
                  <div className="error-cross">×</div>
                </div>
              </div>

              <h1 className="result-title">Payment Failed ❌</h1>
              <p className="result-message">
                {message || "Your payment could not be processed."}
              </p>

              {code && (
                <div className="error-code">
                  <span className="label">Error Code:</span>
                  <span className="code">{code}</span>
                </div>
              )}

              <div className="info-box error-info">
                <h3>What can you do?</h3>
                <ul>
                  <li>Try paying again using VNPay</li>
                  <li>Choose to pay cash at check-in instead</li>
                  <li>Contact support if the issue persists</li>
                  <li>Check your payment details are correct</li>
                </ul>
              </div>

              <div className="action-buttons">
                <button
                  className="btn-primary"
                  onClick={() => navigate(`/payment-reminder/${bookingId}`)}
                >
                  Try Again
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => navigate(`/${user?._id || user?.id}/trips`)}
                >
                  Back to Trips
                </button>
              </div>

              <p className="redirect-notice">
                Redirecting to your trips in {countdown} seconds...
              </p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default PaymentReminderResultPage;

