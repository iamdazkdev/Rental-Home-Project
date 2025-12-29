import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Calendar,
  MessageCircle,
  CheckCircle,
  XCircle,
  Clock,
  Home,
  User,
  Mail,
  AlertCircle,
  Search,
  Filter,
  RefreshCw,
  Eye
} from 'lucide-react';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState(null);

  const user = useSelector((state) => state.user);
  const navigate = useNavigate();

  // Get user ID - handle both _id and id formats
  const userId = user?._id || user?.id;

  useEffect(() => {
    console.log('🔍 HostRequests - User state:', user);
    console.log('🔍 HostRequests - User ID:', userId);
    if (userId) {
      fetchRequests();
    } else {
      setLoading(false);
      console.log('⚠️ No user logged in');
    }
  }, [userId, filter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      console.log('📤 Fetching requests for host:', userId);
      const response = await axios.get(
        `http://localhost:3001/room-rental/requests/host/${userId}`
      );

      console.log('📥 Host requests response:', response.data);

      let filtered = response.data.requests || [];
      if (filter !== 'all') {
        // Map filter to actual status values in database
        const statusMap = {
          'pending': 'REQUESTED',
          'approved': 'APPROVED',
          'rejected': 'REJECTED',
          'cancelled': 'CANCELLED'
        };
        const dbStatus = statusMap[filter] || filter.toUpperCase();
        filtered = filtered.filter(req => req.status === dbStatus);
      }

      setRequests(filtered);
    } catch (error) {
      console.error('❌ Error fetching requests:', error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    try {
      setProcessingId(requestId);
      await axios.put(`http://localhost:3001/room-rental/requests/${requestId}/approve`, {
        hostId: userId,
        houseRules: '', // Optional, can be added later
        noticePeriod: 30 // Default 30 days notice period
      });
      fetchRequests();
    } catch (error) {
      console.error('Error approving request:', error);
      alert(error.response?.data?.message || 'Failed to approve request');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    try {
      await axios.put(
        `http://localhost:3001/room-rental/requests/${selectedRequest._id}/reject`,
        {
          hostId: userId,
          rejectionReason: rejectionReason
        }
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

  const getStatusLabel = (status) => {
    const labels = {
      'REQUESTED': 'PENDING',
      'APPROVED': 'APPROVED',
      'REJECTED': 'REJECTED',
      'CANCELLED': 'CANCELLED'
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="host-requests-page">
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading requests...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (!userId) {
    return (
      <>
        <Navbar />
        <div className="host-requests-page">
          <div className="empty-state">
            <div className="empty-icon">
              <User size={48} />
            </div>
            <h3>Please Login</h3>
            <p>You need to be logged in to view rental requests.</p>
            <button className="btn-primary" onClick={() => navigate('/login')}>
              Go to Login
            </button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const filteredRequests = requests.filter(req => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      req.tenantId?.firstName?.toLowerCase().includes(searchLower) ||
      req.tenantId?.lastName?.toLowerCase().includes(searchLower) ||
      req.roomId?.title?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <>
      <Navbar />
      <div className="host-requests-page">
        <div className="page-header">
          <div className="header-content">
            <div className="header-icon">
              <Home size={32} />
            </div>
            <div className="header-text">
              <h1>Rental Requests</h1>
              <p>Manage incoming requests for your shared rooms</p>
            </div>
          </div>
          <div className="header-stats">
            <div className="stat-item">
              <span className="stat-value">{requests.length}</span>
              <span className="stat-label">Total Requests</span>
            </div>
            <div className="stat-item pending">
              <span className="stat-value">{requests.filter(r => r.status === 'REQUESTED').length}</span>
              <span className="stat-label">Pending</span>
            </div>
            <div className="stat-item approved">
              <span className="stat-value">{requests.filter(r => r.status === 'APPROVED').length}</span>
              <span className="stat-label">Approved</span>
            </div>
          </div>
        </div>

        <div className="controls-bar">
          <div className="search-box">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search by tenant name or room..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filters">
            {['all', 'pending', 'approved', 'rejected'].map(f => (
              <button
                key={f}
                className={`filter-btn ${filter === f ? 'active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f === 'all' && <Filter size={16} />}
                {f === 'pending' && <Clock size={16} />}
                {f === 'approved' && <CheckCircle size={16} />}
                {f === 'rejected' && <XCircle size={16} />}
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <button className="refresh-btn" onClick={fetchRequests}>
            <RefreshCw size={18} />
            Refresh
          </button>
        </div>

        {filteredRequests.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <MessageCircle size={64} />
            </div>
            <h3>No Requests Found</h3>
            <p>
              {searchTerm
                ? "No requests match your search criteria."
                : "You haven't received any rental requests yet."}
            </p>
            {searchTerm && (
              <button className="btn-secondary" onClick={() => setSearchTerm('')}>
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div className="requests-grid">
            {filteredRequests.map(request => (
              <div key={request._id} className={`request-card ${request.status?.toLowerCase()}`}>
                <div className="card-header">
                  <div className="tenant-info">
                    <img
                      src={request.tenantId?.profileImagePath || '/assets/default-avatar.png'}
                      alt={`${request.tenantId?.firstName} ${request.tenantId?.lastName}`}
                      className="tenant-avatar"
                    />
                    <div className="tenant-details">
                      <h3>{request.tenantId?.firstName} {request.tenantId?.lastName}</h3>
                      <p className="tenant-email">
                        <Mail size={14} />
                        {request.tenantId?.email}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`status-badge ${request.status?.toLowerCase()}`}
                  >
                    {request.status === 'REQUESTED' && <Clock size={14} />}
                    {request.status === 'APPROVED' && <CheckCircle size={14} />}
                    {request.status === 'REJECTED' && <XCircle size={14} />}
                    {getStatusLabel(request.status)}
                  </div>
                </div>

                <div className="room-info">
                  <Home size={18} />
                  <span>{request.roomId?.title || 'Room'}</span>
                </div>

                <div className="request-details">
                  <div className="detail-item">
                    <Calendar size={18} />
                    <div>
                      <span className="detail-label">Move-in Date</span>
                      <span className="detail-value">
                        {new Date(request.moveInDate).toLocaleDateString('en-US', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="detail-item">
                    <Clock size={18} />
                    <div>
                      <span className="detail-label">Stay Duration</span>
                      <span className="detail-value">{request.intendedStayDuration} months</span>
                    </div>
                  </div>
                </div>

                <div className="request-message">
                  <h4>
                    <MessageCircle size={16} />
                    Tenant's Message
                  </h4>
                  <p>{request.message || 'No message provided'}</p>
                </div>

                {request.status === 'REQUESTED' && (
                  <div className="request-actions">
                    <button
                      className="btn-approve"
                      onClick={() => handleApprove(request._id)}
                      disabled={processingId === request._id}
                    >
                      {processingId === request._id ? (
                        <>
                          <RefreshCw size={18} className="spinning" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle size={18} />
                          Approve
                        </>
                      )}
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
                      onClick={() => navigate(`/messages?userId=${request.tenantId?._id}`)}
                    >
                      <MessageCircle size={18} />
                      Chat
                    </button>
                  </div>
                )}

                {request.status === 'APPROVED' && (
                  <div className="status-notice approved">
                    <CheckCircle size={20} />
                    <div>
                      <span className="notice-title">Request Approved</span>
                      <span className="notice-text">Proceed to generate rental agreement</span>
                    </div>
                  </div>
                )}

                {request.status === 'REJECTED' && (
                  <div className="status-notice rejected">
                    <AlertCircle size={20} />
                    <div>
                      <span className="notice-title">Request Rejected</span>
                      {request.rejectionReason && (
                        <span className="notice-text">{request.rejectionReason}</span>
                      )}
                    </div>
                  </div>
                )}

                <div className="card-footer">
                  <span className="request-date">
                    Requested: {new Date(request.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                  <button
                    className="btn-view-details"
                    onClick={() => navigate(`/room-rental/rooms/${request.roomId?._id}`)}
                  >
                    <Eye size={16} />
                    View Room
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Reject Modal */}
        {showRejectModal && (
          <div className="modal-overlay" onClick={() => setShowRejectModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <div className="modal-icon reject">
                  <XCircle size={24} />
                </div>
                <h2>Reject Request</h2>
                <button className="modal-close" onClick={() => setShowRejectModal(false)}>
                  &times;
                </button>
              </div>

              <div className="modal-body">
                <div className="request-summary">
                  <img
                    src={selectedRequest?.tenantId?.profileImagePath || '/assets/default-avatar.png'}
                    alt="Tenant"
                    className="summary-avatar"
                  />
                  <div>
                    <p className="summary-name">
                      {selectedRequest?.tenantId?.firstName} {selectedRequest?.tenantId?.lastName}
                    </p>
                    <p className="summary-room">{selectedRequest?.roomId?.title}</p>
                  </div>
                </div>

                <p className="modal-description">
                  Please provide a reason for rejecting this rental request. This will be shared with the tenant.
                </p>

                <div className="form-group">
                  <label>Rejection Reason</label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="e.g., Room is no longer available, Schedule conflict, etc."
                    rows={4}
                  />
                </div>
              </div>

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
                  className="btn-submit reject"
                  onClick={handleReject}
                  disabled={!rejectionReason.trim()}
                >
                  <XCircle size={18} />
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

