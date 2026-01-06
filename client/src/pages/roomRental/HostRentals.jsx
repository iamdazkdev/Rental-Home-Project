import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Home, CheckCircle, XCircle, Calendar, User, DollarSign, AlertTriangle, Eye, Clock } from "lucide-react";
import Navbar from "../../components/Navbar";
import "../../styles/HostRentals.scss";

const HostRentals = () => {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selectedRental, setSelectedRental] = useState(null);
  const [showMoveOutModal, setShowMoveOutModal] = useState(false);
  const user = useSelector((state) => state.user);

  useEffect(() => {
    fetchRentals();
  }, [user]);

  const fetchRentals = async () => {
    try {
      const response = await fetch(
        `http://localhost:3001/room-rental/status/host/${user._id}`
      );
      const data = await response.json();
      if (data.success) {
        setRentals(data.rentals);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching rentals:", error);
      setLoading(false);
    }
  };

  const handleConfirmMoveIn = async (rentalId) => {
    try {
      const response = await fetch(
        `http://localhost:3001/room-rental/move-in/${rentalId}/confirm`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: user._id,
            userType: "host",
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        alert("Move-in confirmed successfully!");
        fetchRentals();
      }
    } catch (error) {
      console.error("Error confirming move-in:", error);
      alert("Failed to confirm move-in");
    }
  };

  const handleConfirmMoveOut = async (rentalId) => {
    try {
      const response = await fetch(
        `http://localhost:3001/room-rental/move-out/${rentalId}/confirm`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: user._id,
            userType: "host",
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        alert("Move-out confirmed successfully!");
        setShowMoveOutModal(false);
        fetchRentals();
      }
    } catch (error) {
      console.error("Error confirming move-out:", error);
      alert("Failed to confirm move-out");
    }
  };

  const filteredRentals = rentals.filter((rental) => {
    if (filter === "all") return true;
    if (filter === "pending") return rental.status === "PENDING_MOVE_IN";
    if (filter === "active") return rental.status === "ACTIVE";
    if (filter === "terminating") return rental.status === "TERMINATING";
    return true;
  });

  const getStatusBadge = (status) => {
    const statusConfig = {
      PENDING_MOVE_IN: { color: "#ffc107", label: "Pending Move-In" },
      ACTIVE: { color: "#28a745", label: "Active" },
      TERMINATING: { color: "#ff9800", label: "Terminating" },
      COMPLETED: { color: "#6c757d", label: "Completed" },
    };
    const config = statusConfig[status] || statusConfig.PENDING_MOVE_IN;
    return (
      <span className="status-badge" style={{ backgroundColor: config.color }}>
        {config.label}
      </span>
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="host-rentals">
          <div className="loading">Loading rentals...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="host-rentals">
        <div className="rentals-header">
          <Home size={48} />
          <h1>Active Rentals</h1>
          <p>Manage your ongoing room rentals and tenant relationships</p>
        </div>

        <div className="filter-tabs">
          <button
            className={filter === "all" ? "active" : ""}
            onClick={() => setFilter("all")}
          >
            All ({rentals.length})
          </button>
          <button
            className={filter === "pending" ? "active" : ""}
            onClick={() => setFilter("pending")}
          >
            Pending Move-In ({rentals.filter((r) => r.status === "PENDING_MOVE_IN").length})
          </button>
          <button
            className={filter === "active" ? "active" : ""}
            onClick={() => setFilter("active")}
          >
            Active ({rentals.filter((r) => r.status === "ACTIVE").length})
          </button>
          <button
            className={filter === "terminating" ? "active" : ""}
            onClick={() => setFilter("terminating")}
          >
            Terminating ({rentals.filter((r) => r.status === "TERMINATING").length})
          </button>
        </div>

        {filteredRentals.length === 0 ? (
          <div className="no-rentals">
            <Home size={64} />
            <h3>No Rentals Found</h3>
            <p>You don't have any rentals in this category yet.</p>
          </div>
        ) : (
          <div className="rentals-grid">
            {filteredRentals.map((rental) => (
              <div key={rental._id} className="rental-card">
                <div className="card-header">
                  <div className="room-info">
                    <h3>{rental.roomId?.title || "Room"}</h3>
                    <p>{rental.roomId?.city}, {rental.roomId?.province}</p>
                  </div>
                  {getStatusBadge(rental.status)}
                </div>

                <div className="tenant-section">
                  <div className="tenant-avatar">
                    {rental.tenantId?.profileImagePath ? (
                      <img src={rental.tenantId.profileImagePath} alt="Tenant" />
                    ) : (
                      <User size={32} />
                    )}
                  </div>
                  <div className="tenant-details">
                    <h4>{rental.tenantId?.firstName} {rental.tenantId?.lastName}</h4>
                    <p>{rental.tenantId?.email}</p>
                  </div>
                </div>

                <div className="rental-details">
                  <div className="detail-row">
                    <DollarSign size={18} />
                    <span>Monthly Rent: {formatCurrency(rental.agreementId?.rentAmount || 0)}</span>
                  </div>
                  {rental.moveInDate && (
                    <div className="detail-row">
                      <Calendar size={18} />
                      <span>Moved In: {formatDate(rental.moveInDate)}</span>
                    </div>
                  )}
                  {rental.status === "PENDING_MOVE_IN" && (
                    <div className="detail-row">
                      <Clock size={18} />
                      <span>Expected: {formatDate(rental.agreementId?.createdAt)}</span>
                    </div>
                  )}
                </div>

                <div className="confirmation-status">
                  {rental.status === "PENDING_MOVE_IN" && (
                    <>
                      <div className="status-item">
                        {rental.moveInConfirmedByTenant ? (
                          <CheckCircle size={18} color="#28a745" />
                        ) : (
                          <AlertTriangle size={18} color="#ffc107" />
                        )}
                        <span>Tenant: {rental.moveInConfirmedByTenant ? "Confirmed" : "Pending"}</span>
                      </div>
                      <div className="status-item">
                        {rental.moveInConfirmedByHost ? (
                          <CheckCircle size={18} color="#28a745" />
                        ) : (
                          <AlertTriangle size={18} color="#ffc107" />
                        )}
                        <span>Host: {rental.moveInConfirmedByHost ? "Confirmed" : "Pending"}</span>
                      </div>
                    </>
                  )}
                  {rental.status === "TERMINATING" && (
                    <>
                      <div className="status-item">
                        {rental.moveOutConfirmedByTenant ? (
                          <CheckCircle size={18} color="#28a745" />
                        ) : (
                          <AlertTriangle size={18} color="#ffc107" />
                        )}
                        <span>Tenant: {rental.moveOutConfirmedByTenant ? "Moved Out" : "Pending"}</span>
                      </div>
                      <div className="status-item">
                        {rental.moveOutConfirmedByHost ? (
                          <CheckCircle size={18} color="#28a745" />
                        ) : (
                          <AlertTriangle size={18} color="#ffc107" />
                        )}
                        <span>Host: {rental.moveOutConfirmedByHost ? "Confirmed" : "Pending"}</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="card-actions">
                  <button
                    className="view-btn"
                    onClick={() => setSelectedRental(rental)}
                  >
                    <Eye size={18} />
                    View Details
                  </button>

                  {rental.status === "PENDING_MOVE_IN" && !rental.moveInConfirmedByHost && (
                    <button
                      className="confirm-btn"
                      onClick={() => handleConfirmMoveIn(rental.agreementId._id)}
                    >
                      <CheckCircle size={18} />
                      Confirm Move-In
                    </button>
                  )}

                  {rental.status === "TERMINATING" && !rental.moveOutConfirmedByHost && (
                    <button
                      className="confirm-btn"
                      onClick={() => {
                        setSelectedRental(rental);
                        setShowMoveOutModal(true);
                      }}
                    >
                      <CheckCircle size={18} />
                      Confirm Move-Out
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedRental && !showMoveOutModal && (
          <div className="rental-modal" onClick={() => setSelectedRental(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Rental Details</h2>
                <button
                  className="close-btn"
                  onClick={() => setSelectedRental(null)}
                >
                  ×
                </button>
              </div>

              <div className="modal-body">
                <div className="rental-section">
                  <h3>Property Information</h3>
                  <div className="info-grid">
                    <div>
                      <strong>Room:</strong>
                      <p>{selectedRental.roomId?.title}</p>
                    </div>
                    <div>
                      <strong>Location:</strong>
                      <p>{selectedRental.roomId?.streetAddress}</p>
                      <p>{selectedRental.roomId?.city}, {selectedRental.roomId?.province}</p>
                    </div>
                  </div>
                </div>

                <div className="rental-section">
                  <h3>Tenant Information</h3>
                  <div className="info-grid">
                    <div>
                      <strong>Name:</strong>
                      <p>{selectedRental.tenantId?.firstName} {selectedRental.tenantId?.lastName}</p>
                    </div>
                    <div>
                      <strong>Email:</strong>
                      <p>{selectedRental.tenantId?.email}</p>
                    </div>
                  </div>
                </div>

                <div className="rental-section">
                  <h3>Rental Status</h3>
                  <div className="info-grid">
                    <div>
                      <strong>Current Status:</strong>
                      <p>{selectedRental.status.replace(/_/g, " ")}</p>
                    </div>
                    {selectedRental.moveInDate && (
                      <div>
                        <strong>Move-In Date:</strong>
                        <p>{formatDate(selectedRental.moveInDate)}</p>
                      </div>
                    )}
                    {selectedRental.moveOutDate && (
                      <div>
                        <strong>Move-Out Date:</strong>
                        <p>{formatDate(selectedRental.moveOutDate)}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="rental-section">
                  <h3>Financial Details</h3>
                  <div className="info-grid">
                    <div>
                      <strong>Monthly Rent:</strong>
                      <p>{formatCurrency(selectedRental.agreementId?.rentAmount || 0)}</p>
                    </div>
                    <div>
                      <strong>Deposit:</strong>
                      <p>{formatCurrency(selectedRental.agreementId?.depositAmount || 0)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {showMoveOutModal && selectedRental && (
          <div className="rental-modal" onClick={() => setShowMoveOutModal(false)}>
            <div className="modal-content move-out-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Confirm Move-Out</h2>
                <button
                  className="close-btn"
                  onClick={() => setShowMoveOutModal(false)}
                >
                  ×
                </button>
              </div>

              <div className="modal-body">
                <div className="warning-section">
                  <AlertTriangle size={48} color="#ff9800" />
                  <h3>Please Inspect the Property</h3>
                  <p>
                    Before confirming move-out, please ensure you have:
                  </p>
                  <ul>
                    <li>Inspected the room for any damages</li>
                    <li>Verified all utilities are in order</li>
                    <li>Collected all keys and access cards</li>
                    <li>Documented the property condition</li>
                  </ul>
                </div>

                <div className="tenant-info-section">
                  <h4>Tenant: {selectedRental.tenantId?.firstName} {selectedRental.tenantId?.lastName}</h4>
                  <p>Room: {selectedRental.roomId?.title}</p>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  className="cancel-btn"
                  onClick={() => setShowMoveOutModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="confirm-move-out-btn"
                  onClick={() => handleConfirmMoveOut(selectedRental.agreementId._id)}
                >
                  <CheckCircle size={18} />
                  Confirm Move-Out
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default HostRentals;

