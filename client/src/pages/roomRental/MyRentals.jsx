import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Home, Calendar, DollarSign, AlertTriangle, LogOut, CheckCircle } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import Loader from '../../components/Loader';
import '../../styles/MyRentals.scss';

const MyRentals = () => {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTerminationModal, setShowTerminationModal] = useState(false);
  const [selectedRental, setSelectedRental] = useState(null);
  const [terminationReason, setTerminationReason] = useState('');
  const user = useSelector((state) => state.user);
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.id) {
      fetchRentals();
    }
  }, [user?.id]);

  const fetchRentals = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:3001/room-rental-advanced/status/tenant/${user.id || user._id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch rentals');

      const data = await response.json();
      setRentals(data.rentals || []);
    } catch (error) {
      console.error('❌ Error fetching rentals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmMoveIn = async (agreementId) => {
    if (!window.confirm('Confirm that you have moved in?')) return;

    try {
      const response = await fetch(
        `http://localhost:3001/room-rental/move-in/${agreementId}/confirm`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            confirmedBy: 'tenant',
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to confirm move-in');

      alert('Move-in confirmed successfully!');
      fetchRentals();
    } catch (error) {
      console.error('❌ Error confirming move-in:', error);
      alert('Failed to confirm move-in');
    }
  };

  const handleRequestTermination = async () => {
    if (!terminationReason.trim()) {
      alert('Please provide a reason for termination');
      return;
    }

    try {
      const response = await fetch(
        'http://localhost:3001/room-rental-advanced/termination/request',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            rentalStatusId: selectedRental._id,
            requestedBy: 'tenant',
            reason: terminationReason,
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to request termination');

      alert('Termination request submitted successfully!');
      setShowTerminationModal(false);
      setTerminationReason('');
      fetchRentals();
    } catch (error) {
      console.error('❌ Error requesting termination:', error);
      alert('Failed to request termination');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  const getStatusBadgeClass = (status) => {
    return status.toLowerCase().replace('_', '-');
  };

  if (loading) return <Loader />;

  return (
    <>
      <Navbar />
      <div className="my-rentals">
      <div className="rentals-header">
        <Home size={36} />
        <h1>My Active Rentals</h1>
        <p>Manage your current room rentals</p>
      </div>

      {rentals.length === 0 ? (
        <div className="no-rentals">
          <Home size={64} />
          <h3>No active rentals</h3>
          <p>You don't have any active rentals at the moment</p>
          <button className="search-btn" onClick={() => navigate('/room-rental')}>
            Search Rooms
          </button>
        </div>
      ) : (
        <div className="rentals-grid">
          {rentals.map((rental) => (
            <div key={rental._id} className="rental-card">
              <div className="card-header">
                <div className="room-info">
                  <h3>{rental.agreementId?.roomId?.title || 'Room'}</h3>
                  <p className="location">
                    {rental.agreementId?.roomId?.city}, {rental.agreementId?.roomId?.province}
                  </p>
                </div>
                <div className={`status-badge ${getStatusBadgeClass(rental.status)}`}>
                  {rental.status.replace('_', ' ')}
                </div>
              </div>

              {rental.agreementId?.roomId?.listingPhotoPaths?.[0] && (
                <div className="room-image">
                  <img
                    src={rental.agreementId.roomId.listingPhotoPaths[0]}
                    alt={rental.agreementId.roomId.title}
                  />
                </div>
              )}

              <div className="rental-details">
                <div className="detail-row">
                  <DollarSign size={18} />
                  <div>
                    <span className="label">Monthly Rent:</span>
                    <span className="value">
                      {formatCurrency(rental.agreementId?.rentAmount || 0)} VND
                    </span>
                  </div>
                </div>

                <div className="detail-row">
                  <Calendar size={18} />
                  <div>
                    <span className="label">Move-in Date:</span>
                    <span className="value">
                      {rental.moveInConfirmedAt
                        ? new Date(rental.moveInConfirmedAt).toLocaleDateString()
                        : 'Pending'}
                    </span>
                  </div>
                </div>

                {rental.status === 'TERMINATING' && (
                  <div className="detail-row termination-info">
                    <AlertTriangle size={18} />
                    <div>
                      <span className="label">Expected Move-out:</span>
                      <span className="value">
                        {new Date(rental.expectedMoveOutDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="move-in-status">
                <h4>Move-in Confirmation</h4>
                <div className="confirmations">
                  <div className="confirmation-item">
                    {rental.tenantMoveInConfirmed ? (
                      <CheckCircle className="confirmed" size={20} />
                    ) : (
                      <AlertTriangle className="pending" size={20} />
                    )}
                    <span>
                      You: {rental.tenantMoveInConfirmed ? 'Confirmed' : 'Pending'}
                    </span>
                  </div>
                  <div className="confirmation-item">
                    {rental.hostMoveInConfirmed ? (
                      <CheckCircle className="confirmed" size={20} />
                    ) : (
                      <AlertTriangle className="pending" size={20} />
                    )}
                    <span>
                      Host: {rental.hostMoveInConfirmed ? 'Confirmed' : 'Pending'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="card-actions">
                {rental.status === 'PENDING_MOVE_IN' && !rental.tenantMoveInConfirmed && (
                  <button
                    className="movein-btn"
                    onClick={() => handleConfirmMoveIn(rental.agreementId._id)}
                  >
                    Confirm Move-In
                  </button>
                )}

                {rental.status === 'ACTIVE' && (
                  <>
                    <button
                      className="payments-btn"
                      onClick={() => navigate('/room-rental/my-payments')}
                    >
                      View Payments
                    </button>
                    <button
                      className="terminate-btn"
                      onClick={() => {
                        setSelectedRental(rental);
                        setShowTerminationModal(true);
                      }}
                    >
                      <LogOut size={18} />
                      Request Termination
                    </button>
                  </>
                )}

                {rental.status === 'TERMINATING' && (
                  <div className="termination-notice">
                    <AlertTriangle size={20} />
                    <div>
                      <strong>Termination in Progress</strong>
                      <p>Expected move-out: {new Date(rental.expectedMoveOutDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showTerminationModal && (
        <div className="termination-modal" onClick={() => setShowTerminationModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Request Termination</h2>
              <button className="close-btn" onClick={() => setShowTerminationModal(false)}>
                ×
              </button>
            </div>

            <div className="modal-body">
              <p className="warning">
                <AlertTriangle size={20} />
                You will need to give a {selectedRental?.agreementId?.noticePeriod || 30} day notice before moving out.
              </p>

              <div className="form-group">
                <label>Reason for Termination *</label>
                <textarea
                  value={terminationReason}
                  onChange={(e) => setTerminationReason(e.target.value)}
                  placeholder="Please explain why you want to terminate the rental..."
                  rows={5}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowTerminationModal(false)}>
                Cancel
              </button>
              <button className="submit-btn" onClick={handleRequestTermination}>
                Submit Request
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

export default MyRentals;

