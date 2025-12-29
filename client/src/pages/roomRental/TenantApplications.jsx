import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Calendar, CheckCircle, XCircle, FileText, AlertCircle } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import '../../styles/TenantApplications.scss';

// eslint-disable-next-line react-hooks/exhaustive-deps

const TenantApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const user = useSelector((state) => state.user);
  const navigate = useNavigate();

  useEffect(() => {
    if (user?._id) {
      fetchApplications();
    }
  }, [user?._id, filter]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `http://localhost:3001/room-rental/applications/tenant/${user._id}`
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
  };

  const handleAcceptOffer = async (appId) => {
    try {
      await axios.post(`http://localhost:3001/room-rental/applications/${appId}/accept-offer`);
      alert('Offer accepted! The host will be notified.');
      fetchApplications();
    } catch (error) {
      console.error('Error accepting offer:', error);
      alert(error.response?.data?.message || 'Failed to accept offer');
    }
  };

  const handleRejectOffer = async (appId) => {
    try {
      await axios.post(`http://localhost:3001/room-rental/applications/${appId}/reject-offer`);
      alert('Offer rejected');
      fetchApplications();
    } catch (error) {
      console.error('Error rejecting offer:', error);
      alert(error.response?.data?.message || 'Failed to reject offer');
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

  const getStatusLabel = (status) => {
    return status.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="tenant-applications-loading">
          <div className="loader"></div>
          <p>Loading your applications...</p>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="tenant-applications-page">
        <div className="page-header">
          <h1>My Applications</h1>
          <p>Track the status of your room rental applications</p>
        </div>

        <div className="filters">
          {['all', 'applied', 'under_review', 'interview_scheduled', 'offer_made', 'contracted', 'rejected'].map(f => (
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
            <FileText size={64} color="#9ca3af" />
            <h3>No Applications Found</h3>
            <p>
              {filter === 'all'
                ? 'You haven\'t submitted any applications yet.'
                : `No applications with status "${getStatusLabel(filter)}".`
              }
            </p>
            <button
              className="btn-primary"
              onClick={() => navigate('/room-rental/search')}
            >
              Browse Available Rooms
            </button>
          </div>
        ) : (
          <div className="applications-grid">
            {applications.map(app => (
              <div key={app._id} className="application-card">
                <div className="card-header">
                  <div className="property-info">
                    <img
                      src={app.listingId?.listingPhotoPaths?.[0] || '/assets/placeholder-room.jpg'}
                      alt={app.listingId?.title}
                      className="property-image"
                    />
                    <div>
                      <h3>{app.listingId?.title}</h3>
                      <p className="property-location">{app.listingId?.city}</p>
                    </div>
                  </div>
                  <div
                    className="status-badge"
                    style={{ background: getStatusColor(app.status) }}
                  >
                    {getStatusLabel(app.status)}
                  </div>
                </div>

                <div className="application-timeline">
                  <div className="timeline-item completed">
                    <div className="timeline-icon">
                      <CheckCircle size={16} />
                    </div>
                    <div className="timeline-content">
                      <h4>Applied</h4>
                      <p>{new Date(app.appliedAt).toLocaleString()}</p>
                    </div>
                  </div>

                  {app.interview?.scheduledDate && (
                    <div className={`timeline-item ${app.status === 'interview_completed' || app.status === 'offer_made' || app.status === 'contracted' ? 'completed' : 'pending'}`}>
                      <div className="timeline-icon">
                        <Calendar size={16} />
                      </div>
                      <div className="timeline-content">
                        <h4>Interview Scheduled</h4>
                        <p>{new Date(app.interview.scheduledDate).toLocaleString()}</p>
                        {app.interview.location && <p className="interview-location">📍 {app.interview.location}</p>}
                      </div>
                    </div>
                  )}

                  {app.offer && (
                    <div className={`timeline-item ${app.status === 'offer_accepted' || app.status === 'contracted' ? 'completed' : 'pending'}`}>
                      <div className="timeline-icon">
                        <FileText size={16} />
                      </div>
                      <div className="timeline-content">
                        <h4>Offer Received</h4>
                        <p>Monthly Rent: {app.offer.monthlyRent?.toLocaleString()} VND</p>
                        <p>Deposit: {app.offer.deposit?.toLocaleString()} VND</p>
                        <p>Move-in: {new Date(app.offer.moveInDate).toLocaleDateString()}</p>
                        <p>Lease: {app.offer.leaseTermMonths} months</p>
                      </div>
                    </div>
                  )}
                </div>

                {app.status === 'offer_made' && (
                  <div className="offer-actions">
                    <button
                      className="btn-accept"
                      onClick={() => handleAcceptOffer(app._id)}
                    >
                      <CheckCircle size={18} />
                      Accept Offer
                    </button>
                    <button
                      className="btn-reject"
                      onClick={() => handleRejectOffer(app._id)}
                    >
                      <XCircle size={18} />
                      Decline
                    </button>
                  </div>
                )}

                {app.status === 'rejected' && app.reviewNotes && (
                  <div className="rejection-notice">
                    <AlertCircle size={18} color="#ef4444" />
                    <div>
                      <h4>Application Rejected</h4>
                      <p>{app.reviewNotes}</p>
                    </div>
                  </div>
                )}

                {app.status === 'contracted' && (
                  <div className="success-notice">
                    <CheckCircle size={18} color="#10b981" />
                    <span>Congratulations! Your application was successful.</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default TenantApplications;

