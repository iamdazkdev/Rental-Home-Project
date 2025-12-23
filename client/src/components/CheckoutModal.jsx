import React, { useState } from "react";
import "../styles/CheckoutModal.scss";

const CheckoutModal = ({ booking, onClose, onConfirm }) => {
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");

  // Review states
  const [listingRating, setListingRating] = useState(0);
  const [listingComment, setListingComment] = useState("");
  const [hostRating, setHostRating] = useState(0);
  const [hostComment, setHostComment] = useState("");

  const handleConfirm = async () => {
    setLoading(true);
    try {
      // Prepare review data (only if ratings are provided)
      const reviewData = listingRating > 0 ? {
        listingRating,
        listingComment: listingComment.trim(),
        hostRating: hostRating || 0,
        hostComment: hostComment.trim(),
      } : null;

      await onConfirm(feedback, reviewData);
      onClose();
    } catch (error) {
      console.error("Error during checkout:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const calculateNights = () => {
    const start = new Date(booking.startDate);
    const end = new Date(booking.finalEndDate || booking.endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const nights = calculateNights();

  return (
    <div className="checkout-modal-overlay" onClick={onClose}>
      <div className="checkout-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🏠 Check Out</h2>
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

          {/* Stay Summary */}
          <div className="stay-summary">
            <h4>Your Stay Summary</h4>
            <div className="summary-grid">
              <div className="summary-item">
                <span className="icon">📅</span>
                <div className="item-details">
                  <label>Check-in Date</label>
                  <p>{formatDate(booking.startDate)}</p>
                </div>
              </div>
              <div className="summary-item">
                <span className="icon">🏁</span>
                <div className="item-details">
                  <label>Check-out Date</label>
                  <p>{formatDate(booking.finalEndDate || booking.endDate)}</p>
                </div>
              </div>
              <div className="summary-item">
                <span className="icon">🌙</span>
                <div className="item-details">
                  <label>Total Nights</label>
                  <p>{nights} night{nights !== 1 ? "s" : ""}</p>
                </div>
              </div>
              <div className="summary-item">
                <span className="icon">💰</span>
                <div className="item-details">
                  <label>Total Paid</label>
                  <p>${(booking.finalTotalPrice || booking.totalPrice).toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Checkout Confirmation */}
          <div className="checkout-confirmation">
            <div className="confirmation-icon">✓</div>
            <h3>Ready to Check Out?</h3>
            <p className="confirmation-text">
              Complete your stay and leave a review (optional) to help others!
            </p>
          </div>

          {/* Review Section (Optional) */}
          <div className="review-section">
            <h4>📝 Leave a Review (Optional)</h4>
            <p className="review-subtitle">Share your experience to help future guests</p>

            {/* Listing Review */}
            <div className="review-group">
              <label>Rate the Listing</label>
              <div className="star-rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`star ${star <= listingRating ? "filled" : ""}`}
                    onClick={() => setListingRating(star)}
                  >
                    ★
                  </button>
                ))}
              </div>
              <textarea
                placeholder="What did you like about the property? (Optional)"
                value={listingComment}
                onChange={(e) => setListingComment(e.target.value)}
                rows={3}
              />
            </div>

            {/* Host Review */}
            <div className="review-group">
              <label>Rate the Host (Optional)</label>
              <div className="star-rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`star ${star <= hostRating ? "filled" : ""}`}
                    onClick={() => setHostRating(star)}
                  >
                    ★
                  </button>
                ))}
              </div>
              <textarea
                placeholder="How was your experience with the host? (Optional)"
                value={hostComment}
                onChange={(e) => setHostComment(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          {/* Quick Feedback */}
          <div className="feedback-section">
            <label htmlFor="feedback">Additional Feedback (Optional)</label>
            <textarea
              id="feedback"
              placeholder="Any other comments about your stay?"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={2}
            />
          </div>

          {/* Important Note */}
          <div className="info-note">
            <span className="note-icon">ℹ️</span>
            <p>
              Reviews are optional but greatly appreciated! They help improve the community.
            </p>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose} disabled={loading}>
            <span>✗</span> Cancel
          </button>
          <button className="btn-confirm" onClick={handleConfirm} disabled={loading}>
            {loading ? (
              <>
                <span className="spinner"></span>
                Checking Out...
              </>
            ) : (
              <>
                <span>✓</span> Confirm Check Out
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;

