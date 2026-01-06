import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import Loader from "../../components/Loader";
import ListingCard from "../../components/ListingCard";
import "../../styles/HostProfile.scss";
import { CONFIG, HTTP_METHODS } from "../../constants/api";

const HostProfile = () => {
  const { hostId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [hostData, setHostData] = useState(null);
  const [hostReviews, setHostReviews] = useState({
    averageRating: 0,
    totalReviews: 0,
    reviews: [],
  });

  useEffect(() => {
    fetchHostProfile();
    fetchHostReviews();
    // eslint-disable-next-line
  }, [hostId]);

  const fetchHostReviews = async () => {
    try {
      console.log("🔍 Fetching host reviews for ID:", hostId);
      const url = `${CONFIG.API_BASE_URL}/host-reviews/host/${hostId}`;
      console.log("📡 Host reviews URL:", url);

      const response = await fetch(url, { method: HTTP_METHODS.GET });
      console.log("📥 Host reviews response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Host reviews data:", data);
        console.log("   - Average rating:", data.averageRating);
        console.log("   - Total reviews:", data.totalReviews);
        console.log("   - Reviews count:", data.reviews?.length);
        setHostReviews(data);
      } else {
        const errorText = await response.text();
        console.error("❌ Host reviews error:", errorText);
      }
    } catch (error) {
      console.error("❌ Error fetching host reviews:", error);
    }
  };

  const fetchHostProfile = async () => {
    try {
      setLoading(true);
      console.log("🔍 Fetching host profile for ID:", hostId);

      const url = `${CONFIG.API_BASE_URL}/host/${hostId}`;
      console.log("📡 Request URL:", url);

      const response = await fetch(url, { method: HTTP_METHODS.GET });

      console.log("📥 Response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Host profile data:", data);
        setHostData(data);
      } else {
        const errorData = await response.json();
        console.error("❌ Error response:", errorData);
        setHostData(null);
      }
    } catch (error) {
      console.error("❌ Error fetching host profile:", error);
      setHostData(null);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={i} className="star filled">★</span>);
    }
    if (hasHalfStar) {
      stars.push(<span key="half" className="star half">★</span>);
    }
    const emptyStars = 5 - stars.length;
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<span key={`empty-${i}`} className="star empty">☆</span>);
    }
    return stars;
  };

  if (loading) return <Loader />;

  if (!hostData) {
    return (
      <>
        <Navbar />
        <div className="host-profile">
          <div className="error-message">
            <h2>Host not found</h2>
            <button onClick={() => navigate("/")}>Go to Homepage</button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const { host, statistics, listings, reviews } = hostData;

  console.log("🎯 Rendering HostProfile:");
  console.log("   - Host Reviews State:", hostReviews);
  console.log("   - Will show host reviews section?", hostReviews.totalReviews > 0);

  return (
    <>
      <Navbar />
      <div className="host-profile">
        {/* Host Header */}
        <div className="host-header">
          <div className="host-header-content">
            <div className="host-avatar">
              <img
                src={
                  host.profileImagePath?.startsWith("https://")
                    ? host.profileImagePath
                    : `${CONFIG.API_BASE_URL}/${host.profileImagePath?.replace("public/", "")}`
                }
                alt={`${host.firstName} ${host.lastName}`}
              />
            </div>

            <div className="host-info">
              <h1>
                {host.firstName} {host.lastName}
              </h1>
              <p className="member-since">
                🗓️ Member since {formatDate(host.memberSince)}
              </p>

              <div className="host-stats">
                <div className="stat-item">
                  <div className="stat-icon">⭐</div>
                  <div className="stat-content">
                    <span className="stat-value">
                      {hostReviews.averageRating > 0 ? hostReviews.averageRating : "N/A"}
                    </span>
                    <span className="stat-label">Rating</span>
                  </div>
                </div>

                <div className="stat-item">
                  <div className="stat-icon">💬</div>
                  <div className="stat-content">
                    <span className="stat-value">{hostReviews.totalReviews}</span>
                    <span className="stat-label">Reviews</span>
                  </div>
                </div>

                <div className="stat-item">
                  <div className="stat-icon">🏠</div>
                  <div className="stat-content">
                    <span className="stat-value">{statistics.totalListings}</span>
                    <span className="stat-label">Listings</span>
                  </div>
                </div>

                <div className="stat-item">
                  <div className="stat-icon">✓</div>
                  <div className="stat-content">
                    <span className="stat-value">{statistics.responseRate}%</span>
                    <span className="stat-label">Response</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Host Listings */}
        <div className="host-section">
          <h2 className="section-title">
            🏠 {host.firstName}'s Listings ({statistics.totalListings})
          </h2>

          {listings.length > 0 ? (
            <div className="listings-grid">
              {listings.map((listing) => (
                <div key={listing._id} className="listing-wrapper">
                  <ListingCard
                    listingId={listing._id}
                    creator={listing.creator}
                    listingPhotoPaths={listing.listingPhotoPaths}
                    city={listing.city}
                    province={listing.province}
                    country={listing.country}
                    category={listing.category}
                    type={listing.type}
                    price={listing.price}
                    booking={false}
                  />
                  {listing.hasActiveBooking && (
                    <div className="occupied-badge">🔒 Currently Occupied</div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="no-content">
              <p>No active listings at the moment</p>
            </div>
          )}
        </div>

        {/* Host Reviews */}
        <div className="host-section">
          <h2 className="section-title">
            ⭐ Reviews from Guests ({statistics.totalReviews})
          </h2>

          {reviews.length > 0 ? (
            <div className="reviews-grid">
              {reviews.map((review) => (
                <div key={review._id} className="review-card">
                  <div className="review-header">
                    <div className="reviewer-info">
                      <img
                        src={
                          review.reviewerId?.profileImagePath?.startsWith("https://")
                            ? review.reviewerId.profileImagePath
                            : `${CONFIG.API_BASE_URL}/${review.reviewerId?.profileImagePath?.replace("public/", "")}`
                        }
                        alt={review.reviewerId?.firstName}
                        className="reviewer-avatar"
                      />
                      <div>
                        <h4>
                          {review.reviewerId?.firstName} {review.reviewerId?.lastName}
                        </h4>
                        <p className="review-date">
                          {formatDate(review.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="review-rating">
                      {renderStars(review.hostRating)}
                      <span className="rating-number">{review.hostRating}/5</span>
                    </div>
                  </div>

                  {review.hostComment && (
                    <div className="review-comment">
                      <p>"{review.hostComment}"</p>
                    </div>
                  )}

                  {review.listingRating > 0 && (
                    <div className="listing-rating">
                      <span>Listing rating:</span>
                      {renderStars(review.listingRating)}
                      <span>{review.listingRating}/5</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="no-content">
              <p>No reviews yet</p>
            </div>
          )}
        </div>

        {/* Host Rating & Reviews */}
        {hostReviews.totalReviews > 0 && (
          <div className="host-section host-reviews-section">
            <div className="reviews-header">
              <h2 className="section-title">
                👤 Reviews as Host ({hostReviews.totalReviews})
              </h2>
              <div className="overall-rating">
                <div className="rating-display">
                  <span className="rating-number-large">{hostReviews.averageRating}</span>
                  <div className="rating-stars-large">
                    {renderStars(hostReviews.averageRating)}
                    <p className="rating-text">out of 5</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="reviews-list">
              {hostReviews.reviews.map((review) => (
                <div key={review._id} className="host-review-card">
                  <div className="review-header">
                    <div className="reviewer-info">
                      <img
                        src={
                          review.reviewer?.profileImagePath?.startsWith("https://")
                            ? review.reviewer.profileImagePath
                            : `${CONFIG.API_BASE_URL}/${review.reviewer?.profileImagePath?.replace("public/", "") || "assets/default-avatar.png"}`
                        }
                        alt={review.reviewer?.firstName || "Guest"}
                        className="reviewer-avatar"
                      />
                      <div>
                        <h4>
                          {review.reviewer?.firstName || "Anonymous"} {review.reviewer?.lastName || "Guest"}
                        </h4>
                        <p className="review-property">
                          Stayed at: <strong>{review.listing?.title || "Property"}</strong>
                        </p>
                        <p className="review-date">
                          {new Date(review.createdAt).toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="review-rating">
                      {renderStars(review.hostRating)}
                      <span className="rating-number">{review.hostRating}/5</span>
                    </div>
                  </div>

                  {review.hostComment && (
                    <div className="review-comment">
                      <p>"{review.hostComment}"</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default HostProfile;

