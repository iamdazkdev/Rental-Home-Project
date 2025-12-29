import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Calendar, MessageCircle, CheckCircle, XCircle, Clock } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import '../../styles/HostRequests.scss';

const HostRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const user = useSelector((state) => state.user);
  const navigate = useNavigate();

  useEffect(() => {
    if (user?._id) {
      fetchRequests();
    }
  }, [user?._id, filter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `http://localhost:3001/room-rental/requests/host/${user._id}`
      );

      let filtered = response.data.requests;
      if (filter !== 'all') {
        filtered = filtered.filter(req => req.status === filter);
      }

      setRequests(filtered);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    try {
      await axios.post(`http://localhost:3001/room-rental/requests/${requestId}/approve`);
      alert('Request approved successfully!');
      fetchRequests();
    } catch (error) {
      console.error('Error approving request:', error);
      alert(error.response?.data?.message || 'Failed to approve request');
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    try {
      await axios.post(
        `http://localhost:3001/room-rental/requests/${selectedRequest._id}/reject`,
        { reason: rejectionReason }
      );
      alert('Request rejected');
      setShowRejectModal(false);
      setRejectionReason('');
      setSelectedRequest(null);
      fetchRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert(error.response?.data?.message || 'Failed to reject request');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#f59e0b',
      approved: '#10b981',
      rejected: '#ef4444'
    };
    return colors[status] || '#6b7280';
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="host-requests-loading">
          <div className="loader"></div>
          <p>Loading requests...</p>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="host-requests-page">
        <div className="page-header">
          <h1>Rental Requests</h1>
          <p>Manage incoming requests for your shared rooms</p>
        </div>

        <div className="filters">
          {['all', 'pending', 'approved', 'rejected'].map(f => (
            <button
              key={f}
              className={`filter-btn ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {requests.length === 0 ? (
          <div className="empty-state">
            <MessageCircle size={64} color="#9ca3af" />
            <h3>No Requests Found</h3>
            <p>You haven't received any rental requests yet.</p>
          </div>
        ) : (
          <div className="requests-list">
            {requests.map(request => (
              <div key={request._id} className="request-card">
                <div className="request-header">
                  <div className="tenant-info">
                    <img
                      src={request.tenantId?.profileImagePath || '/assets/default-avatar.png'}
                      alt={`${request.tenantId?.firstName} ${request.tenantId?.lastName}`}
                      className="tenant-avatar"
                    />
                    <div>
                      <h3>{request.tenantId?.firstName} {request.tenantId?.lastName}</h3>
                      <p className="room-name">{request.roomId?.title}</p>
                    </div>
                  </div>
                  <div
                    className="status-badge"
                    style={{ background: getStatusColor(request.status) }}
                  >
                    {request.status.toUpperCase()}
                  </div>
                </div>

                <div className="request-details">
                  <div className="detail-item">
                    <Calendar size={16} />
                    <span>Move-in: {new Date(request.moveInDate).toLocaleDateString()}</span>
                  </div>
                  <div className="detail-item">
                    <Clock size={16} />
                    <span>Duration: {request.intendedStayDuration} months</span>
                  </div>
                </div>

                <div className="request-message">
                  <h4>Message:</h4>
                  <p>{request.message}</p>
                </div>

                {request.status === 'pending' && (
                  <div className="request-actions">
                    <button
                      className="btn-approve"
                      onClick={() => handleApprove(request._id)}
                    >
                      <CheckCircle size={18} />
                      Approve
                    </button>
                    <button
                      className="btn-reject"
                      onClick={() => {
                        setSelectedRequest(request);
                        setShowRejectModal(true);
                      }}
                    >
                      <XCircle size={18} />
                      Reject
                    </button>
                    <button
                      className="btn-chat"
                      onClick={() => navigate(`/messages?userId=${request.tenantId._id}`)}
                    >
                      <MessageCircle size={18} />
                      Chat
                    </button>
                  </div>
                )}

                {request.status === 'approved' && (
                  <div className="approved-notice">
                    <CheckCircle size={18} color="#10b981" />
                    <span>Approved - Proceed to agreement generation</span>
                  </div>
                )}

                {request.status === 'rejected' && request.rejectionReason && (
                  <div className="rejection-reason">
                    <h4>Rejection Reason:</h4>
                    <p>{request.rejectionReason}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Reject Modal */}
        {showRejectModal && (
          <div className="modal-overlay" onClick={() => setShowRejectModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <h2>Reject Request</h2>
              <p>Please provide a reason for rejecting this request:</p>

              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Reason for rejection..."
                rows={4}
                className="rejection-textarea"
              />

              <div className="modal-actions">
                <button
                  className="btn-cancel"
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectionReason('');
                    setSelectedRequest(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  className="btn-submit"
                  onClick={handleReject}
                  disabled={!rejectionReason.trim()}
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default HostRequests;

