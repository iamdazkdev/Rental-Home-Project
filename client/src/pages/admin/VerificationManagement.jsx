import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import "../../styles/VerificationManagement.scss";
import Navbar from "../../components/Navbar";
import VerificationReviewModal from "../../components/VerificationReviewModal";

const VerificationManagement = () => {
  const [verifications, setVerifications] = useState([]);
  const [filter, setFilter] = useState("all"); // all, pending, approved, rejected
  const [loading, setLoading] = useState(true);
  const [selectedVerification, setSelectedVerification] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [reviewAction, setReviewAction] = useState(""); // approve or reject
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);

  // Success/Error Modal State
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successModalType, setSuccessModalType] = useState(""); // approved or rejected
  const [successModalUserName, setSuccessModalUserName] = useState("");

  const user = useSelector((state) => state.user);
  const navigate = useNavigate();

  // Check admin access
  useEffect(() => {
    if (!user) {
      // User logged out, silently redirect
      navigate("/");
      return;
    }

    if (user.email !== "admin@gmail.com") {
      // User is not admin
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
        // Close review modal first
        setShowModal(false);

        // Show success modal
        setSuccessModalType(reviewAction);
        setSuccessModalUserName(selectedVerification.fullName);
        setShowSuccessModal(true);

        // Refresh list
        fetchVerifications();
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
            <div
              className={`modal-content ${reviewAction === "rejected" ? "rejection-modal" : "approval-modal"}`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Icon */}
              <div className={`modal-icon ${reviewAction === "rejected" ? "warning-icon" : "success-icon"}`}>
                {reviewAction === "approved" ? (
                  <span className="icon-emoji">✓</span>
                ) : (
                  <span className="icon-emoji">⚠</span>
                )}
              </div>

              <h2 className={reviewAction === "rejected" ? "rejection-title" : ""}>
                {reviewAction === "approved" ? "Approve Verification" : "Reject Verification"}
              </h2>

              <p className="modal-user-info">
                {reviewAction === "approved" ? (
                  <>
                    Are you sure you want to approve <strong>{selectedVerification?.fullName}</strong>'s identity verification?
                  </>
                ) : (
                  <>
                    You are about to reject <strong>{selectedVerification?.fullName}</strong>'s identity verification.
                  </>
                )}
              </p>

              {reviewAction === "rejected" && (
                <>
                  <div className="warning-box">
                    <span className="warning-icon-small">⚠️</span>
                    <p>This action will notify the user and allow them to resubmit their documents.</p>
                  </div>

                  <div className="form-group rejection-reason-group">
                    <label>
                      <span className="required-label">Rejection Reason</span>
                      <span className="char-counter">{rejectionReason.length}/500</span>
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Please provide a clear explanation why this verification is rejected. This will help the user understand what needs to be corrected..."
                      rows={5}
                      maxLength={500}
                      className={rejectionReason.trim() ? "has-content" : ""}
                    />
                    {!rejectionReason.trim() && (
                      <span className="field-hint">A detailed reason is required for rejection</span>
                    )}
                  </div>
                </>
              )}

              {reviewAction === "approved" && (
                <div className="info-box approval-info">
                  <p>✓ User will be able to create listings as a host</p>
                  <p>✓ Notification email will be sent automatically</p>
                </div>
              )}

              <div className="modal-actions">
                <button
                  className="cancel-btn"
                  onClick={() => setShowModal(false)}
                  disabled={processing}
                >
                  <span>Cancel</span>
                </button>
                <button
                  className={reviewAction === "approved" ? "approve-btn" : "reject-btn"}
                  onClick={handleReview}
                  disabled={processing || (reviewAction === "rejected" && !rejectionReason.trim())}
                >
                  {processing ? (
                    <>
                      <span className="spinner-small"></span>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      {reviewAction === "approved" ? "✓ Confirm Approval" : "✕ Confirm Rejection"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success/Error Modal */}
        {showSuccessModal && (
          <VerificationReviewModal
            type={successModalType}
            userName={successModalUserName}
            onClose={() => setShowSuccessModal(false)}
          />
        )}
      </div>
    </>
  );
};

export default VerificationManagement;

