import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import "../../styles/VerificationManagement.scss";
import Navbar from "../../components/Navbar";

const VerificationManagement = () => {
  const [verifications, setVerifications] = useState([]);
  const [filter, setFilter] = useState("all"); // all, pending, approved, rejected
  const [loading, setLoading] = useState(true);
  const [selectedVerification, setSelectedVerification] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [reviewAction, setReviewAction] = useState(""); // approve or reject
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);

  const user = useSelector((state) => state.user);
  const navigate = useNavigate();

  // Check admin access
  useEffect(() => {
    if (!user || user.email !== "admin@gmail.com") {
      navigate("/");
    }
  }, [user, navigate]);

  // Fetch verifications
  const fetchVerifications = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:3001/identity-verification/admin/all?status=${filter}`
      );

      if (response.ok) {
        const data = await response.json();
        setVerifications(data.verifications);
      }
    } catch (error) {
      console.error("Error fetching verifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.email === "admin@gmail.com") {
      fetchVerifications();
    }
  }, [filter, user]);

  // Open review modal
  const openReviewModal = (verification, action) => {
    setSelectedVerification(verification);
    setReviewAction(action);
    setShowModal(true);
    setRejectionReason("");
  };

  // Handle review submission
  const handleReview = async () => {
    if (reviewAction === "rejected" && !rejectionReason.trim()) {
      alert("Please provide a rejection reason");
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch(
        `http://localhost:3001/identity-verification/${selectedVerification._id}/review`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: reviewAction,
            rejectionReason: reviewAction === "rejected" ? rejectionReason : "",
            adminId: user._id,
          }),
        }
      );

      if (response.ok) {
        alert(`Verification ${reviewAction} successfully!`);
        setShowModal(false);
        fetchVerifications(); // Refresh list
      } else {
        throw new Error("Failed to review verification");
      }
    } catch (error) {
      console.error("Error reviewing verification:", error);
      alert("Failed to review verification");
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { icon: "⏳", text: "Pending", class: "pending" },
      approved: { icon: "✅", text: "Approved", class: "approved" },
      rejected: { icon: "❌", text: "Rejected", class: "rejected" },
    };
    return badges[status] || badges.pending;
  };

  return (
    <>
      <Navbar />
      <div className="verification-management">
        <div className="management-header">
          <h1>🔐 Identity Verification Management</h1>
          <p>Review and manage user identity verifications</p>
        </div>

        {/* Filters */}
        <div className="filter-tabs">
          <button
            className={filter === "all" ? "active" : ""}
            onClick={() => setFilter("all")}
          >
            All
          </button>
          <button
            className={filter === "pending" ? "active" : ""}
            onClick={() => setFilter("pending")}
          >
            ⏳ Pending
          </button>
          <button
            className={filter === "approved" ? "active" : ""}
            onClick={() => setFilter("approved")}
          >
            ✅ Approved
          </button>
          <button
            className={filter === "rejected" ? "active" : ""}
            onClick={() => setFilter("rejected")}
          >
            ❌ Rejected
          </button>
        </div>

        {/* Verifications List */}
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading verifications...</p>
          </div>
        ) : verifications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>No verifications found</h3>
            <p>No {filter !== "all" ? filter : ""} verifications at the moment.</p>
          </div>
        ) : (
          <div className="verifications-grid">
            {verifications.map((verification) => {
              const badge = getStatusBadge(verification.status);
              return (
                <div key={verification._id} className="verification-card">
                  <div className="card-header">
                    <div className="user-info">
                      <img
                        src={
                          verification.userId?.profileImagePath ||
                          "https://via.placeholder.com/60?text=User"
                        }
                        alt="User"
                        className="user-avatar"
                      />
                      <div>
                        <h3>
                          {verification.userId?.firstName}{" "}
                          {verification.userId?.lastName}
                        </h3>
                        <p className="user-email">{verification.userId?.email}</p>
                      </div>
                    </div>
                    <span className={`status-badge ${badge.class}`}>
                      {badge.icon} {badge.text}
                    </span>
                  </div>

                  <div className="card-body">
                    <div className="info-row">
                      <span className="label">📝 Full Name:</span>
                      <span className="value">{verification.fullName}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">📱 Phone:</span>
                      <span className="value">{verification.phoneNumber}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">🎂 Date of Birth:</span>
                      <span className="value">
                        {new Date(verification.dateOfBirth).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="info-row">
                      <span className="label">📅 Submitted:</span>
                      <span className="value">{formatDate(verification.submittedAt)}</span>
                    </div>

                    {/* ID Card Images */}
                    <div className="id-images">
                      <div className="id-image-box">
                        <p>Front Side</p>
                        <img
                          src={verification.idCardFront}
                          alt="ID Front"
                          onClick={() => window.open(verification.idCardFront, "_blank")}
                        />
                      </div>
                      <div className="id-image-box">
                        <p>Back Side</p>
                        <img
                          src={verification.idCardBack}
                          alt="ID Back"
                          onClick={() => window.open(verification.idCardBack, "_blank")}
                        />
                      </div>
                    </div>

                    {verification.status === "rejected" && verification.rejectionReason && (
                      <div className="rejection-info">
                        <strong>Rejection Reason:</strong>
                        <p>{verification.rejectionReason}</p>
                      </div>
                    )}
                  </div>

                  {verification.status === "pending" && (
                    <div className="card-actions">
                      <button
                        className="approve-btn"
                        onClick={() => openReviewModal(verification, "approved")}
                      >
                        ✅ Approve
                      </button>
                      <button
                        className="reject-btn"
                        onClick={() => openReviewModal(verification, "rejected")}
                      >
                        ❌ Reject
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Review Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>
                {reviewAction === "approved" ? "✅ Approve" : "❌ Reject"} Verification
              </h2>
              <p>
                User: <strong>{selectedVerification?.fullName}</strong>
              </p>

              {reviewAction === "rejected" && (
                <div className="form-group">
                  <label>Rejection Reason *</label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Please explain why this verification is rejected..."
                    rows={4}
                  />
                </div>
              )}

              <div className="modal-actions">
                <button
                  className="cancel-btn"
                  onClick={() => setShowModal(false)}
                  disabled={processing}
                >
                  Cancel
                </button>
                <button
                  className={reviewAction === "approved" ? "approve-btn" : "reject-btn"}
                  onClick={handleReview}
                  disabled={processing}
                >
                  {processing ? "Processing..." : `Confirm ${reviewAction}`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default VerificationManagement;

