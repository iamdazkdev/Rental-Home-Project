import React, { useState } from "react";
import "../styles/ExtendStayModal.scss";

const ExtendStayModal = ({ booking, onClose, onSubmit }) => {
  const [additionalDays, setAdditionalDays] = useState(1);
  const [loading, setLoading] = useState(false);

  // Calculate pricing
  const dailyRate = booking.listingId?.price || 0;
  const extensionRate = dailyRate * 1.3; // 30% surcharge
  const additionalCost = extensionRate * additionalDays;

  // Calculate new end date
  const currentEndDate = new Date(booking.finalEndDate || booking.endDate);
  const newEndDate = new Date(currentEndDate);
  newEndDate.setDate(newEndDate.getDate() + additionalDays);

  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (additionalDays < 1) {
      alert("Please select at least 1 additional day");
      return;
    }

    setLoading(true);
    try {
      await onSubmit(additionalDays);
      onClose();
    } catch (error) {
      console.error("Error submitting extension:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDaysChange = (delta) => {
    const newDays = additionalDays + delta;
    if (newDays >= 1 && newDays <= 30) {
      setAdditionalDays(newDays);
    }
  };

  return (
    <div className="extend-stay-modal-overlay" onClick={onClose}>
      <div className="extend-stay-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📅 Extend Your Stay</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          {/* Listing Info */}
          <div className="listing-info">
            <img
              src={
                booking.listingId?.listingPhotoPaths?.[0]?.startsWith("https://")
                  ? booking.listingId.listingPhotoPaths[0]
                  : `${process.env.REACT_APP_API_URL || "http://localhost:3001"}/${booking.listingId?.listingPhotoPaths?.[0]?.replace("public/", "")}`
              }
              alt={booking.listingId?.title}
              className="listing-image"
            />
            <div className="listing-details">
              <h3>{booking.listingId?.title}</h3>
              <p className="location">
                {booking.listingId?.city}, {booking.listingId?.province}
              </p>
            </div>
          </div>

          {/* Current Booking Info */}
          <div className="booking-dates">
            <div className="date-item">
              <label>Current Check-in</label>
              <div className="date-value">{formatDate(new Date(booking.startDate))}</div>
            </div>
            <div className="arrow">→</div>
            <div className="date-item">
              <label>Current Check-out</label>
              <div className="date-value">
                {formatDate(new Date(booking.finalEndDate || booking.endDate))}
              </div>
            </div>
          </div>

          {/* Days Selector */}
          <div className="days-selector">
            <label>How many additional days?</label>
            <div className="days-control">
              <button
                type="button"
                className="days-btn"
                onClick={() => handleDaysChange(-1)}
                disabled={additionalDays <= 1}
              >
                −
              </button>
              <div className="days-display">
                <span className="days-number">{additionalDays}</span>
                <span className="days-text">day{additionalDays !== 1 ? "s" : ""}</span>
              </div>
              <button
                type="button"
                className="days-btn"
                onClick={() => handleDaysChange(1)}
                disabled={additionalDays >= 30}
              >
                +
              </button>
            </div>
            <div className="days-quick-select">
              {[1, 3, 7, 14].map((days) => (
                <button
                  key={days}
                  type="button"
                  className={`quick-btn ${additionalDays === days ? "active" : ""}`}
                  onClick={() => setAdditionalDays(days)}
                >
                  {days} {days === 1 ? "day" : "days"}
                </button>
              ))}
            </div>
          </div>

          {/* New Checkout Date */}
          <div className="new-checkout">
            <div className="new-checkout-label">New Check-out Date</div>
            <div className="new-checkout-date">
              <span className="calendar-icon">📅</span>
              {formatDate(newEndDate)}
            </div>
          </div>

          {/* Pricing Breakdown */}
          <div className="pricing-breakdown">
            <h4>Pricing Details</h4>
            <div className="price-row">
              <span>Original daily rate</span>
              <span>${dailyRate.toFixed(2)}</span>
            </div>
            <div className="price-row highlight">
              <span>Extension rate (30% premium)</span>
              <span>${extensionRate.toFixed(2)}</span>
            </div>
            <div className="price-row">
              <span>
                {additionalDays} day{additionalDays !== 1 ? "s" : ""} × ${extensionRate.toFixed(2)}
              </span>
              <span>${(extensionRate * additionalDays).toFixed(2)}</span>
            </div>
            <div className="price-divider"></div>
            <div className="price-row total">
              <span>Additional Cost</span>
              <span className="total-amount">${additionalCost.toFixed(2)}</span>
            </div>
          </div>

          {/* Info Message */}
          <div className="info-message">
            <span className="info-icon">ℹ️</span>
            <p>
              Your extension request will be sent to the host for approval. You'll receive a
              notification once they respond.
            </p>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button className="btn-submit" onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <span className="spinner"></span>
                Requesting...
              </>
            ) : (
              <>
                <span className="submit-icon">📅</span>
                Request Extension
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExtendStayModal;

