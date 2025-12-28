import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, AlertCircle } from 'lucide-react';
import '../styles/BookingWidget.scss';

const BookingWidget = ({ listing, initialCheckIn, initialCheckOut, initialGuests }) => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  const [checkIn, setCheckIn] = useState(initialCheckIn || '');
  const [checkOut, setCheckOut] = useState(initialCheckOut || '');
  const [guests, setGuests] = useState(initialGuests || 1);

  const [availability, setAvailability] = useState(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (checkIn && checkOut) {
      checkAvailability();
    }
  }, [checkIn, checkOut]);

  const checkAvailability = async () => {
    try {
      setChecking(true);
      setError('');

      const response = await fetch(
        `http://localhost:3001/entire-place-booking/check-availability?` +
        `listingId=${listing._id}&startDate=${checkIn}&endDate=${checkOut}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      const data = await response.json();

      if (data.available) {
        setAvailability(data);
      } else {
        setError('Selected dates are not available');
        setAvailability(null);
      }
    } catch (error) {
      console.error('Error checking availability:', error);
      setError('Failed to check availability');
    } finally {
      setChecking(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  const handleReserve = () => {
    if (!user) {
      navigate('/login', { state: { from: window.location.pathname } });
      return;
    }

    if (!availability) {
      setError('Please select valid dates');
      return;
    }

    // Navigate to booking review page
    navigate('/booking/review', {
      state: {
        listing,
        checkIn,
        checkOut,
        guests,
        pricing: availability.pricing
      }
    });
  };

  const minDate = new Date().toISOString().split('T')[0];

  return (
    <div className="booking-widget">
      <div className="widget-header">
        <div className="price">
          <strong>{formatPrice(listing.price)} VND</strong>
          <span>/night</span>
        </div>
        {listing.rating && (
          <div className="rating">
            ⭐ {listing.rating} ({listing.reviewCount} reviews)
          </div>
        )}
      </div>

      <div className="widget-body">
        <div className="date-inputs">
          <div className="input-group">
            <label>
              <Calendar size={16} />
              Check-in
            </label>
            <input
              type="date"
              value={checkIn}
              min={minDate}
              onChange={(e) => setCheckIn(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label>
              <Calendar size={16} />
              Check-out
            </label>
            <input
              type="date"
              value={checkOut}
              min={checkIn || minDate}
              onChange={(e) => setCheckOut(e.target.value)}
            />
          </div>
        </div>

        <div className="input-group">
          <label>
            <Users size={16} />
            Guests
          </label>
          <input
            type="number"
            min="1"
            max={listing.guestCount}
            value={guests}
            onChange={(e) => setGuests(parseInt(e.target.value))}
          />
          <small>Max {listing.guestCount} guests</small>
        </div>

        {checking && (
          <div className="checking">Checking availability...</div>
        )}

        {error && (
          <div className="error">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {availability && (
          <div className="price-breakdown">
            <div className="breakdown-row">
              <span>{formatPrice(listing.price)} VND × {availability.pricing.nights} nights</span>
              <span>{formatPrice(availability.pricing.subtotal)} VND</span>
            </div>
            <div className="breakdown-row">
              <span>Service fee (10%)</span>
              <span>{formatPrice(availability.pricing.serviceFee)} VND</span>
            </div>
            <div className="breakdown-row">
              <span>Taxes (5%)</span>
              <span>{formatPrice(availability.pricing.tax)} VND</span>
            </div>
            <div className="breakdown-row total">
              <strong>Total</strong>
              <strong>{formatPrice(availability.pricing.total)} VND</strong>
            </div>
          </div>
        )}

        <button
          className="reserve-btn"
          onClick={handleReserve}
          disabled={!availability || checking}
        >
          {user ? 'Reserve' : 'Login to Reserve'}
        </button>

        <p className="notice">You won't be charged yet</p>
      </div>

      {listing.cancellationPolicy && (
        <div className="widget-footer">
          <h4>Cancellation Policy: {listing.cancellationPolicy}</h4>
          <p>
            {listing.cancellationPolicy === 'flexible' &&
              'Free cancellation up to 7 days before check-in'}
            {listing.cancellationPolicy === 'moderate' &&
              'Free cancellation up to 14 days before check-in'}
            {listing.cancellationPolicy === 'strict' &&
              'Free cancellation up to 30 days before check-in'}
          </p>
        </div>
      )}
    </div>
  );
};

export default BookingWidget;

