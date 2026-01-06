import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Navbar from '../../components/Navbar';
import Loader from '../../components/Loader';
import BookingSuccessModal from '../../components/BookingSuccessModal';
import { API_ENDPOINTS, HTTP_METHODS, CONFIG } from '../../constants/api';
import { validateBookingData, getPaymentGatewayLogo } from '../../utils/paymentUtils';
import '../../styles/BookingCheckout.scss';

const BookingCheckoutPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useSelector((state) => state.user);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bookingData, setBookingData] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('vnpay_full'); // vnpay_full, vnpay_deposit, cash
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    // Get booking data from navigation state
    if (location.state?.bookingData) {
      setBookingData(location.state.bookingData);
    } else {
      // Redirect back if no booking data
      navigate(-1);
    }
  }, [location.state, navigate]);

  const handleConfirmPayment = async () => {
    if (submitting || !bookingData) return;

    // Validate booking data
    const validation = validateBookingData(bookingData);
    if (!validation.isValid) {
      alert(`Invalid booking data:\n${validation.errors.join('\n')}`);
      return;
    }

    try {
      setSubmitting(true);

      // Calculate amount based on payment method (VND - no conversion)
      let paymentAmount = bookingData.totalPrice;
      let depositPercentage = 0;

      if (paymentMethod === 'vnpay_deposit') {
        depositPercentage = 30; // 30% deposit
        paymentAmount = bookingData.totalPrice * 0.3;
      }

      // Handle cash payment - create booking immediately
      if (paymentMethod === 'cash') {
        const bookingPayload = {
          ...bookingData,
          paymentMethod: 'cash',
          depositPercentage: 0,
          depositAmount: 0,
        };

        console.log("💵 Creating cash booking...", bookingPayload);

        const bookingResponse = await fetch(API_ENDPOINTS.BOOKINGS.CREATE, {
          method: HTTP_METHODS.POST,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(bookingPayload),
        });

        if (!bookingResponse.ok) {
          const errorData = await bookingResponse.json();
          throw new Error(errorData.message || 'Failed to create booking');
        }

        console.log("✅ Cash booking created");

        // Show success modal instead of alert
        setSubmitting(false);
        setShowSuccessModal(true);
        return;
      }

      // For VNPay payments - prepare booking data
      const bookingPayload = {
        ...bookingData,
        paymentMethod: paymentMethod,
        depositPercentage: depositPercentage,
        depositAmount: paymentMethod === 'vnpay_deposit' ? paymentAmount : 0,
      };

      console.log(`💳 Payment amount: ${paymentAmount.toLocaleString()} VND (no conversion)`);

      // Create booking and payment URL
      const paymentResponse = await fetch(API_ENDPOINTS.PAYMENT.CREATE_PAYMENT_URL, {
        method: HTTP_METHODS.POST,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingData: bookingPayload,
          amount: paymentAmount, // Send VND amount directly (no conversion)
          ipAddr: await getClientIP(),
        }),
      });

      if (!paymentResponse.ok) {
        const errorData = await paymentResponse.json();
        throw new Error(errorData.message || 'Failed to create payment URL');
      }

      const paymentResult = await paymentResponse.json();
      console.log("✅ Temp order created:", paymentResult.tempOrderId);
      console.log("✅ VNPay payment URL generated");

      // Step 4: Redirect to VNPay
      if (paymentResult.paymentUrl) {
        console.log("🔄 Redirecting to VNPay...");
        window.location.href = paymentResult.paymentUrl;
      } else {
        throw new Error('Payment URL not received');
      }

    } catch (error) {
      console.error("❌ Error during checkout:", error);
      alert(error.message || 'Failed to process payment. Please try again.');
      setSubmitting(false);
    }
  };

  const getClientIP = async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.error('Failed to get IP:', error);
      return '127.0.0.1';
    }
  };

  // Format VND with Vietnamese thousand separator (dots)
  const formatVND = (amount) => {
    if (!amount && amount !== 0) return '0';
    const rounded = Math.round(amount);
    return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  if (loading || !bookingData) {
    return <Loader />;
  }

  const { listing, startDate, endDate, dayCount, totalPrice } = bookingData;

  return (
    <>
      <Navbar />
      <div className="booking-checkout-page">
        <div className="checkout-container">
          <h1>Confirm Your Booking</h1>

          <div className="checkout-content">
            {/* Listing Info */}
            <div className="listing-info-card">
              <h2>Property Details</h2>
              {listing?.listingPhotoPaths?.[0] && (
                <div className="listing-image">
                  <img
                    src={
                      listing.listingPhotoPaths[0].startsWith('http')
                        ? listing.listingPhotoPaths[0]
                        : `${CONFIG.API_BASE_URL}/${listing.listingPhotoPaths[0].replace('public/', '')}`
                    }
                    alt={listing.title}
                  />
                </div>
              )}
              <h3>{listing?.title}</h3>
              <p className="location">
                📍 {listing?.city}, {listing?.province}, {listing?.country}
              </p>
              <p className="property-type">
                🏠 {listing?.type}
              </p>
            </div>

            {/* Booking Details */}
            <div className="booking-details-card">
              <h2>Booking Details</h2>

              <div className="detail-row">
                <span className="label">Check-in:</span>
                <span className="value">{startDate}</span>
              </div>

              <div className="detail-row">
                <span className="label">Check-out:</span>
                <span className="value">{endDate}</span>
              </div>

              <div className="detail-row">
                <span className="label">Duration:</span>
                <span className="value">{dayCount} {dayCount > 1 ? 'nights' : 'night'}</span>
              </div>

              <hr />

              <div className="detail-row">
                <span className="label">Price per night:</span>
                <span className="value">{formatVND(listing?.price)} VND</span>
              </div>

              <div className="detail-row">
                <span className="label">Number of nights:</span>
                <span className="value">× {dayCount}</span>
              </div>

              <hr />

              <div className="detail-row total">
                <span className="label">Total:</span>
                <span className="value">{formatVND(totalPrice)} VND</span>
              </div>

              {/* Payment method breakdown */}
              {paymentMethod === 'vnpay_deposit' && (
                <div className="payment-breakdown">
                  <div className="detail-row deposit">
                    <span className="label">Deposit 30%:</span>
                    <span className="value">{formatVND(totalPrice * 0.3)} VND</span>
                  </div>
                  <div className="detail-row remaining">
                    <span className="label">Remaining (Pay at check-in):</span>
                    <span className="value">{formatVND(totalPrice * 0.7)} VND</span>
                  </div>
                </div>
              )}
            </div>

            {/* Guest Info */}
            <div className="guest-info-card">
              <h2>Guest Information</h2>
              <div className="detail-row">
                <span className="label">Name:</span>
                <span className="value">{user?.firstName} {user?.lastName}</span>
              </div>
              <div className="detail-row">
                <span className="label">Email:</span>
                <span className="value">{user?.email}</span>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="payment-method-card">
              <h2>Select Payment Method</h2>

              <div className="payment-methods">
                {/* VNPay Full Payment */}
                <div
                  className={`payment-option ${paymentMethod === 'vnpay_full' ? 'active' : ''}`}
                  onClick={() => setPaymentMethod('vnpay_full')}
                >
                  <div className="option-header">
                    <div className="radio-circle">
                      {paymentMethod === 'vnpay_full' && <div className="radio-dot" />}
                    </div>
                    <div className="option-title">
                      <h3>💳 Pay Full Amount via VNPay</h3>
                      <p className="option-subtitle">Pay 100% of booking value now</p>
                    </div>
                  </div>
                  <div className="option-details">
                    <div className="amount-display">
                      <span className="amount-label">Payment Amount:</span>
                      <span className="amount-value">{formatVND(totalPrice)} VND</span>
                    </div>
                    <div className="benefits">
                      <span className="benefit-item">✓ Instant booking confirmation</span>
                      <span className="benefit-item">✓ Secure payment via VNPay</span>
                    </div>
                  </div>
                </div>

                {/* VNPay Deposit 30% */}
                <div
                  className={`payment-option ${paymentMethod === 'vnpay_deposit' ? 'active' : ''}`}
                  onClick={() => setPaymentMethod('vnpay_deposit')}
                >
                  <div className="option-header">
                    <div className="radio-circle">
                      {paymentMethod === 'vnpay_deposit' && <div className="radio-dot" />}
                    </div>
                    <div className="option-title">
                      <h3>🏦 Pay 30% Deposit via VNPay</h3>
                      <p className="option-subtitle">Pay 30% now, 70% remaining at check-in</p>
                    </div>
                  </div>
                  <div className="option-details">
                    <div className="amount-breakdown">
                      <div className="breakdown-row">
                        <span>Deposit (30%):</span>
                        <span className="highlight">{formatVND(totalPrice * 0.3)} VND</span>
                      </div>
                      <div className="breakdown-row">
                        <span>Pay at check-in:</span>
                        <span>{formatVND(totalPrice * 0.7)} VND</span>
                      </div>
                    </div>
                    <div className="benefits">
                      <span className="benefit-item">✓ More flexible financially</span>
                      <span className="benefit-item">✓ Secure your booking</span>
                    </div>
                  </div>
                </div>

                {/* Cash Payment */}
                <div
                  className={`payment-option ${paymentMethod === 'cash' ? 'active' : ''}`}
                  onClick={() => setPaymentMethod('cash')}
                >
                  <div className="option-header">
                    <div className="radio-circle">
                      {paymentMethod === 'cash' && <div className="radio-dot" />}
                    </div>
                    <div className="option-title">
                      <h3>💵 Cash Payment at Check-in</h3>
                      <p className="option-subtitle">Pay full amount in cash when checking in</p>
                    </div>
                  </div>
                  <div className="option-details">
                    <div className="amount-display">
                      <span className="amount-label">Pay at check-in:</span>
                      <span className="amount-value">{formatVND(totalPrice)} VND</span>
                    </div>
                    <div className="benefits">
                      <span className="benefit-item">✓ No online payment required</span>
                      <span className="benefit-item">⚠️ Please bring sufficient cash at check-in</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Info - Only show for VNPay methods */}
            {(paymentMethod === 'vnpay_full' || paymentMethod === 'vnpay_deposit') && (
              <div className="payment-info-card">
                <h2>Payment Information</h2>
                <div className="payment-method">
                  <img
                    src={getPaymentGatewayLogo('vnpay')}
                    alt="VNPay"
                    className="vnpay-logo"
                  />
                  <p>Secure payment via VNPay</p>
                  <p className="payment-desc">
                    You will be redirected to VNPay to complete your payment securely.
                  </p>
                  {paymentMethod === 'vnpay_deposit' && (
                    <div className="deposit-notice">
                      <p>💡 You will pay <strong>{formatVND(totalPrice * 0.3)} VND</strong> (30% of total value)</p>
                      <p>The remaining amount will be paid at check-in</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Cash Payment Info */}
            {paymentMethod === 'cash' && (
              <div className="cash-payment-info">
                <div className="info-icon">ℹ️</div>
                <div className="info-content">
                  <h3>Cash Payment Notice</h3>
                  <ul>
                    <li>Please bring sufficient cash (<strong>{formatVND(totalPrice)} VND</strong>) at check-in</li>
                    <li>Host will confirm booking after you complete the reservation</li>
                    <li>If you need to cancel, please notify at least 24 hours in advance</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="checkout-actions">
              <button
                className="btn btn-secondary"
                onClick={() => navigate(-1)}
                disabled={submitting}
              >
                Back
              </button>
              <button
                className="btn btn-primary"
                onClick={handleConfirmPayment}
                disabled={submitting}
              >
                {submitting ? 'Processing...' :
                  paymentMethod === 'cash' ? 'Confirm Booking' :
                  paymentMethod === 'vnpay_deposit' ? 'Pay Deposit (30%)' :
                  'Proceed to Payment'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <BookingSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        bookingData={bookingData}
        paymentMethod={paymentMethod}
        userId={user?._id || user?.id}
      />
    </>
  );
};

export default BookingCheckoutPage;

