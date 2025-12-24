import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Navbar from '../../components/Navbar';
import Loader from '../../components/Loader';
import { API_ENDPOINTS, HTTP_METHODS, CONFIG } from '../../constants/api';
import { validateBookingData, getPaymentGatewayLogo, formatUSD } from '../../utils/paymentUtils';
import '../../styles/BookingCheckout.scss';

const BookingCheckoutPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useSelector((state) => state.user);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bookingData, setBookingData] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('vnpay_full'); // vnpay_full, vnpay_deposit, cash

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

      // Calculate amount based on payment method (USD)
      let paymentAmountUSD = bookingData.totalPrice;
      let depositPercentage = 0;

      if (paymentMethod === 'vnpay_deposit') {
        depositPercentage = 50; // 50% deposit
        paymentAmountUSD = bookingData.totalPrice * 0.5;
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
        alert('Booking created successfully! Please pay in cash when you check in.');
        navigate(`/${user?._id || user?.id}/trips`);
        return;
      }

      // For VNPay payments - prepare booking data
      const bookingPayload = {
        ...bookingData,
        paymentMethod: paymentMethod,
        depositPercentage: depositPercentage,
        depositAmount: paymentMethod === 'vnpay_deposit' ? paymentAmountUSD : 0,
      };

      // Convert USD to VND for VNPay (rate: 1 USD = 24,000 VND)
      const exchangeRate = 24000;
      const paymentAmountVND = Math.round(paymentAmountUSD * exchangeRate);

      console.log(`💳 Payment amount: $${paymentAmountUSD} USD = ${paymentAmountVND.toLocaleString()} VND`);

      // Create booking and payment URL
      const paymentResponse = await fetch(API_ENDPOINTS.PAYMENT.CREATE_PAYMENT_URL, {
        method: HTTP_METHODS.POST,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingData: bookingPayload,
          amount: paymentAmountVND,
          ipAddr: await getClientIP(),
        }),
      });

      if (!paymentResponse.ok) {
        const errorData = await paymentResponse.json();
        throw new Error(errorData.message || 'Failed to create payment URL');
      }

      const paymentResult = await paymentResponse.json();
      console.log("✅ Booking created with ID:", paymentResult.bookingId);
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
                <span className="value">${listing?.price?.toFixed(2)}</span>
              </div>

              <div className="detail-row">
                <span className="label">Number of nights:</span>
                <span className="value">× {dayCount}</span>
              </div>

              <hr />

              <div className="detail-row total">
                <span className="label">Total:</span>
                <span className="value">${totalPrice?.toFixed(2)}</span>
              </div>

              {/* VND Conversion for VNPay */}
              {(paymentMethod === 'vnpay_full' || paymentMethod === 'vnpay_deposit') && (
                <div className="currency-note">
                  <small>
                    ≈ {(totalPrice * 24000).toLocaleString('vi-VN')} VND
                    {paymentMethod === 'vnpay_deposit' && ` (Cọc: ${((totalPrice * 0.5) * 24000).toLocaleString('vi-VN')} VND)`}
                  </small>
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
              <h2>Chọn phương thức thanh toán</h2>

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
                      <h3>💳 Thanh toán toàn bộ qua VNPay</h3>
                      <p className="option-subtitle">Thanh toán ngay 100% giá trị booking</p>
                    </div>
                  </div>
                  <div className="option-details">
                    <div className="amount-display">
                      <span className="amount-label">Số tiền thanh toán:</span>
                      <span className="amount-value">${totalPrice?.toFixed(2)}</span>
                    </div>
                    <div className="benefits">
                      <span className="benefit-item">✓ Xác nhận booking ngay lập tức</span>
                      <span className="benefit-item">✓ Thanh toán an toàn qua VNPay</span>
                    </div>
                  </div>
                </div>

                {/* VNPay Deposit 50% */}
                <div
                  className={`payment-option ${paymentMethod === 'vnpay_deposit' ? 'active' : ''}`}
                  onClick={() => setPaymentMethod('vnpay_deposit')}
                >
                  <div className="option-header">
                    <div className="radio-circle">
                      {paymentMethod === 'vnpay_deposit' && <div className="radio-dot" />}
                    </div>
                    <div className="option-title">
                      <h3>🏦 Cọc trước 50% qua VNPay</h3>
                      <p className="option-subtitle">Thanh toán 50% ngay, 50% còn lại khi check-in</p>
                    </div>
                  </div>
                  <div className="option-details">
                    <div className="amount-breakdown">
                      <div className="breakdown-row">
                        <span>Cọc trước (50%):</span>
                        <span className="highlight">${(totalPrice * 0.5)?.toFixed(2)}</span>
                      </div>
                      <div className="breakdown-row">
                        <span>Thanh toán khi nhận phòng:</span>
                        <span>${(totalPrice * 0.5)?.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="benefits">
                      <span className="benefit-item">✓ Linh hoạt hơn về tài chính</span>
                      <span className="benefit-item">✓ Đảm bảo booking của bạn</span>
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
                      <h3>💵 Thanh toán tiền mặt khi nhận phòng</h3>
                      <p className="option-subtitle">Thanh toán toàn bộ bằng tiền mặt khi check-in</p>
                    </div>
                  </div>
                  <div className="option-details">
                    <div className="amount-display">
                      <span className="amount-label">Thanh toán khi nhận phòng:</span>
                      <span className="amount-value">${totalPrice?.toFixed(2)}</span>
                    </div>
                    <div className="benefits">
                      <span className="benefit-item">✓ Không cần thanh toán online</span>
                      <span className="benefit-item">⚠️ Vui lòng mang đủ tiền mặt khi check-in</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Info - Only show for VNPay methods */}
            {(paymentMethod === 'vnpay_full' || paymentMethod === 'vnpay_deposit') && (
              <div className="payment-info-card">
                <h2>Thông tin thanh toán</h2>
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
                      <p>💡 Bạn sẽ thanh toán <strong>${(totalPrice * 0.5)?.toFixed(2)}</strong> (50% tổng giá trị)</p>
                      <p>Số tiền còn lại sẽ được thanh toán khi check-in</p>
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
                  <h3>Lưu ý thanh toán tiền mặt</h3>
                  <ul>
                    <li>Vui lòng mang đủ <strong>${totalPrice?.toFixed(2)}</strong> tiền mặt khi check-in</li>
                    <li>Host sẽ xác nhận booking sau khi bạn hoàn tất đặt phòng</li>
                    <li>Nếu hủy phòng, vui lòng thông báo trước ít nhất 24 giờ</li>
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
                  paymentMethod === 'vnpay_deposit' ? 'Pay Deposit (50%)' :
                  'Proceed to Payment'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BookingCheckoutPage;

