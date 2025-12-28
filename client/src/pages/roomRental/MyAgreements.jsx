import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { FileText, Calendar, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';
import Loader from '../../components/Loader';
import '../../styles/MyAgreements.scss';

const MyAgreements = () => {
  const [agreements, setAgreements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgreement, setSelectedAgreement] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const user = useSelector((state) => state.user);

  useEffect(() => {
    if (user?.id) {
      fetchAgreements();
    }
  }, [user?.id]);

  const fetchAgreements = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:3001/room-rental/agreements/tenant/${user.id || user._id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch agreements');

      const data = await response.json();
      setAgreements(data.agreements || []);
    } catch (error) {
      console.error('❌ Error fetching agreements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewAgreement = (agreement) => {
    setSelectedAgreement(agreement);
    setShowModal(true);
  };

  const handleAcceptAgreement = async (agreementId) => {
    if (!window.confirm('Do you accept this rental agreement?')) return;

    try {
      const response = await fetch(
        `http://localhost:3001/room-rental/agreements/${agreementId}/accept/tenant`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to accept agreement');

      alert('Agreement accepted successfully!');
      setShowModal(false);
      fetchAgreements();
    } catch (error) {
      console.error('❌ Error accepting agreement:', error);
      alert('Failed to accept agreement');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  if (loading) return <Loader />;

  return (
    <div className="my-agreements">
      <div className="agreements-header">
        <FileText size={36} />
        <h1>My Rental Agreements</h1>
        <p>View and manage your rental agreements</p>
      </div>

      {agreements.length === 0 ? (
        <div className="no-agreements">
          <FileText size={64} />
          <h3>No agreements yet</h3>
          <p>Agreements will appear here when hosts approve your requests</p>
        </div>
      ) : (
        <div className="agreements-grid">
          {agreements.map((agreement) => (
            <div key={agreement._id} className="agreement-card">
              <div className="card-header">
                <div className="agreement-info">
                  <h3>{agreement.roomId?.title || 'Room'}</h3>
                  <p className="location">
                    {agreement.roomId?.city}, {agreement.roomId?.province}
                  </p>
                </div>
                <div className={`status-badge ${agreement.status.toLowerCase()}`}>
                  {agreement.status}
                </div>
              </div>

              <div className="agreement-summary">
                <div className="summary-item">
                  <DollarSign size={18} />
                  <div>
                    <span className="label">Monthly Rent</span>
                    <span className="value">{formatCurrency(agreement.rentAmount)} VND</span>
                  </div>
                </div>

                <div className="summary-item">
                  <DollarSign size={18} />
                  <div>
                    <span className="label">Deposit</span>
                    <span className="value">{formatCurrency(agreement.depositAmount)} VND</span>
                  </div>
                </div>

                <div className="summary-item">
                  <Calendar size={18} />
                  <div>
                    <span className="label">Notice Period</span>
                    <span className="value">{agreement.noticePeriod} days</span>
                  </div>
                </div>
              </div>

              <div className="acceptance-status">
                <div className="acceptance-item">
                  {agreement.agreedByTenantAt ? (
                    <CheckCircle className="accepted" size={20} />
                  ) : (
                    <AlertCircle className="pending" size={20} />
                  )}
                  <span>
                    You:{' '}
                    {agreement.agreedByTenantAt
                      ? new Date(agreement.agreedByTenantAt).toLocaleDateString()
                      : 'Pending'}
                  </span>
                </div>

                <div className="acceptance-item">
                  {agreement.agreedByHostAt ? (
                    <CheckCircle className="accepted" size={20} />
                  ) : (
                    <AlertCircle className="pending" size={20} />
                  )}
                  <span>
                    Host:{' '}
                    {agreement.agreedByHostAt
                      ? new Date(agreement.agreedByHostAt).toLocaleDateString()
                      : 'Pending'}
                  </span>
                </div>
              </div>

              <div className="card-actions">
                <button
                  className="view-btn"
                  onClick={() => handleViewAgreement(agreement)}
                >
                  View Full Agreement
                </button>

                {agreement.status === 'DRAFT' && !agreement.agreedByTenantAt && (
                  <button
                    className="accept-btn"
                    onClick={() => handleAcceptAgreement(agreement._id)}
                  >
                    Accept Agreement
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && selectedAgreement && (
        <div className="agreement-modal" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Rental Agreement</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>

            <div className="modal-body">
              <section>
                <h3>Property Details</h3>
                <p><strong>Room:</strong> {selectedAgreement.roomId?.title}</p>
                <p><strong>Address:</strong> {selectedAgreement.roomId?.streetAddress}</p>
                <p><strong>City:</strong> {selectedAgreement.roomId?.city}, {selectedAgreement.roomId?.province}</p>
              </section>

              <section>
                <h3>Financial Terms</h3>
                <p><strong>Monthly Rent:</strong> {formatCurrency(selectedAgreement.rentAmount)} VND</p>
                <p><strong>Deposit Amount:</strong> {formatCurrency(selectedAgreement.depositAmount)} VND</p>
                <p><strong>Payment Method:</strong> {selectedAgreement.paymentMethod}</p>
              </section>

              <section>
                <h3>Agreement Terms</h3>
                <p><strong>Notice Period:</strong> {selectedAgreement.noticePeriod} days</p>
              </section>

              <section>
                <h3>House Rules</h3>
                <p>{selectedAgreement.houseRules || 'No specific rules provided'}</p>
              </section>

              <section>
                <h3>Digital Signatures</h3>
                <div className="signatures">
                  <div className="signature-item">
                    <strong>Tenant:</strong>
                    {selectedAgreement.agreedByTenantAt ? (
                      <span className="signed">
                        ✓ Signed on {new Date(selectedAgreement.agreedByTenantAt).toLocaleString()}
                      </span>
                    ) : (
                      <span className="unsigned">Not signed yet</span>
                    )}
                  </div>
                  <div className="signature-item">
                    <strong>Host:</strong>
                    {selectedAgreement.agreedByHostAt ? (
                      <span className="signed">
                        ✓ Signed on {new Date(selectedAgreement.agreedByHostAt).toLocaleString()}
                      </span>
                    ) : (
                      <span className="unsigned">Not signed yet</span>
                    )}
                  </div>
                </div>
              </section>
            </div>

            <div className="modal-footer">
              {selectedAgreement.status === 'DRAFT' && !selectedAgreement.agreedByTenantAt && (
                <button
                  className="accept-modal-btn"
                  onClick={() => handleAcceptAgreement(selectedAgreement._id)}
                >
                  Accept Agreement
                </button>
              )}
              <button className="close-modal-btn" onClick={() => setShowModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyAgreements;

