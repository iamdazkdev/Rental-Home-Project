import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import Loader from "../../components/Loader";
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

  useEffect(() => {
    fetchRoomDetails();
    if (user) {
      checkIdentityVerification();
    }
  }, [roomId, user]);

  const checkIdentityVerification = async () => {
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
  };

  const fetchRoomDetails = async () => {
    try {
      const response = await fetch(`http://localhost:3001/listing/${roomId}`);
      const data = await response.json();
      setRoom(data);
    } catch (error) {
      console.error("Error fetching room details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestClick = () => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (identityStatus !== "approved") {
      alert(
        "⚠️ Identity verification required! Please verify your identity before requesting a room rental."
      );
      navigate("/create-listing"); // This will show identity verification form
      return;
    }

    setShowRequestModal(true);
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const userId = user?.id || user?._id;
      const response = await fetch("http://localhost:3001/room-rental/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomId,
          tenantId: userId,
          tenantName: `${user.firstName} ${user.lastName}`,
          ...requestData,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert("✅ Rental request submitted successfully! The host will review your request.");
        setShowRequestModal(false);
        navigate("/room-rental/my-requests");
      } else {
        setError(data.message || "Failed to submit request");
        if (data.errors) {
          setError(data.errors.join(", "));
        }
      }
    } catch (error) {
      console.error("Error submitting request:", error);
      setError("Failed to submit request. Please try again.");
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

            <div className="price-section">
              <span className="price">
                {room.price?.toLocaleString("vi-VN")} VND
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
              <h3>Interested in this room?</h3>
              <p>Submit a rental request to the host</p>

              <button className="request-btn" onClick={handleRequestClick}>
                📩 Request to Rent
              </button>

              <div className="info-list">
                <div className="info-item">
                  <span className="icon">💰</span>
                  <div>
                    <strong>Deposit</strong>
                    <p>1 month rent ({room.price?.toLocaleString("vi-VN")} VND)</p>
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
          <div className="modal-overlay" onClick={() => setShowRequestModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>📩 Submit Rental Request</h2>
                <button
                  className="close-btn"
                  onClick={() => setShowRequestModal(false)}
                >
                  ✕
                </button>
              </div>

              {error && <div className="error-message">{error}</div>}

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
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default RoomRentalDetail;

