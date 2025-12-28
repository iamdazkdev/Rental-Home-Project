import React, { useState, useRef, useEffect } from "react";
import "../styles/IdentityVerification.scss";

const IdentityVerificationForm = ({ userId, onSuccess, existingVerification }) => {
  const [formData, setFormData] = useState({
    fullName: existingVerification?.fullName || "",
    phoneNumber: existingVerification?.phoneNumber || "",
    dateOfBirth: existingVerification?.dateOfBirth
      ? new Date(existingVerification.dateOfBirth).toISOString().split("T")[0]
      : "",
  });

  const [idCardFront, setIdCardFront] = useState(null);
  const [idCardBack, setIdCardBack] = useState(null);
  const [frontPreview, setFrontPreview] = useState(
    existingVerification?.idCardFront || null
  );
  const [backPreview, setBackPreview] = useState(
    existingVerification?.idCardBack || null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState({ front: false, back: false });

  const frontInputRef = useRef(null);
  const backInputRef = useRef(null);

  // Prevent ESC key from closing fullscreen form
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        // Optionally show a notification
        console.log("⚠️ Cannot close verification form. Please complete it first.");
      }
    };

    // Add event listener
    document.addEventListener("keydown", handleKeyDown, true);

    // Cleanup on unmount
    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e, side) => {
    const file = e.target.files[0];
    if (!file) return;

    processFile(file, side);
  };

  const processFile = (file, side) => {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (PNG, JPG, JPEG)");
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size should be less than 5MB");
      return;
    }

    const preview = URL.createObjectURL(file);

    if (side === "front") {
      setIdCardFront(file);
      setFrontPreview(preview);
    } else {
      setIdCardBack(file);
      setBackPreview(preview);
    }

    setError("");
  };

  const handleDrag = (e, side) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive({ ...dragActive, [side]: true });
    } else if (e.type === "dragleave") {
      setDragActive({ ...dragActive, [side]: false });
    }
  };

  const handleDrop = (e, side) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive({ ...dragActive, [side]: false });

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0], side);
    }
  };

  const removeImage = (side) => {
    if (side === "front") {
      setIdCardFront(null);
      setFrontPreview(null);
      if (frontInputRef.current) frontInputRef.current.value = "";
    } else {
      setIdCardBack(null);
      setBackPreview(null);
      if (backInputRef.current) backInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!formData.fullName || !formData.phoneNumber || !formData.dateOfBirth) {
      setError("All fields are required");
      return;
    }

    if (!idCardFront || !idCardBack) {
      setError("Please upload both ID card images");
      return;
    }

    setIsSubmitting(true);

    try {
      const submitData = new FormData();
      submitData.append("userId", userId);
      submitData.append("fullName", formData.fullName);
      submitData.append("phoneNumber", formData.phoneNumber);
      submitData.append("dateOfBirth", formData.dateOfBirth);
      submitData.append("idCardFront", idCardFront);
      submitData.append("idCardBack", idCardBack);

      const response = await fetch(
        "http://localhost:3001/identity-verification/submit",
        {
          method: "POST",
          body: submitData,
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Verification submitted:", data);
        onSuccess();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit verification");
      }
    } catch (error) {
      console.error("❌ Error submitting verification:", error);
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="identity-verification-form">
      <div className="form-header">
        <div className="header-icon">🔐</div>
        <h2>Identity Verification</h2>
        <p className="subtitle">
          To ensure safety and trust in our community, please verify your identity before creating
          Shared Room or Roommate listings.
        </p>
      </div>

      {/* Status Banner for Pending/Rejected */}
      {existingVerification?.status === "pending" && (
        <div className="verification-status-banner pending">
          <div className="status-icon">⏳</div>
          <div className="status-content">
            <h3>Verification Pending</h3>
            <p>
              Your verification is currently under review. Our team will process it within 24-48 hours.
            </p>
            <p style={{ marginTop: '8px', fontSize: '14px', fontWeight: '500' }}>
              💡 You can still update your information below if needed. Changes will be saved and reviewed.
            </p>
            <p style={{ marginTop: '12px', fontSize: '13px', fontStyle: 'italic', opacity: 0.8 }}>
              Submitted: {new Date(existingVerification.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      )}

      {existingVerification?.status === "rejected" && (
        <div className="verification-status-banner rejected">
          <div className="status-icon">❌</div>
          <div className="status-content">
            <h3>Verification Rejected</h3>
            <p>
              Unfortunately, your verification was rejected. Please review the reason below and resubmit
              with correct information.
            </p>
            {existingVerification.rejectionReason && (
              <div className="rejection-reason">
                <strong>Reason:</strong> {existingVerification.rejectionReason}
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="error-banner">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="verification-form">

        {/* Personal Information Section */}
        <div className="form-section">
          <h3 className="section-title">
            <span className="section-icon">👤</span>
            Personal Information
          </h3>

          <div className="form-row">
            {/* Full Name */}
            <div className="form-group">
              <label htmlFor="fullName">
                Full Name <span className="required">*</span>
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                placeholder="Enter your full legal name"
                required
              />
              <p className="field-hint">As shown on your ID card</p>
            </div>

            {/* Phone Number */}
            <div className="form-group">
              <label htmlFor="phoneNumber">
                Phone Number <span className="required">*</span>
              </label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                placeholder="e.g., +84 123 456 789"
                required
              />
              <p className="field-hint">Active phone number</p>
            </div>
          </div>

          {/* Date of Birth */}
          <div className="form-group">
            <label htmlFor="dateOfBirth">
              Date of Birth <span className="required">*</span>
            </label>
            <input
              type="date"
              id="dateOfBirth"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>

        {/* ID Card Upload Section */}
        <div className="form-section">
          <h3 className="section-title">
            <span className="section-icon">🪪</span>
            ID Card / Citizen ID
          </h3>
          <p className="section-description">
            Upload clear photos of both sides of your ID card. Make sure all text is readable.
          </p>

          <div className="id-card-upload-grid">

            {/* Front Side */}
            <div className="id-upload-container">
              <label className="upload-label">
                Front Side <span className="required">*</span>
              </label>
              <div
                className={`id-upload-box ${dragActive.front ? 'drag-active' : ''} ${frontPreview ? 'has-image' : ''}`}
                onDragEnter={(e) => handleDrag(e, 'front')}
                onDragLeave={(e) => handleDrag(e, 'front')}
                onDragOver={(e) => handleDrag(e, 'front')}
                onDrop={(e) => handleDrop(e, 'front')}
                onClick={() => !frontPreview && frontInputRef.current?.click()}
              >
                {frontPreview ? (
                  <div className="image-preview">
                    <img src={frontPreview} alt="ID Card Front" />
                    <div className="image-overlay">
                      <button
                        type="button"
                        className="change-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          frontInputRef.current?.click();
                        }}
                      >
                        📷 Change
                      </button>
                      <button
                        type="button"
                        className="remove-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage('front');
                        }}
                      >
                        🗑️ Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="upload-placeholder">
                    <div className="upload-icon">📸</div>
                    <p className="upload-text">Click or drag to upload</p>
                    <span className="upload-hint">Front side of ID</span>
                    <span className="file-types">PNG, JPG • Max 5MB</span>
                  </div>
                )}
                <input
                  ref={frontInputRef}
                  type="file"
                  id="idCardFront"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, "front")}
                  style={{ display: "none" }}
                />
              </div>
            </div>

            {/* Back Side */}
            <div className="id-upload-container">
              <label className="upload-label">
                Back Side <span className="required">*</span>
              </label>
              <div
                className={`id-upload-box ${dragActive.back ? 'drag-active' : ''} ${backPreview ? 'has-image' : ''}`}
                onDragEnter={(e) => handleDrag(e, 'back')}
                onDragLeave={(e) => handleDrag(e, 'back')}
                onDragOver={(e) => handleDrag(e, 'back')}
                onDrop={(e) => handleDrop(e, 'back')}
                onClick={() => !backPreview && backInputRef.current?.click()}
              >
                {backPreview ? (
                  <div className="image-preview">
                    <img src={backPreview} alt="ID Card Back" />
                    <div className="image-overlay">
                      <button
                        type="button"
                        className="change-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          backInputRef.current?.click();
                        }}
                      >
                        📷 Change
                      </button>
                      <button
                        type="button"
                        className="remove-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage('back');
                        }}
                      >
                        🗑️ Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="upload-placeholder">
                    <div className="upload-icon">📸</div>
                    <p className="upload-text">Click or drag to upload</p>
                    <span className="upload-hint">Back side of ID</span>
                    <span className="file-types">PNG, JPG • Max 5MB</span>
                  </div>
                )}
                <input
                  ref={backInputRef}
                  type="file"
                  id="idCardBack"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, "back")}
                  style={{ display: "none" }}
                />
              </div>
            </div>

          </div>
        </div>

        {/* Privacy Notice */}
        <div className="privacy-notice">
          <div className="privacy-icon">🔒</div>
          <div className="privacy-content">
            <p className="privacy-title">Your Privacy is Protected</p>
            <p className="privacy-text">
              All information is encrypted and securely stored. We only use your data for
              verification purposes and will never share it with third parties without your consent.
            </p>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="submit-btn"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <div className="loading-spinner"></div>
              <span>Submitting...</span>
            </>
          ) : existingVerification?.status === "pending" ? (
            <>
              <span className="btn-icon">💡</span>
              <span>Update Information</span>
            </>
          ) : existingVerification?.status === "rejected" ? (
            <>
              <span className="btn-icon">🔄</span>
              <span>Resubmit Verification</span>
            </>
          ) : existingVerification ? (
            <>
              <span className="btn-icon">🔄</span>
              <span>Update Verification</span>
            </>
          ) : (
            <>
              <span className="btn-icon">✅</span>
              <span>Submit for Verification</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default IdentityVerificationForm;

