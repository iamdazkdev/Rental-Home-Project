import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { API_ENDPOINTS, HTTP_METHODS } from "../../constants/api";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import Loader from "../../components/Loader";
import "../../styles/ReservationList.scss";

const ReservationList = () => {
  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState([]);
  const [filter, setFilter] = useState("all"); // all, pending, accepted, rejected
  const user = useSelector((state) => state.user);
  const userId = user?._id || user?.id;

  const getReservations = async () => {
    try {
      setLoading(true);
      const url = `${API_ENDPOINTS.BOOKINGS.GET_HOST_RESERVATIONS}/${userId}`;
      const response = await fetch(url, { method: HTTP_METHODS.GET });

      if (!response.ok) {
        throw new Error(`Failed to fetch reservations: ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ Loaded ${data.length} reservations`);
      setReservations(data);
      setLoading(false);
    } catch (error) {
      console.error("❌ Error fetching reservations:", error);
      setLoading(false);
    }
  };

  const handleAccept = async (bookingId) => {
    try {
      console.log(`🔄 Accepting booking ${bookingId}...`);
      const url = `${API_ENDPOINTS.BOOKINGS.ACCEPT}/${bookingId}/accept`;
      const response = await fetch(url, {
        method: HTTP_METHODS.PATCH,
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`Failed to accept booking: ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ ${data.message}`);

      // Refresh reservations
      await getReservations();
    } catch (error) {
      console.error("❌ Error accepting booking:", error);
    }
  };

  const handleReject = async (bookingId) => {
    const reason = prompt("Please provide a reason for rejection (optional):");

    try {
      console.log(`🔄 Rejecting booking ${bookingId}...`);
      const url = `${API_ENDPOINTS.BOOKINGS.REJECT}/${bookingId}/reject`;
      const response = await fetch(url, {
        method: HTTP_METHODS.PATCH,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason || "No reason provided" }),
      });

      if (!response.ok) {
        throw new Error(`Failed to reject booking: ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ ${data.message}`);

      // Refresh reservations
      await getReservations();
    } catch (error) {
      console.error("❌ Error rejecting booking:", error);
    }
  };

  const handleApproveExtension = async (bookingId, extensionIndex) => {
    try {
      console.log(`🔄 Approving extension ${extensionIndex} for booking ${bookingId}...`);
      const url = `${API_ENDPOINTS.BOOKINGS.ACCEPT}/${bookingId}/extension/${extensionIndex}/approve`;
      const response = await fetch(url, {
        method: HTTP_METHODS.PATCH,
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`Failed to approve extension: ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ ${data.message}`);

      // Refresh reservations
      await getReservations();
    } catch (error) {
      console.error("❌ Error approving extension:", error);
    }
  };

  const handleRejectExtension = async (bookingId, extensionIndex) => {
    const reason = prompt("Please provide a reason for rejecting the extension (optional):");

    try {
      console.log(`🔄 Rejecting extension ${extensionIndex} for booking ${bookingId}...`);
      const url = `${API_ENDPOINTS.BOOKINGS.REJECT}/${bookingId}/extension/${extensionIndex}/reject`;
      const response = await fetch(url, {
        method: HTTP_METHODS.PATCH,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason || "No reason provided" }),
      });

      if (!response.ok) {
        throw new Error(`Failed to reject extension: ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ ${data.message}`);

      // Refresh reservations
      await getReservations();
    } catch (error) {
      console.error("❌ Error rejecting extension:", error);
    }
  };

  useEffect(() => {
    if (userId) {
      getReservations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const filteredReservations = reservations.filter((reservation) => {
    if (filter === "all") return true;
    return reservation.status === filter;
  });

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "pending":
        return "status-badge pending";
      case "accepted":
        return "status-badge accepted";
      case "rejected":
        return "status-badge rejected";
      default:
        return "status-badge";
    }
  };

  return loading ? (
    <Loader />
  ) : (
    <>
      <Navbar />
      <div className="reservation-list">
        <h1 className="title">Your Reservations</h1>

        {/* Filter Tabs */}
        <div className="filter-tabs">
          <button
            className={filter === "all" ? "active" : ""}
            onClick={() => setFilter("all")}
          >
            All ({reservations.length})
          </button>
          <button
            className={filter === "pending" ? "active" : ""}
            onClick={() => setFilter("pending")}
          >
            Pending ({reservations.filter((r) => r.status === "pending").length})
          </button>
          <button
            className={filter === "accepted" ? "active" : ""}
            onClick={() => setFilter("accepted")}
          >
            Accepted ({reservations.filter((r) => r.status === "accepted").length})
          </button>
          <button
            className={filter === "rejected" ? "active" : ""}
            onClick={() => setFilter("rejected")}
          >
            Rejected ({reservations.filter((r) => r.status === "rejected").length})
          </button>
        </div>

        {/* Reservations List */}
        {filteredReservations.length === 0 ? (
          <div className="no-reservations">
            <p>No {filter !== "all" ? filter : ""} reservations found.</p>
          </div>
        ) : (
          <div className="reservations-grid">
            {filteredReservations.map((reservation) => (
              <div key={reservation._id} className="reservation-card">
                {/* Listing Image */}
                <div className="reservation-image">
                  <img
                    src={
                      reservation.listingId?.listingPhotoPaths?.[0]?.startsWith("https://")
                        ? reservation.listingId.listingPhotoPaths[0]
                        : `${API_ENDPOINTS.API_BASE_URL}/${reservation.listingId?.listingPhotoPaths?.[0]?.replace("public/", "")}`
                    }
                    alt={reservation.listingId?.title}
                  />
                  <span className={getStatusBadgeClass(reservation.status)}>
                    {reservation.status.toUpperCase()}
                  </span>
                </div>

                {/* Reservation Details */}
                <div className="reservation-details">
                  <h3>{reservation.listingId?.title}</h3>
                  <p className="location">
                    {reservation.listingId?.city}, {reservation.listingId?.province},{" "}
                    {reservation.listingId?.country}
                  </p>

                  <div className="guest-info">
                    <img
                      src={
                        reservation.customerId?.profileImagePath?.startsWith("https://")
                          ? reservation.customerId.profileImagePath
                          : `${API_ENDPOINTS.API_BASE_URL}/${reservation.customerId?.profileImagePath?.replace("public/", "")}`
                      }
                      alt={`${reservation.customerId?.firstName} ${reservation.customerId?.lastName}`}
                      className="guest-avatar"
                    />
                    <div>
                      <p className="guest-name">
                        {reservation.customerId?.firstName} {reservation.customerId?.lastName}
                      </p>
                      <p className="guest-email">{reservation.customerId?.email}</p>
                    </div>
                  </div>

                  <div className="booking-info">
                    <p>
                      <strong>Check-in:</strong> {reservation.startDate}
                    </p>
                    <p>
                      <strong>Check-out:</strong>{" "}
                      {reservation.finalEndDate || reservation.endDate}
                      {reservation.finalEndDate && (
                        <span className="extended-badge"> (Extended)</span>
                      )}
                    </p>
                    <p>
                      <strong>Total:</strong> $
                      {(reservation.finalTotalPrice || reservation.totalPrice).toFixed(2)}
                      {reservation.finalTotalPrice && (
                        <span className="updated-price"> (Updated)</span>
                      )}
                    </p>
                    <p className="booking-date">
                      Requested: {new Date(reservation.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Guest Profile - For Room/Shared Room Only */}
                  {reservation.listingId?.hostProfile &&
                   (reservation.listingId?.type === "Room(s)" || reservation.listingId?.type === "A Shared Room") && (
                    <div className="guest-compatibility">
                      <h4>👤 Guest should know about you:</h4>
                      <div className="host-profile-summary">
                        <div className="profile-tags">
                          <span className="tag">
                            🌙 {reservation.listingId.hostProfile.sleepSchedule === "early_bird" ? "Early Bird" :
                                reservation.listingId.hostProfile.sleepSchedule === "night_owl" ? "Night Owl" : "Flexible"}
                          </span>
                          <span className="tag">
                            🚬 {reservation.listingId.hostProfile.smoking === "no" ? "Non-smoker" :
                                reservation.listingId.hostProfile.smoking === "outside_only" ? "Outside only" : "Smoker"}
                          </span>
                          <span className="tag">
                            😊 {reservation.listingId.hostProfile.personality === "introvert" ? "Introvert" :
                                reservation.listingId.hostProfile.personality === "extrovert" ? "Extrovert" : "Ambivert"}
                          </span>
                          <span className="tag">
                            🧹 {reservation.listingId.hostProfile.cleanliness === "very_clean" ? "Very Clean" :
                                reservation.listingId.hostProfile.cleanliness === "moderate" ? "Moderate" : "Relaxed"}
                          </span>
                        </div>
                        {reservation.listingId.hostProfile.occupation && (
                          <p className="occupation">💼 {reservation.listingId.hostProfile.occupation}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {reservation.rejectionReason && reservation.status === "rejected" && (
                    <div className="rejection-reason">
                      <strong>Rejection Reason:</strong> {reservation.rejectionReason}
                    </div>
                  )}

                  {/* Action Buttons */}
                  {reservation.status === "pending" && (
                    <div className="action-buttons">
                      <button
                        className="btn-accept"
                        onClick={() => handleAccept(reservation._id)}
                      >
                        ✓ Accept
                      </button>
                      <button
                        className="btn-reject"
                        onClick={() => handleReject(reservation._id)}
                      >
                        ✗ Reject
                      </button>
                    </div>
                  )}

                  {reservation.status === "accepted" && (
                    <div className="status-message accepted-message">
                      ✓ You accepted this booking
                    </div>
                  )}

                  {reservation.status === "rejected" && (
                    <div className="status-message rejected-message">
                      ✗ You rejected this booking
                    </div>
                  )}

                  {/* Extension Requests */}
                  {reservation.extensionRequests?.length > 0 && (
                    <div className="extension-requests">
                      <h4>Extension Requests</h4>
                      {reservation.extensionRequests.map((extension, index) => (
                        <div key={index} className="extension-request">
                          <div className="request-details">
                            <p>
                              <strong>Additional Days</strong>
                              <span>{extension.additionalDays} day{extension.additionalDays !== 1 ? 's' : ''}</span>
                            </p>
                            <p>
                              <strong>New End Date</strong>
                              <span>{new Date(extension.requestedEndDate).toLocaleDateString('en-US', {
                                weekday: 'short',
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}</span>
                            </p>
                            <p>
                              <strong>Additional Cost</strong>
                              <span>${extension.additionalPrice.toFixed(2)}</span>
                            </p>
                            <p className="request-date">
                              Requested on {new Date(extension.requestedAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          </div>

                          <div className="request-actions">
                            {extension.status === "pending" && (
                              <>
                                <button
                                  className="btn-approve"
                                  onClick={() => handleApproveExtension(reservation._id, index)}
                                >
                                  <span>✓</span> Approve
                                </button>
                                <button
                                  className="btn-reject"
                                  onClick={() => handleRejectExtension(reservation._id, index)}
                                >
                                  <span>✗</span> Reject
                                </button>
                              </>
                            )}

                            {extension.status === "approved" && (
                              <div className="status-message accepted-message">
                                Extension approved
                              </div>
                            )}

                            {extension.status === "rejected" && (
                              <div className="status-message rejected-message">
                                Extension rejected
                                {extension.rejectionReason && (
                                  <div className="rejection-reason">
                                    Reason: {extension.rejectionReason}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default ReservationList;

