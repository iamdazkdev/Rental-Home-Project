import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CreditCard, Wallet, Banknote, CheckCircle, AlertCircle } from 'lucide-react';
import '../../styles/BookingReview.scss';

const BookingReview = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { listing, checkIn, checkOut, guests, pricing } = location.state || {};

  const user = JSON.parse(localStorage.getItem('user'));

  const [paymentMethod, setPaymentMethod] = useState('vnpay_full');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!listing || !pricing) {
    navigate('/');
    return null;
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  const depositAmount = Math.round(pricing.total * 0.30);
  const remainingAmount = pricing.total - depositAmount;

  const handleConfirmBooking = async () => {
    if (!agreedToTerms) {
      setError('Please agree to the terms and conditions');
      return;
    }

    try {
      setLoading(true);
      setError('');

      if (paymentMethod === 'cash') {
        // Create cash booking directly
        const response = await fetch('http://localhost:3001/entire-place-booking/create-cash', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            listingId: listing._id,
            hostId: listing.creator._id,
            startDate: checkIn,
            endDate: checkOut,
            totalPrice: pricing.total,
            guestCount: guests
          })
        });

        if (!response.ok) {
          throw new Error('Failed to create booking');
        }

        const booking = await response.json();
        navigate('/booking/confirmation', { state: { booking, paymentMethod: 'cash' } });

      } else {
        // Create VNPay payment
        const paymentAmount = paymentMethod === 'vnpay_full' ? pricing.total : depositAmount;

        const response = await fetch('http://localhost:3001/payment/create-payment-url', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            bookingData: {
              listingId: listing._id,
              customerId: user._id,
              hostId: listing.creator._id,
              startDate: checkIn,
              endDate: checkOut,
              totalPrice: pricing.total,
              paymentMethod,
              depositPercentage: paymentMethod === 'vnpay_deposit' ? 30 : 0,
              depositAmount: paymentMethod === 'vnpay_deposit' ? depositAmount : 0,
              guestCount: guests
            },
            amount: paymentAmount,
            paymentType: paymentMethod === 'vnpay_full' ? 'full' : 'deposit'
          })
        });

        if (!response.ok) {
          throw new Error('Failed to create payment');
        }

        const { paymentUrl } = await response.json();

        // Redirect to VNPay
        window.location.href = paymentUrl;
      }

    } catch (error) {
      console.error('Error creating booking:', error);
      setError('Failed to process booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="booking-review">
      <div className="review-container">
        <h1>Review Your Booking</h1>

        <div className="review-content">
          {/* Left Column - Booking Details */}
          <div className="booking-details">
            <div className="property-info">
              <img
                src={listing.listingPhotoPaths?.[0]}
                alt={listing.title}
              />
              <div>
                <h2>{listing.title}</h2>
                <p>{listing.city}, {listing.country}</p>
              </div>
            </div>

            <div className="booking-info">
              <h3>Your Trip</h3>
              <div className="info-row">
                <strong>Dates</strong>
                <span>{checkIn} → {checkOut}</span>
              </div>
              <div className="info-row">
                <strong>Guests</strong>
                <span>{guests} guest{guests > 1 ? 's' : ''}</span>
              </div>
              <div className="info-row">
                <strong>Nights</strong>
                <span>{pricing.nights} night{pricing.nights > 1 ? 's' : ''}</span>
              </div>
            </div>

            <div className="price-details">
              <h3>Price Details</h3>
              <div className="price-row">
                <span>{formatPrice(pricing.pricePerNight)} VND × {pricing.nights} nights</span>
                <span>{formatPrice(pricing.subtotal)} VND</span>
              </div>
              <div className="price-row">
                <span>Service fee</span>
                <span>{formatPrice(pricing.serviceFee)} VND</span>
              </div>
              <div className="price-row">
                <span>Taxes</span>
                <span>{formatPrice(pricing.tax)} VND</span>
              </div>
              <div className="price-row total">
                <strong>Total</strong>
                <strong>{formatPrice(pricing.total)} VND</strong>
              </div>
            </div>

            <div className="cancellation-policy">
              <h3>Cancellation Policy</h3>
              <p>
                {listing.cancellationPolicy === 'flexible' &&
                  'Free cancellation up to 7 days before check-in. After that, cancel up to 3 days before for a 50% refund.'}
                {listing.cancellationPolicy === 'moderate' &&
                  'Free cancellation up to 14 days before check-in. After that, cancel up to 7 days before for a 50% refund.'}
                {listing.cancellationPolicy === 'strict' &&
                  'Free cancellation up to 30 days before check-in. After that, cancel up to 14 days before for a 50% refund.'}
              </p>
            </div>

            {listing.houseRules && (
              <div className="house-rules">
                <h3>House Rules</h3>
                <p>{listing.houseRules}</p>
              </div>
            )}
          </div>

          {/* Right Column - Payment Method */}
          <div className="payment-section">
            <h3>Choose Payment Method</h3>

            <div className="payment-options">
              <label className={`payment-option ${paymentMethod === 'vnpay_full' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="payment"
                  value="vnpay_full"
                  checked={paymentMethod === 'vnpay_full'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <div className="option-content">
                  <div className="option-header">
                    <CreditCard size={24} />
                    <div>
                      <strong>VNPay - Pay Full (100%)</strong>
                      <span className="recommended">Recommended</span>
                    </div>
                  </div>
                  <div className="option-details">
                    <p>Pay {formatPrice(pricing.total)} VND now via VNPay</p>
                    <ul>
                      <li><CheckCircle size={16} /> Secure payment</li>
                      <li><CheckCircle size={16} /> Instant confirmation</li>
                      <li><CheckCircle size={16} /> Full refund if host rejects</li>
                    </ul>
                  </div>
                </div>
              </label>

              <label className={`payment-option ${paymentMethod === 'vnpay_deposit' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="payment"
                  value="vnpay_deposit"
                  checked={paymentMethod === 'vnpay_deposit'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <div className="option-content">
                  <div className="option-header">
                    <Wallet size={24} />
                    <strong>VNPay - Deposit (30%)</strong>
                  </div>
                  <div className="option-details">
                    <p>Pay {formatPrice(depositAmount)} VND now, {formatPrice(remainingAmount)} VND at check-in</p>
                    <ul>
                      <li><CheckCircle size={16} /> Secure deposit</li>
                      <li><CheckCircle size={16} /> Pay remaining in cash</li>
                      <li><AlertCircle size={16} /> Deposit non-refundable after approval</li>
                    </ul>
                  </div>
                </div>
              </label>

              <label className={`payment-option ${paymentMethod === 'cash' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="payment"
                  value="cash"
                  checked={paymentMethod === 'cash'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <div className="option-content">
                  <div className="option-header">
                    <Banknote size={24} />
                    <strong>Cash Payment</strong>
                  </div>
                  <div className="option-details">
                    <p>Pay {formatPrice(pricing.total)} VND directly to host at check-in</p>
                    <ul>
                      <li><AlertCircle size={16} /> No payment protection</li>
                      <li><AlertCircle size={16} /> Host may require upfront deposit</li>
                      <li><AlertCircle size={16} /> Subject to host approval</li>
                    </ul>
                  </div>
                </div>
              </label>
            </div>

            <div className="terms-agreement">
              <label>
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                />
                <span>
                  I agree to the house rules, cancellation policy, and terms of service
                </span>
              </label>
            </div>

            {error && (
              <div className="error-message">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <button
              className="confirm-btn"
              onClick={handleConfirmBooking}
              disabled={loading || !agreedToTerms}
            >
              {loading ? 'Processing...' :
               paymentMethod === 'vnpay_full' ? `Pay ${formatPrice(pricing.total)} VND` :
               paymentMethod === 'vnpay_deposit' ? `Pay Deposit ${formatPrice(depositAmount)} VND` :
               'Request Booking (Pay Cash)'}
            </button>

            <p className="security-note">
              🔒 Your payment information is secure and encrypted
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingReview;

