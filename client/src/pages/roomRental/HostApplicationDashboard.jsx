import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  FileText,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import '../../styles/HostApplicationDashboard.scss';

const HostApplicationDashboard = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedApp, setSelectedApp] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);

  const user = useSelector((state) => state.user);
  const navigate = useNavigate();

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `http://localhost:3001/room-rental/applications/host/${user._id}`
      );

      let filtered = response.data.applications;
      if (filter !== 'all') {
        filtered = filtered.filter(app => app.status === filter);
      }

      setApplications(filtered);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  }, [user?._id, filter]);

  useEffect(() => {
    if (user?._id) {
      fetchApplications();
    }
  }, [user?._id, filter, fetchApplications]);

  const handleReview = async (appId, decision, notes) => {
    try {
      await axios.post(
        `http://localhost:3001/room-rental/applications/${appId}/review`,
        { decision, notes }
      );
      setShowReviewModal(false);
      fetchApplications();
    } catch (error) {
      console.error('Error reviewing application:', error);
      alert(error.response?.data?.message || 'Failed to review application');
    }
  };

  const handleScheduleInterview = async (appId, interviewData) => {
    try {
      await axios.post(
        `http://localhost:3001/room-rental/applications/${appId}/schedule-interview`,
        interviewData
      );
      setShowInterviewModal(false);
      fetchApplications();
    } catch (error) {
      console.error('Error scheduling interview:', error);
      alert(error.response?.data?.message || 'Failed to schedule interview');
    }
  };

  const handleMakeOffer = async (appId, offerData) => {
    try {
      await axios.post(
        `http://localhost:3001/room-rental/applications/${appId}/make-offer`,
        offerData
      );
      setShowOfferModal(false);
      fetchApplications();
    } catch (error) {
      console.error('Error making offer:', error);
      alert(error.response?.data?.message || 'Failed to make offer');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      applied: '#3b82f6',
      under_review: '#f59e0b',
      interview_scheduled: '#8b5cf6',
      interview_completed: '#06b6d4',
      offer_made: '#10b981',
      offer_accepted: '#059669',
      contract_sent: '#6366f1',
      contracted: '#22c55e',
      rejected: '#ef4444',
      withdrawn: '#6b7280'
    };
    return colors[status] || '#6b7280';
  };

  const getCompatibilityColor = (score) => {
    if (score >= 90) return '#10b981';
    if (score >= 75) return '#3b82f6';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const getStatusLabel = (status) => {
    return status.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="host-dashboard-loading">
          <div className="loader"></div>
          <p>Loading applications...</p>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="host-application-dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Room Rental Applications</h1>
          <p className="subtitle">Manage applications for your shared rooms</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#3b82f6' }}>
              <FileText size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-value">
                {applications.filter(a => a.status === 'applied').length}
              </div>
              <div className="stat-label">New Applications</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#8b5cf6' }}>
              <Calendar size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-value">
                {applications.filter(a => a.status === 'interview_scheduled').length}
              </div>
              <div className="stat-label">Interviews Scheduled</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#10b981' }}>
              <TrendingUp size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-value">
                {applications.filter(a => a.status === 'offer_made').length}
              </div>
              <div className="stat-label">Offers Pending</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#22c55e' }}>
              <CheckCircle size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-value">
                {applications.filter(a => a.status === 'contracted').length}
              </div>
              <div className="stat-label">Contracted</div>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="filters">
          {['all', 'applied', 'under_review', 'interview_scheduled', 'offer_made', 'contracted'].map(f => (
            <button
              key={f}
              className={`filter-btn ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'All' : getStatusLabel(f)}
            </button>
          ))}
        </div>

        {applications.length === 0 ? (
          <div className="empty-state">
            <AlertCircle size={64} color="#9ca3af" />
            <h3>No Applications Found</h3>
            <p>
              {filter === 'all'
                ? 'You haven\'t received any applications yet.'
                : `No applications with status "${getStatusLabel(filter)}".`
              }
            </p>
          </div>
        ) : (
          <div className="applications-grid">
            {applications.map(app => (
              <div key={app._id} className="application-card">
                <div className="card-header">
                  <div className="applicant-info">
                    <img
                      src={app.tenantId.profileImagePath || '/assets/default-avatar.png'}
                      alt={`${app.tenantId.firstName} ${app.tenantId.lastName}`}
                      className="applicant-avatar"
                    />
                    <div>
                      <h3>{app.tenantId.firstName} {app.tenantId.lastName}</h3>
                      <p className="property-name">{app.listingId.title}</p>
                    </div>
                  </div>
                  <div
                    className="status-badge"
                    style={{ background: getStatusColor(app.status) }}
                  >
                    {getStatusLabel(app.status)}
                  </div>
                </div>

                <div className="compatibility-section">
                  <div className="compatibility-header">
                    <span>Compatibility Score</span>
                    <span
                      className="score-value"
                      style={{ color: getCompatibilityColor(app.compatibilityScore) }}
                    >
                      {app.compatibilityScore}%
                    </span>
                  </div>
                  <div className="compatibility-bar">
                    <div
                      className="compatibility-fill"
                      style={{
                        width: `${app.compatibilityScore}%`,
                        background: getCompatibilityColor(app.compatibilityScore)
                      }}
                    />
                  </div>
                </div>

                <div className="application-details">
                  <div className="detail-row">
                    <Clock size={16} />
                    <span>Applied: {new Date(app.appliedAt).toLocaleDateString()}</span>
                  </div>

                  {app.interview?.scheduledDate && (
                    <div className="detail-row">
                      <Calendar size={16} />
                      <span>Interview: {new Date(app.interview.scheduledDate).toLocaleString()}</span>
                    </div>
                  )}

                  {app.offer?.monthlyRent && (
                    <div className="detail-row">
                      <span>💰</span>
                      <span>Offered: {app.offer.monthlyRent.toLocaleString()} VND/month</span>
                    </div>
                  )}
                </div>

                <div className="card-actions">
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      setSelectedApp(app);
                      navigate(`/properties/${app.listingId._id}`);
                    }}
                  >
                    View Details
                  </button>

                  {app.status === 'applied' && (
                    <button
                      className="btn-primary"
                      onClick={() => {
                        setSelectedApp(app);
                        setShowReviewModal(true);
                      }}
                    >
                      Review
                    </button>
                  )}

                  {app.status === 'under_review' && (
                    <button
                      className="btn-primary"
                      onClick={() => {
                        setSelectedApp(app);
                        setShowInterviewModal(true);
                      }}
                    >
                      Schedule Interview
                    </button>
                  )}

                  {app.status === 'interview_completed' && (
                    <button
                      className="btn-primary"
                      onClick={() => {
                        setSelectedApp(app);
                        setShowOfferModal(true);
                      }}
                    >
                      Make Offer
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {showReviewModal && selectedApp && (
        <ReviewModal
          application={selectedApp}
          onClose={() => setShowReviewModal(false)}
          onSubmit={handleReview}
        />
      )}

      {/* Interview Modal */}
      {showInterviewModal && selectedApp && (
        <InterviewModal
          application={selectedApp}
          onClose={() => setShowInterviewModal(false)}
          onSubmit={handleScheduleInterview}
        />
      )}

      {/* Offer Modal */}
      {showOfferModal && selectedApp && (
        <OfferModal
          application={selectedApp}
          onClose={() => setShowOfferModal(false)}
          onSubmit={handleMakeOffer}
        />
      )}
      </div>
      <Footer />
    </>
  );
};

// Review Modal Component
const ReviewModal = ({ application, onClose, onSubmit }) => {
  const [decision, setDecision] = useState('');
  const [notes, setNotes] = useState('');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2>Review Application</h2>
        <p>Applicant: {application.tenantId.firstName} {application.tenantId.lastName}</p>

        <div className="form-group">
          <label>Decision *</label>
          <div className="decision-buttons">
            <button
              className={`decision-btn approve ${decision === 'approve' ? 'active' : ''}`}
              onClick={() => setDecision('approve')}
            >
              <CheckCircle size={20} />
              Approve for Interview
            </button>
            <button
              className={`decision-btn reject ${decision === 'reject' ? 'active' : ''}`}
              onClick={() => setDecision('reject')}
            >
              <XCircle size={20} />
              Reject
            </button>
          </div>
        </div>

        <div className="form-group">
          <label>Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes about this applicant..."
            rows={4}
          />
        </div>

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn-primary"
            onClick={() => onSubmit(application._id, decision, notes)}
            disabled={!decision}
          >
            Submit Review
          </button>
        </div>
      </div>
    </div>
  );
};

// Interview Modal Component
const InterviewModal = ({ application, onClose, onSubmit }) => {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    const scheduledDate = new Date(`${date}T${time}`);
    onSubmit(application._id, { scheduledDate, location, notes });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2>Schedule Interview</h2>

        <div className="form-group">
          <label>Date *</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
          />
        </div>

        <div className="form-group">
          <label>Time *</label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Location *</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g., Property address, Zoom link, etc."
          />
        </div>

        <div className="form-group">
          <label>Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any special instructions..."
            rows={3}
          />
        </div>

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn-primary"
            onClick={handleSubmit}
            disabled={!date || !time || !location}
          >
            Schedule Interview
          </button>
        </div>
      </div>
    </div>
  );
};

// Offer Modal Component
const OfferModal = ({ application, onClose, onSubmit }) => {
  const [monthlyRent, setMonthlyRent] = useState(application.listingId.price || 0);
  const [deposit, setDeposit] = useState(monthlyRent);
  const [moveInDate, setMoveInDate] = useState('');
  const [leaseTermMonths, setLeaseTermMonths] = useState(12);
  const [terms, setTerms] = useState('');

  const handleSubmit = () => {
    onSubmit(application._id, {
      monthlyRent,
      deposit,
      moveInDate: new Date(moveInDate),
      leaseTermMonths,
      terms
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={e => e.stopPropagation()}>
        <h2>Make Offer</h2>

        <div className="form-row">
          <div className="form-group">
            <label>Monthly Rent (VND) *</label>
            <input
              type="number"
              value={monthlyRent}
              onChange={(e) => setMonthlyRent(Number(e.target.value))}
              min={0}
            />
          </div>

          <div className="form-group">
            <label>Security Deposit (VND) *</label>
            <input
              type="number"
              value={deposit}
              onChange={(e) => setDeposit(Number(e.target.value))}
              min={0}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Move-in Date *</label>
            <input
              type="date"
              value={moveInDate}
              onChange={(e) => setMoveInDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="form-group">
            <label>Lease Term (Months) *</label>
            <select
              value={leaseTermMonths}
              onChange={(e) => setLeaseTermMonths(Number(e.target.value))}
            >
              <option value={6}>6 months</option>
              <option value={12}>12 months</option>
              <option value={24}>24 months</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Additional Terms</label>
          <textarea
            value={terms}
            onChange={(e) => setTerms(e.target.value)}
            placeholder="Any additional terms or conditions..."
            rows={4}
          />
        </div>

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn-primary"
            onClick={handleSubmit}
            disabled={!monthlyRent || !deposit || !moveInDate}
          >
            Send Offer
          </button>
        </div>
      </div>
    </div>
  );
};

export default HostApplicationDashboard;

