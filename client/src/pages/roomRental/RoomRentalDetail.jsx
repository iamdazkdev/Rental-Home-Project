import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import Loader from "../../components/Loader";
import RequestResultModal from "../../components/RequestResultModal";
import "../../styles/RoomRentalDetail.scss";

const RoomRentalDetail = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const user = useSelector((state) => state.user);

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestData, setRequestData] = useState({
    message: "",
    moveInDate: "",
    intendedStayDuration: 6,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [identityStatus, setIdentityStatus] = useState(null);

  // Result Modal State
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultType, setResultType] = useState(""); // success or error
  const [resultMessage, setResultMessage] = useState("");

  const checkIdentityVerification = useCallback(async () => {
    if (!user) return;
    try {
      const userId = user?.id || user?._id;
      const response = await fetch(
        `http://localhost:3001/identity-verification/${userId}/status`
      );
      const data = await response.json();
      setIdentityStatus(data.status);
    } catch (error) {
      console.error("Error checking identity:", error);
    }
  }, [user]);

  const fetchRoomDetails = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:3001/listing/${roomId}`);
      const data = await response.json();
      setRoom(data);
    } catch (error) {
      console.error("Error fetching room details:", error);
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    fetchRoomDetails();
    if (user) {
      checkIdentityVerification();
    }
  }, [fetchRoomDetails, checkIdentityVerification, user]);

  const handleRequestClick = () => {
    if (!user) {
      navigate("/login");
      return;
    }

    // Check identity verification status
    if (!identityStatus) {
      // Show verification required modal
      setShowRequestModal(true);
      setError("verification_required");
      return;
    }

    if (identityStatus === "pending") {
      // Show pending verification modal
      setShowRequestModal(true);
      setError("verification_pending");
      return;
    }

    if (identityStatus === "rejected") {
      // Show rejected verification modal
      setShowRequestModal(true);
      setError("verification_rejected");
      return;
    }

    // Identity verified - show request modal
    setShowRequestModal(true);
    setError("");
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const userId = user?.id || user?._id;
      const requestPayload = {
        roomId,
        tenantId: userId,
        tenantName: `${user.firstName} ${user.lastName}`,
        ...requestData,
      };

      console.log("📤 Submitting rental request:", requestPayload);

      const response = await fetch("http://localhost:3001/room-rental/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestPayload),
      });

      const data = await response.json();
      console.log("📥 Response from server:", data);

      if (data.success) {
        // Close request modal
        setShowRequestModal(false);

        // Show success result modal
        setResultType("success");
        setResultMessage(
          "Your rental request has been submitted successfully! The host will review your application and get back to you soon."
        );
        setShowResultModal(true);
      } else {
        console.error("❌ Request failed:", data);

        // Show error result modal
        setShowRequestModal(false);
        setResultType("error");
        setResultMessage(
          data.message ||
          (data.errors ? data.errors.join(", ") : "Failed to submit request. Please try again later.")
        );
        setShowResultModal(true);
      }
    } catch (error) {
      console.error("Error submitting request:", error);

      // Show error result modal
      setShowRequestModal(false);
      setResultType("error");
      setResultMessage(
        "An unexpected error occurred while submitting your request. Please check your connection and try again."
      );
      setShowResultModal(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loader />;
  if (!room) return <div>Room not found</div>;

  return (
    <>
      <Navbar />
      <div className="room-rental-detail">
        {/* Room Images */}
        <div className="room-images">
          <div className="main-image">
            <img
              src={
                room.listingPhotoPaths?.[0] ||
                "https://via.placeholder.com/800x600?text=No+Image"
              }
              alt={room.title}
            />
          </div>
          {room.listingPhotoPaths?.length > 1 && (
            <div className="thumbnail-images">
              {room.listingPhotoPaths.slice(1, 5).map((photo, index) => (
                <img key={index} src={photo} alt={`Room ${index + 2}`} />
              ))}
            </div>
          )}
        </div>

        <div className="room-content">
          {/* Main Info */}
          <div className="room-main">
            <h1>{room.title}</h1>
            <p className="location">
              📍 {room.city}, {room.province}, {room.country}
            </p>

            <div className="room-price">
              <span className="price">
                {(room.monthlyRent || room.price)?.toLocaleString("vi-VN")} VND
              </span>
              <span className="period">/ month</span>
            </div>

            <div className="room-stats">
              <div className="stat">
                <span className="icon">🛏️</span>
                <span>{room.bedroomCount || 1} Bedroom</span>
              </div>
              <div className="stat">
                <span className="icon">🛁</span>
                <span>{room.bathroomCount || 1} Bathroom</span>
              </div>
              <div className="stat">
                <span className="icon">👥</span>
                <span>{room.guestCount || 1} Guest</span>
              </div>
              {room.roomArea && (
                <div className="stat">
                  <span className="icon">📏</span>
                  <span>{room.roomArea} m²</span>
                </div>
              )}
            </div>

            <div className="description">
              <h2>About this room</h2>
              <p>{room.description}</p>
            </div>

            {room.amenities && room.amenities.length > 0 && (
              <div className="amenities">
                <h2>Amenities</h2>
                <div className="amenities-grid">
                  {room.amenities.map((amenity, index) => (
                    <div key={index} className="amenity-item">
                      <span>✓</span> {amenity}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Host Info */}
            <div className="host-section">
              <h2>Your Host</h2>
              <div className="host-card">
                <img
                  src={
                    room.creator?.profileImagePath ||
                    "https://via.placeholder.com/80"
                  }
                  alt={room.creator?.firstName}
                />
                <div className="host-details">
                  <h3>
                    {room.creator?.firstName} {room.creator?.lastName}
                  </h3>
                  <p>Joined in {new Date(room.creator?.createdAt).getFullYear()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="room-sidebar">
            <div className="request-card">
              {/* Availability Status Badge */}
              {room.roomAvailabilityStatus === 'RENTED' && (
                <div className="status-badge rented">
                  🔒 Currently Rented
                </div>
              )}
              {room.roomAvailabilityStatus === 'AVAILABLE' && (
                <div className="status-badge available">
                  ✅ Available Now
                </div>
              )}

              <h3>Interested in this room?</h3>

              {room.roomAvailabilityStatus === 'RENTED' ? (
                <p className="rented-message">
                  This room is currently rented and not available for new requests.
                </p>
              ) : (
                <p>Submit a rental request to the host</p>
              )}

              <button
                className="request-btn"
                onClick={handleRequestClick}
                disabled={room.roomAvailabilityStatus === 'RENTED'}
              >
                {room.roomAvailabilityStatus === 'RENTED' ? '🔒 Not Available' : '📩 Request to Rent'}
              </button>

              <div className="info-list">
                <div className="info-item">
                  <span className="icon">💰</span>
                  <div>
                    <strong>Deposit</strong>
                    <p>1 month rent ({(room.monthlyRent || room.price)?.toLocaleString("vi-VN")} VND)</p>
                  </div>
                </div>
                <div className="info-item">
                  <span className="icon">📅</span>
                  <div>
                    <strong>Notice Period</strong>
                    <p>30 days</p>
                  </div>
                </div>
                <div className="info-item">
                  <span className="icon">✅</span>
                  <div>
                    <strong>Requirements</strong>
                    <p>Identity verification needed</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Request Modal */}
        {showRequestModal && (
          <div
            className="modal-overlay"
            onClick={() => {
              // Only allow closing if showing request form (not verification messages)
              if (!error) {
                setShowRequestModal(false);
              }
            }}
          >
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>
                  {error === "verification_required" && "🔐 Identity Verification Required"}
                  {error === "verification_pending" && "⏳ Verification Pending"}
                  {error === "verification_rejected" && "❌ Verification Rejected"}
                  {!error && "📩 Submit Rental Request"}
                </h2>
                <button
                  className="close-btn"
                  onClick={() => setShowRequestModal(false)}
                >
                  ✕
                </button>
              </div>

              {/* Verification Required */}
              {error === "verification_required" && (
                <div className="verification-message">
                  <div className="message-icon">🔐</div>
                  <h3>Identity Verification Required</h3>
                  <p>
                    To ensure safety and trust in our community, you need to verify your identity
                    before requesting a room rental.
                  </p>
                  <div className="verification-benefits">
                    <h4>Why verify?</h4>
                    <ul>
                      <li>✅ Build trust with hosts</li>
                      <li>✅ Increase approval chances</li>
                      <li>✅ Protect the community</li>
                      <li>✅ Required for Room Rental</li>
                    </ul>
                  </div>
                  <div className="modal-actions">
                    <button
                      className="primary-btn"
                      onClick={() => navigate("/identity-verification")}
                    >
                      Verify My Identity
                    </button>
                    <button
                      className="secondary-btn"
                      onClick={() => setShowRequestModal(false)}
                    >
                      Maybe Later
                    </button>
                  </div>
                </div>
              )}

              {/* Verification Pending */}
              {error === "verification_pending" && (
                <div className="verification-message">
                  <div className="message-icon">⏳</div>
                  <h3>Verification Under Review</h3>
                  <p>
                    Your identity verification is currently being reviewed by our admin team.
                    This usually takes 1-2 business days.
                  </p>
                  <div className="info-box">
                    <p>
                      <strong>What's next?</strong>
                    </p>
                    <ul>
                      <li>Wait for admin approval</li>
                      <li>You'll receive a notification once approved</li>
                      <li>Then you can submit room rental requests</li>
                    </ul>
                  </div>
                  <div className="modal-actions">
                    <button
                      className="primary-btn"
                      onClick={() => navigate("/identity-verification")}
                    >
                      Check Status
                    </button>
                    <button
                      className="secondary-btn"
                      onClick={() => setShowRequestModal(false)}
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}

              {/* Verification Rejected */}
              {error === "verification_rejected" && (
                <div className="verification-message">
                  <div className="message-icon">❌</div>
                  <h3>Verification Rejected</h3>
                  <p>
                    Unfortunately, your identity verification was not approved.
                    Please update your information and resubmit.
                  </p>
                  <div className="warning-box">
                    <p>
                      <strong>Common issues:</strong>
                    </p>
                    <ul>
                      <li>Unclear ID card photos</li>
                      <li>Information mismatch</li>
                      <li>Expired documents</li>
                      <li>Incomplete information</li>
                    </ul>
                  </div>
                  <div className="modal-actions">
                    <button
                      className="primary-btn"
                      onClick={() => navigate("/identity-verification")}
                    >
                      Update & Resubmit
                    </button>
                    <button
                      className="secondary-btn"
                      onClick={() => setShowRequestModal(false)}
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}

              {/* Normal Request Form - Only show if verified */}
              {!error && (
                <form onSubmit={handleSubmitRequest}>
                  <div className="form-group">
                    <label>
                      Introduce yourself <span className="required">*</span>
                    </label>
                    <textarea
                      value={requestData.message}
                      onChange={(e) =>
                        setRequestData({ ...requestData, message: e.target.value })
                      }
                      placeholder="Tell the host about yourself, your lifestyle, occupation, and why you're interested in this room (minimum 50 characters)"
                      rows={6}
                      required
                      minLength={50}
                    />
                    <p className="hint">
                      {requestData.message.length}/1000 characters (min: 50)
                    </p>
                  </div>

                  <div className="form-group">
                    <label>
                      Preferred Move-in Date <span className="required">*</span>
                    </label>
                    <input
                      type="date"
                      value={requestData.moveInDate}
                      onChange={(e) =>
                        setRequestData({ ...requestData, moveInDate: e.target.value })
                      }
                      min={new Date().toISOString().split("T")[0]}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      Intended Stay Duration (months) <span className="required">*</span>
                    </label>
                    <input
                      type="number"
                      value={requestData.intendedStayDuration}
                      onChange={(e) =>
                        setRequestData({
                          ...requestData,
                          intendedStayDuration: parseInt(e.target.value),
                        })
                      }
                      min={1}
                      required
                    />
                    <p className="hint">Minimum 1 month</p>
                  </div>

                  <div className="form-actions">
                    <button
                      type="button"
                      className="cancel-btn"
                      onClick={() => setShowRequestModal(false)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="submit-btn" disabled={submitting}>
                      {submitting ? "Submitting..." : "Submit Request"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Request Result Modal */}
        {showResultModal && (
          <RequestResultModal
            type={resultType}
            message={resultMessage}
            onClose={() => {
              setShowResultModal(false);
              if (resultType === "success") {
                navigate("/room-rental/my-requests");
              }
            }}
            onViewRequests={() => {
              setShowResultModal(false);
              navigate("/room-rental/my-requests");
            }}
          />
        )}
      </div>
      <Footer />
    </>
  );
};

export default RoomRentalDetail;

