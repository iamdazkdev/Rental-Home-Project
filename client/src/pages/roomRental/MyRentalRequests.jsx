import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Home, Calendar, MessageSquare, X, Clock, CheckCircle, XCircle } from 'lucide-react';
import Loader from '../../components/Loader';
import '../../styles/MyRentalRequests.scss';

const MyRentalRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // ALL, REQUESTED, APPROVED, REJECTED
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
        `http://localhost:3001/room-rental/requests/tenant/${user.id || user._id}`,
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

  const handleCancelRequest = async (requestId) => {
    if (!window.confirm('Are you sure you want to cancel this request?')) return;

    try {
      const response = await fetch(
        `http://localhost:3001/room-rental/requests/${requestId}/cancel`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to cancel request');

      alert('Request cancelled successfully');
      fetchRequests();
    } catch (error) {
      console.error('❌ Error cancelling request:', error);
      alert('Failed to cancel request');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'REQUESTED':
        return <Clock className="status-icon pending" />;
      case 'APPROVED':
        return <CheckCircle className="status-icon approved" />;
      case 'REJECTED':
        return <XCircle className="status-icon rejected" />;
      case 'CANCELLED':
        return <X className="status-icon cancelled" />;
      default:
        return null;
    }
  };

  const getStatusClass = (status) => {
    return status.toLowerCase();
  };

  const filteredRequests = requests.filter((req) => {
    if (filter === 'ALL') return true;
    return req.status === filter;
  });

  if (loading) return <Loader />;

  return (
    <div className="my-rental-requests">
      <div className="requests-header">
        <div className="header-content">
          <Home className="header-icon" />
          <h1>My Room Rental Requests</h1>
        </div>
        <p className="header-subtitle">
          Track your rental requests and their status
        </p>
      </div>

      <div className="filter-tabs">
        <button
          className={filter === 'ALL' ? 'active' : ''}
          onClick={() => setFilter('ALL')}
        >
          All ({requests.length})
        </button>
        <button
          className={filter === 'REQUESTED' ? 'active' : ''}
          onClick={() => setFilter('REQUESTED')}
        >
          Pending ({requests.filter((r) => r.status === 'REQUESTED').length})
        </button>
        <button
          className={filter === 'APPROVED' ? 'active' : ''}
          onClick={() => setFilter('APPROVED')}
        >
          Approved ({requests.filter((r) => r.status === 'APPROVED').length})
        </button>
        <button
          className={filter === 'REJECTED' ? 'active' : ''}
          onClick={() => setFilter('REJECTED')}
        >
          Rejected ({requests.filter((r) => r.status === 'REJECTED').length})
        </button>
      </div>

      {filteredRequests.length === 0 ? (
        <div className="no-requests">
          <Home size={64} />
          <h3>No requests found</h3>
          <p>Start searching for rooms to send your first request</p>
          <button
            className="primary-btn"
            onClick={() => navigate('/room-rental')}
          >
            Search Rooms
          </button>
        </div>
      ) : (
        <div className="requests-grid">
          {filteredRequests.map((request) => (
            <div key={request._id} className="request-card">
              <div className="card-header">
                <div className="room-info">
                  <h3>{request.roomId?.title || 'Room'}</h3>
                  <p className="location">
                    {request.roomId?.city}, {request.roomId?.province}
                  </p>
                </div>
                <div className={`status-badge ${getStatusClass(request.status)}`}>
                  {getStatusIcon(request.status)}
                  <span>{request.status}</span>
                </div>
              </div>

              {request.roomId?.listingPhotoPaths?.[0] && (
                <div className="room-image">
                  <img
                    src={request.roomId.listingPhotoPaths[0]}
                    alt={request.roomId.title}
                  />
                </div>
              )}

              <div className="request-details">
                <div className="detail-row">
                  <Calendar size={18} />
                  <span>
                    Move-in: {new Date(request.moveInDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="detail-row">
                  <Clock size={18} />
                  <span>Duration: {request.intendedStayDuration} months</span>
                </div>
                <div className="detail-row">
                  <MessageSquare size={18} />
                  <span>
                    Submitted:{' '}
                    {new Date(request.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="request-message">
                <h4>Your Message:</h4>
                <p>{request.message}</p>
              </div>

              {request.rejectionReason && (
                <div className="rejection-reason">
                  <h4>Rejection Reason:</h4>
                  <p>{request.rejectionReason}</p>
                </div>
              )}

              <div className="card-actions">
                <button
                  className="view-btn"
                  onClick={() => navigate(`/room-rental/${request.roomId?._id}`)}
                >
                  View Room
                </button>

                {request.status === 'REQUESTED' && (
                  <button
                    className="cancel-btn"
                    onClick={() => handleCancelRequest(request._id)}
                  >
                    Cancel Request
                  </button>
                )}

                {request.status === 'APPROVED' && (
                  <button
                    className="agreement-btn"
                    onClick={() => navigate('/room-rental/my-agreements')}
                  >
                    View Agreement
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyRentalRequests;

