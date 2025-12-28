import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Home, Calendar, MessageSquare, Check, X, User } from 'lucide-react';
import Loader from '../../components/Loader';
import '../../styles/HostRequests.scss';

const HostRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [houseRules, setHouseRules] = useState('');
  const [noticePeriod, setNoticePeriod] = useState(30);
  const user = useSelector((state) => state.user);
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.id) {
      fetchRequests();
    }
  }, [user?.id]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:3001/room-rental/requests/host/${user.id || user._id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch requests');

      const data = await response.json();
      setRequests(data.requests || []);
    } catch (error) {
      console.error('❌ Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    if (!houseRules.trim()) {
      alert('Please provide house rules before approving');
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:3001/room-rental/requests/${requestId}/approve`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            hostId: user.id || user._id,
            houseRules,
            noticePeriod: parseInt(noticePeriod),
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to approve request');

      alert('Request approved! Agreement has been created.');
      setHouseRules('');
      setNoticePeriod(30);
      fetchRequests();
    } catch (error) {
      console.error('❌ Error approving request:', error);
      alert('Failed to approve request');
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:3001/room-rental/requests/${selectedRequest._id}/reject`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            rejectionReason,
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to reject request');

      alert('Request rejected successfully');
      setShowRejectModal(false);
      setRejectionReason('');
      setSelectedRequest(null);
      fetchRequests();
    } catch (error) {
      console.error('❌ Error rejecting request:', error);
      alert('Failed to reject request');
    }
  };

  const pendingRequests = requests.filter((r) => r.status === 'REQUESTED');

  if (loading) return <Loader />;

  return (
    <div className="host-requests">
      <div className="requests-header">
        <Home size={36} />
        <h1>Rental Requests</h1>
        <p>Review and manage incoming room rental requests</p>
      </div>

      {pendingRequests.length === 0 ? (
        <div className="no-requests">
          <Home size={64} />
          <h3>No pending requests</h3>
          <p>New rental requests will appear here</p>
        </div>
      ) : (
        <div className="requests-grid">
          {pendingRequests.map((request) => (
            <div key={request._id} className="request-card">
              <div className="card-header">
                <div className="tenant-info">
                  {request.tenantId?.profileImagePath && (
                    <img
                      src={request.tenantId.profileImagePath}
                      alt={`${request.tenantId.firstName} ${request.tenantId.lastName}`}
                      className="tenant-avatar"
                    />
                  )}
                  <div>
                    <h3>
                      {request.tenantId?.firstName} {request.tenantId?.lastName}
                    </h3>
                    <p className="tenant-email">{request.tenantId?.email}</p>
                  </div>
                </div>
                <div className="room-name">
                  <Home size={18} />
                  <span>{request.roomId?.title}</span>
                </div>
              </div>

              <div className="request-details">
                <div className="detail-row">
                  <Calendar size={18} />
                  <span>
                    Move-in: {new Date(request.moveInDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="detail-row">
                  <Calendar size={18} />
                  <span>Duration: {request.intendedStayDuration} months</span>
                </div>
                <div className="detail-row">
                  <Calendar size={18} />
                  <span>
                    Requested: {new Date(request.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="tenant-message">
                <h4>Message from Tenant:</h4>
                <p>{request.message}</p>
              </div>

              <div className="approval-section">
                <h4>Agreement Terms:</h4>
                <div className="form-group">
                  <label>House Rules *</label>
                  <textarea
                    value={houseRules}
                    onChange={(e) => setHouseRules(e.target.value)}
                    placeholder="Enter house rules (e.g., no smoking, quiet hours, etc.)"
                    rows={3}
                  />
                </div>
                <div className="form-group">
                  <label>Notice Period (days) *</label>
                  <input
                    type="number"
                    value={noticePeriod}
                    onChange={(e) => setNoticePeriod(e.target.value)}
                    min="7"
                    max="90"
                  />
                </div>
              </div>

              <div className="card-actions">
                <button
                  className="chat-btn"
                  onClick={() => navigate(`/messages?userId=${request.tenantId._id}`)}
                >
                  <MessageSquare size={18} />
                  Chat with Tenant
                </button>
                <button
                  className="approve-btn"
                  onClick={() => handleApprove(request._id)}
                >
                  <Check size={18} />
                  Approve
                </button>
                <button
                  className="reject-btn"
                  onClick={() => {
                    setSelectedRequest(request);
                    setShowRejectModal(true);
                  }}
                >
                  <X size={18} />
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showRejectModal && (
        <div className="reject-modal" onClick={() => setShowRejectModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Reject Request</h2>
              <button className="close-btn" onClick={() => setShowRejectModal(false)}>
                ×
              </button>
            </div>

            <div className="modal-body">
              <p className="info-text">
                Please provide a reason for rejecting this request. The tenant will be
                notified.
              </p>
              <div className="form-group">
                <label>Reason for Rejection *</label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explain why you're rejecting this request..."
                  rows={5}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowRejectModal(false)}>
                Cancel
              </button>
              <button className="submit-btn" onClick={handleReject}>
                Reject Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HostRequests;

