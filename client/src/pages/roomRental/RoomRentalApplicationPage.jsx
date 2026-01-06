import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { CONFIG, HTTP_METHODS } from "../../constants/api";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import "../../styles/RoomRentalApplication.scss";

const RoomRentalApplicationPage = () => {
  const { listingId } = useParams();
  const navigate = useNavigate();
  const user = useSelector((state) => state.user);

  const [listing, setListing] = useState(null);
  const [compatibility, setCompatibility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    applicantNotes: "",
    currentEmployment: "",
    monthlyIncome: "",
    moveInReason: "",
    emergencyContact: {
      name: "",
      phone: "",
      relationship: "",
    },
  });

  useEffect(() => {
    fetchListingAndCompatibility();
    // eslint-disable-next-line
  }, [listingId]);

  const fetchListingAndCompatibility = async () => {
    try {
      // Fetch listing
      const listingRes = await fetch(
        `${CONFIG.API_BASE_URL}/listing/${listingId}`
      );
      const listingData = await listingRes.json();
      setListing(listingData);

      // Check compatibility
      const compatRes = await fetch(
        `${CONFIG.API_BASE_URL}/room-rental/compatibility/${listingId}/${user._id || user.id}`
      );
      const compatData = await compatRes.json();
      setCompatibility(compatData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith("emergencyContact.")) {
      const field = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        emergencyContact: {
          ...prev.emergencyContact,
          [field]: value,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!compatibility?.canApply) {
      alert("You cannot apply for this room due to compatibility issues");
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(`${CONFIG.API_BASE_URL}/room-rental/apply`, {
        method: HTTP_METHODS.POST,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId,
          applicantId: user._id || user.id,
          applicantNotes: formData.applicantNotes,
          tenantInfo: {
            currentEmployment: formData.currentEmployment,
            monthlyIncome: parseFloat(formData.monthlyIncome),
            moveInReason: formData.moveInReason,
            emergencyContact: formData.emergencyContact,
          },
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Application submitted successfully!");
        navigate(`/${user._id || user.id}/room-applications`);
      } else {
        alert(data.message || "Failed to submit application");
      }
    } catch (error) {
      console.error("Error submitting application:", error);
      alert("Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!listing) {
    return <div className="error">Listing not found</div>;
  }

  const getScoreClass = (score) => {
    if (score >= 90) return "excellent";
    if (score >= 75) return "good";
    if (score >= 60) return "fair";
    return "poor";
  };

  return (
    <>
      <Navbar />
      <div className="room-rental-application">
        <div className="application-container">
          {/* Listing Preview */}
          <div className="listing-preview">
            <img
              src={listing.listingPhotoPaths?.[0]}
              alt={listing.title}
            />
            <div className="listing-info">
              <h2>{listing.title}</h2>
              <p className="location">
                {listing.streetAddress}, {listing.city}
              </p>
              <p className="price">
                {listing.monthlyPrice?.toLocaleString("vi-VN")} VND/month
              </p>
            </div>
          </div>

          {/* Compatibility Score */}
          {compatibility && (
            <div className="compatibility-section">
              <h3>🤝 Compatibility Score</h3>
              <div className={`score-display ${getScoreClass(compatibility.compatibility?.score)}`}>
                <div className="score-circle">
                  <span className="score-number">
                    {compatibility.compatibility?.score}%
                  </span>
                </div>
                <div className="score-label">
                  {compatibility.compatibility?.recommendation === "excellent_match" && "Excellent Match! 🌟"}
                  {compatibility.compatibility?.recommendation === "good_match" && "Good Match ⭐"}
                  {compatibility.compatibility?.recommendation === "potential_match" && "Potential Match ✓"}
                  {compatibility.compatibility?.recommendation === "not_recommended" && "Low Compatibility"}
                </div>
              </div>

              {/* Deal Breakers Warning */}
              {compatibility.dealBreakers?.length > 0 && (
                <div className="deal-breakers-warning">
                  <h4>⚠️ Compatibility Issues:</h4>
                  <ul>
                    {compatibility.dealBreakers.map((db, idx) => (
                      <li key={idx}>{db.message}</li>
                    ))}
                  </ul>
                  <p className="warning-text">
                    You cannot apply due to these conflicts.
                  </p>
                </div>
              )}

              {/* Compatibility Breakdown */}
              {compatibility.canApply && (
                <div className="compatibility-breakdown">
                  <h4>Compatibility Breakdown:</h4>
                  <div className="breakdown-list">
                    <div className="breakdown-item">
                      <span>Sleep Schedule</span>
                      <div className="progress-bar">
                        <div
                          className="progress"
                          style={{
                            width: `${(compatibility.compatibility?.breakdown?.sleepSchedule / 20) * 100}%`,
                          }}
                        />
                      </div>
                      <span>{compatibility.compatibility?.breakdown?.sleepSchedule}/20</span>
                    </div>
                    <div className="breakdown-item">
                      <span>Smoking</span>
                      <div className="progress-bar">
                        <div
                          className="progress"
                          style={{
                            width: `${(compatibility.compatibility?.breakdown?.smoking / 25) * 100}%`,
                          }}
                        />
                      </div>
                      <span>{compatibility.compatibility?.breakdown?.smoking}/25</span>
                    </div>
                    <div className="breakdown-item">
                      <span>Cleanliness</span>
                      <div className="progress-bar">
                        <div
                          className="progress"
                          style={{
                            width: `${(compatibility.compatibility?.breakdown?.cleanliness / 15) * 100}%`,
                          }}
                        />
                      </div>
                      <span>{compatibility.compatibility?.breakdown?.cleanliness}/15</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Application Form */}
          {compatibility?.canApply && (
            <form className="application-form" onSubmit={handleSubmit}>
              <h3>📝 Application Details</h3>

              <div className="form-group">
                <label>Cover Letter *</label>
                <textarea
                  name="applicantNotes"
                  value={formData.applicantNotes}
                  onChange={handleChange}
                  placeholder="Tell the host about yourself and why you'd be a great roommate..."
                  rows={6}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Current Employment *</label>
                  <input
                    type="text"
                    name="currentEmployment"
                    value={formData.currentEmployment}
                    onChange={handleChange}
                    placeholder="e.g., Software Engineer at ABC Company"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Monthly Income (VND) *</label>
                  <input
                    type="number"
                    name="monthlyIncome"
                    value={formData.monthlyIncome}
                    onChange={handleChange}
                    placeholder="e.g., 20000000"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Reason for Moving *</label>
                <textarea
                  name="moveInReason"
                  value={formData.moveInReason}
                  onChange={handleChange}
                  placeholder="e.g., Relocating for work, starting university..."
                  rows={3}
                  required
                />
              </div>

              <h4>Emergency Contact</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    name="emergencyContact.name"
                    value={formData.emergencyContact.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Phone *</label>
                  <input
                    type="tel"
                    name="emergencyContact.phone"
                    value={formData.emergencyContact.phone}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Relationship *</label>
                  <input
                    type="text"
                    name="emergencyContact.relationship"
                    value={formData.emergencyContact.relationship}
                    onChange={handleChange}
                    placeholder="e.g., Parent, Sibling"
                    required
                  />
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => navigate(-1)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submitting}
                >
                  {submitting ? "Submitting..." : "Submit Application"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default RoomRentalApplicationPage;

