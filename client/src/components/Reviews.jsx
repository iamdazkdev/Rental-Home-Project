import React, { useState, useEffect } from "react";
import { API_ENDPOINTS, HTTP_METHODS } from "../constants/api";
import "../styles/Reviews.scss";

const Reviews = ({ listingId }) => {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({
    averageRating: 0,
    totalReviews: 0,
  });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const url = `${API_ENDPOINTS.REVIEWS.GET_LISTING(listingId)}?page=${page}&limit=5`;
      const response = await fetch(url, { method: HTTP_METHODS.GET });

      if (!response.ok) {
        throw new Error("Failed to fetch reviews");
      }

      const data = await response.json();
      console.log("✅ Reviews fetched:", data);

      setReviews((prev) => (page === 1 ? data.reviews : [...prev, ...data.reviews]));
      setStats(data.stats);
      setHasMore(data.pagination.page < data.pagination.pages);
      setLoading(false);
    } catch (error) {
      console.error("❌ Error fetching reviews:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (listingId) {
      fetchReviews();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingId, page]);

  const loadMore = () => {
    setPage((prev) => prev + 1);
  };

  const renderStars = (rating) => {
    return (
      <div className="stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} className={star <= rating ? "star filled" : "star"}>
            ★
          </span>
        ))}
      </div>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 7) {
      return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months > 1 ? "s" : ""} ago`;
    } else {
      return date.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
    }
  };

  if (loading && page === 1) {
    return (
      <div className="reviews-section">
        <h2>Loading reviews...</h2>
      </div>
    );
  }

  return (
    <div className="reviews-section">
      <div className="reviews-header">
        <h2>
          <span className="rating-badge">⭐ {stats.averageRating.toFixed(1)}</span>
          {stats.totalReviews > 0 && (
            <span className="review-count">
              · {stats.totalReviews} review{stats.totalReviews !== 1 ? "s" : ""}
            </span>
          )}
        </h2>
      </div>

      {reviews.length === 0 ? (
        <div className="no-reviews">
          <p>No reviews yet. Be the first to review this listing!</p>
        </div>
      ) : (
        <>
          <div className="reviews-list">
            {reviews.map((review) => (
              <div key={review._id} className="review-card">
                <div className="review-header">
                  <div className="reviewer-info">
                    <img
                      src={
                        review.reviewerId?.profileImagePath?.startsWith("https://")
                          ? review.reviewerId.profileImagePath
                          : `${API_ENDPOINTS.API_BASE_URL}/${review.reviewerId?.profileImagePath?.replace("public/", "")}`
                      }
                      alt={`${review.reviewerId?.firstName} ${review.reviewerId?.lastName}`}
                      className="reviewer-avatar"
                    />
                    <div className="reviewer-details">
                      <h4>
                        {review.reviewerId?.firstName} {review.reviewerId?.lastName}
                      </h4>
                      <p className="review-date">{formatDate(review.createdAt)}</p>
                    </div>
                  </div>
                  <div className="review-rating">{renderStars(review.listingRating)}</div>
                </div>

                {review.listingComment && (
                  <div className="review-comment">
                    <p>{review.listingComment}</p>
                  </div>
                )}

                {review.hostRating && (
                  <div className="host-rating">
                    <div className="rating-label">
                      <span>Host Rating:</span>
                      {renderStars(review.hostRating)}
                    </div>
                    {review.hostComment && <p className="host-comment">{review.hostComment}</p>}
                  </div>
                )}

                {review.bookingId && (
                  <div className="booking-info">
                    <span className="stayed-badge">
                      ✓ Stayed {review.bookingId.startDate} - {review.bookingId.endDate}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {hasMore && (
            <div className="load-more-container">
              <button className="load-more-btn" onClick={loadMore} disabled={loading}>
                {loading ? "Loading..." : "Show more reviews"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Reviews;

