import React, {useEffect, useState, useCallback} from "react";
import {useNavigate} from "react-router-dom";
import {useSelector} from "react-redux";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/common/Footer";
import API_BASE_URL from "../../config/api";
import "../../styles/RoommateRequests.scss";
import { toast } from "../../stores/useNotificationStore";


const MyRoommateRequests = () => {
    const navigate = useNavigate();
    const user = useSelector((state) => state.user.profile);
    const userId = user?._id || user?.id;

    const [activeTab, setActiveTab] = useState("sent");
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [selectedRequestId, setSelectedRequestId] = useState(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");

    const fetchRequests = useCallback(async () => {
        setLoading(true);
        try {
            const endpoint =
                activeTab === "sent"
                    ? `${API_BASE_URL}/roommate/requests/sent/${userId}`
                    : `${API_BASE_URL}/roommate/requests/received/${userId}`;

            const response = await fetch(endpoint);
            const data = await response.json();

            if (data.success) {
                setRequests(data.requests || []);
            }
        } catch (error) {
            console.error("❌ Error fetching requests:", error);
        } finally {
            setLoading(false);
        }
    }, [activeTab, userId]);

    useEffect(() => {
        if (!userId) {
            navigate("/login");
            return;
        }
        fetchRequests();
    }, [activeTab, userId, navigate, fetchRequests]);

    const handleAccept = async (requestId) => {
        try {
            const userId = user?._id || user?.id;
            const response = await fetch(
                `${API_BASE_URL}/roommate/requests/${requestId}/accept`,
                {
                    method: "PATCH",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify({userId}),
                }
            );

            const data = await response.json();

            if (data.success) {
                setSuccessMessage("✅ Request accepted! You are now matched.");
                setShowSuccessModal(true);
                fetchRequests();
            } else {
                toast.error(data.message || "Failed to accept request");
            }
        } catch (error) {
            console.error("❌ Error accepting request:", error);
            toast.error("Error accepting request");
        }
    };

    const handleReject = async (requestId) => {
        setSelectedRequestId(requestId);
        setShowRejectModal(true);
    };

    const confirmReject = async () => {
        try {
            const userId = user?._id || user?.id;
            const response = await fetch(
                `${API_BASE_URL}/roommate/requests/${selectedRequestId}/reject`,
                {
                    method: "PATCH",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify({userId, rejectionReason: rejectionReason || ""}),
                }
            );

            const data = await response.json();

            if (data.success) {
                setShowRejectModal(false);
                setRejectionReason("");
                setSuccessMessage("Request rejected successfully");
                setShowSuccessModal(true);
                fetchRequests();
            } else {
                toast.error(data.message || "Failed to reject request");
            }
        } catch (error) {
            console.error("❌ Error rejecting request:", error);
            toast.error("Error rejecting request");
        }
    };

    const handleViewPost = (postId) => {
        navigate(`/roommate/${postId}`);
    };

    const handleChat = (matchedUserId) => {
        // Navigate to messages with the matched user
        navigate("/messages", {
            state: {
                receiverId: matchedUserId,
            },
        });
    };

    if (loading) {
        return (
            <>
                <Navbar/>
                <div className="roommate-requests-container">
                    <div className="requests-page">
                        <h1>📬 My Roommate Requests</h1>
                        <div className="loading-state">
                            <div className="spinner"></div>
                            <p>Loading requests...</p>
                        </div>
                    </div>
                </div>
                <Footer/>
            </>
        );
    }

    return (
        <>
            <Navbar/>
            <div className="roommate-requests-container">
                <div className="requests-page">
                    <h1>📬 My Roommate Requests</h1>

                    <div className="tabs">
                        <button
                            className={activeTab === "sent" ? "active" : ""}
                            onClick={() => setActiveTab("sent")}
                        >
                            📤 Sent Requests
                        </button>
                        <button
                            className={activeTab === "received" ? "active" : ""}
                            onClick={() => setActiveTab("received")}
                        >
                            📥 Received Requests
                        </button>
                    </div>

                    {requests.length === 0 ? (
                        <div className="empty-state">
            <span className="icon">
              {activeTab === "sent" ? "📭" : "📪"}
            </span>
                            <h3>No {activeTab} requests</h3>
                            <p>
                                {activeTab === "sent"
                                    ? "You haven't sent any roommate requests yet"
                                    : "You haven't received any roommate requests yet"}
                            </p>
                            <button onClick={() => navigate("/roommate/search")}>
                                Find Roommates
                            </button>
                        </div>
                    ) : (
                        <div className="requests-list">
                            {requests.map((request) => (
                                <div key={request._id} className="request-card">
                                    <div className="request-header">
                                        <div className="user-info">
                                            <img
                                                src={
                                                    activeTab === "sent"
                                                        ? request.receiverId?.profileImagePath ||
                                                        "https://via.placeholder.com/50"
                                                        : request.senderId?.profileImagePath ||
                                                        "https://via.placeholder.com/50"
                                                }
                                                alt="User"
                                                onError={(e) => {
                                                    e.target.src = "https://via.placeholder.com/50";
                                                }}
                                            />
                                            <div>
                                                <h4>
                                                    {activeTab === "sent"
                                                        ? `${request.receiverId?.firstName} ${request.receiverId?.lastName}`
                                                        : `${request.senderId?.firstName} ${request.senderId?.lastName}`}
                                                </h4>
                                                <span className="date">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </span>
                                            </div>
                                        </div>
                                        <span className={`status-badge status-${request.status}`}>
                    {request.status}
                  </span>
                                    </div>

                                    <div
                                        className="post-info"
                                        onClick={() => handleViewPost(request.postId?._id)}
                                    >
                                        <h5>
                                            {request.postId?.postType === "SEEKER"
                                                ? "🔍 Looking for a place"
                                                : "🏠 Has a place"}
                                        </h5>
                                        <p>📍 {request.postId?.location || "N/A"}</p>
                                        <p>
                                            💰 Budget: {(request.postId?.budgetMin || 0).toLocaleString()} -{" "}
                                            {(request.postId?.budgetMax || 0).toLocaleString()} VND
                                        </p>
                                        <p>
                                            📅 Move-in:{" "}
                                            {request.postId?.moveInDate
                                                ? new Date(request.postId.moveInDate).toLocaleDateString()
                                                : "N/A"}
                                        </p>
                                    </div>

                                    <div className="message-box">
                                        <div className="message-label">📝 Message:</div>
                                        <div className="message-text">{request.message}</div>
                                    </div>

                                    {request.rejectionReason && (
                                        <div className="rejection-reason">
                                            <div className="reason-label">❌ Rejection Reason:</div>
                                            <p>{request.rejectionReason}</p>
                                        </div>
                                    )}

                                    {activeTab === "received" && request.status === "PENDING" && (
                                        <div className="request-actions">
                                            <button
                                                className="btn-accept"
                                                onClick={() => handleAccept(request._id)}
                                            >
                                                ✅ Accept
                                            </button>
                                            <button
                                                className="btn-reject"
                                                onClick={() => handleReject(request._id)}
                                            >
                                                ❌ Reject
                                            </button>
                                        </div>
                                    )}

                                    {request.status === "ACCEPTED" && (
                                        <div className="matched-info">
                                            <p>🎉 You are matched! Start chatting now.</p>
                                            <button
                                                onClick={() =>
                                                    handleChat(
                                                        activeTab === "sent"
                                                            ? request.receiverId._id
                                                            : request.senderId._id
                                                    )
                                                }
                                            >
                                                💬 Start Chat
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Reject Modal */}
                {showRejectModal && (
                    <div className="modal-overlay" onClick={() => setShowRejectModal(false)}>
                        <div className="modal-content reject-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>❌ Reject Request</h3>
                            </div>
                            <div className="modal-body">
                                <p>Please provide a reason for rejecting this request (optional):</p>
                                <textarea
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    placeholder="Your reason here..."
                                    rows={4}
                                    maxLength={500}
                                />
                                <small>{rejectionReason.length}/500 characters</small>
                            </div>
                            <div className="modal-actions">
                                <button
                                    className="btn-secondary"
                                    onClick={() => {
                                        setShowRejectModal(false);
                                        setRejectionReason("");
                                    }}
                                >
                                    Cancel
                                </button>
                                <button className="btn-reject" onClick={confirmReject}>
                                    Confirm Reject
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Success Modal */}
                {showSuccessModal && (
                    <div className="modal-overlay" onClick={() => setShowSuccessModal(false)}>
                        <div className="modal-content success-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="success-icon">✅</div>
                            <h3>Success!</h3>
                            <p>{successMessage}</p>
                            <button
                                className="btn-primary"
                                onClick={() => setShowSuccessModal(false)}
                            >
                                OK
                            </button>
                        </div>
                    </div>
                )}
            </div>
            <Footer/>
        </>
    );
};

export default MyRoommateRequests;
