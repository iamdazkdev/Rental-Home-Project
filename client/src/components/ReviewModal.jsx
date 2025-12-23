import React, { useState } from "react";
import { API_ENDPOINTS, HTTP_METHODS } from "../constants/api";
import "../styles/ReviewModal.scss";

const ReviewModal = ({ booking, onClose, onReviewSubmitted }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    listingRating: 5,
    listingComment: "",
    hostRating: 5,
    hostComment: "",
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const reviewData = {
        bookingId: booking._id,
        reviewerId: booking.customerId._id || booking.customerId,
        listingRating: formData.listingRating,
        listingComment: formData.listingComment.trim(),
        hostRating: formData.hostRating,
        hostComment: formData.hostComment.trim(),
      };

      const response = await fetch(API_ENDPOINTS.REVIEWS.CREATE, {
        method: HTTP_METHODS.POST,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reviewData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit review");
      }

      const data = await response.json();
      console.log("✅ Review submitted:", data);

      alert("Review submitted successfully!");
      onReviewSubmitted();
      onClose();
    } catch (error) {
      console.error("❌ Error submitting review:", error);
      alert(error.message || "Failed to submit review. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating, field) => {
    return (
      <div className="star-rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`star ${star <= rating ? "active" : ""}`}
            onClick={() => handleInputChange(field, star)}
          >
            ★
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="review-modal-overlay" onClick={onClose}>
      <div className="review-modal" onClick={(e) => e.stopPropagation()}>
        <div className="review-modal-header">
          <h2>Write a Review</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="review-modal-body">
          <div className="booking-info">
            <h3>{booking.listingId?.title}</h3>
            <p className="booking-dates">
              {booking.startDate} - {booking.endDate}
            </p>
            <p className="booking-price">${booking.totalPrice}</p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Listing Rating */}
            <div className="review-section">
              <h4>Rate the Listing</h4>
              <div className="rating-input">
                {renderStars(formData.listingRating, "listingRating")}
                <span className="rating-text">
                  {formData.listingRating} star{formData.listingRating !== 1 ? "s" : ""}
                </span>
              </div>
              <textarea
                placeholder="Share your experience about this listing..."
                value={formData.listingComment}
                onChange={(e) => handleInputChange("listingComment", e.target.value)}
                maxLength={1000}
                rows={3}
              />
              <div className="char-count">
                {formData.listingComment.length}/1000
              </div>
            </div>

            {/* Host Rating */}
            <div className="review-section">
              <h4>Rate the Host</h4>
              <div className="rating-input">
                {renderStars(formData.hostRating, "hostRating")}
                <span className="rating-text">
                  {formData.hostRating} star{formData.hostRating !== 1 ? "s" : ""}
                </span>
              </div>
              <textarea
                placeholder="How was your experience with the host?"
                value={formData.hostComment}
                onChange={(e) => handleInputChange("hostComment", e.target.value)}
                maxLength={500}
                rows={2}
              />
              <div className="char-count">
                {formData.hostComment.length}/500
              </div>
            </div>

            <div className="review-modal-footer">
              <button
                type="button"
                className="btn-cancel"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-submit"
                disabled={loading}
              >
                {loading ? "Submitting..." : "Submit Review"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;
