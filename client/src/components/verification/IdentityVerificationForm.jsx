import React, {useEffect, useRef, useState} from "react";
import VerificationSuccessModal from "./VerificationSuccessModal";
import API_BASE_URL from "../../config/api";
import "../../styles/IdentityVerification.scss";

const IdentityVerificationForm = ({
                                      userId, onSuccess = () => {
    }, existingVerification
                                  }) => {
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
    const [dragActive, setDragActive] = useState({front: false, back: false});
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [submittedData, setSubmittedData] = useState(null);

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
        const {name, value} = e.target;
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
            setDragActive({...dragActive, [side]: true});
        } else if (e.type === "dragleave") {
            setDragActive({...dragActive, [side]: false});
        }
    };

    const handleDrop = (e, side) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive({...dragActive, [side]: false});

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

        console.log("🔍 Submitting verification form:", {
            userId,
            formData,
            hasIdCardFront: !!idCardFront,
            hasIdCardBack: !!idCardBack,
            hasFrontPreview: !!frontPreview,
            hasBackPreview: !!backPreview,
            existingVerification: !!existingVerification
        });

        // Validate userId first
        if (!userId) {
            setError("User ID is missing. Please login again.");
            console.error("❌ No userId provided to form");
            return;
        }

        // Validation
        if (!formData.fullName || !formData.phoneNumber || !formData.dateOfBirth) {
            setError("All fields are required");
            return;
        }

        // For new verification, require both images
        // For updating (resubmit), allow using existing images if no new ones uploaded
        const isUpdate = !!existingVerification;
        const hasNewFront = !!idCardFront;
        const hasNewBack = !!idCardBack;
        const hasExistingImages = frontPreview && backPreview;

        if (!isUpdate && (!hasNewFront || !hasNewBack)) {
            setError("Please upload both ID card images (front and back)");
            return;
        }

        if (isUpdate && !hasExistingImages && (!hasNewFront || !hasNewBack)) {
            setError("Please upload both ID card images (front and back)");
            return;
        }

        setIsSubmitting(true);

        try {
            const submitData = new FormData();
            console.log("📤 Appending userId to FormData:", userId);
            submitData.append("userId", userId);
            submitData.append("fullName", formData.fullName);
            submitData.append("phoneNumber", formData.phoneNumber);
            submitData.append("dateOfBirth", formData.dateOfBirth);

            // Only append new images if they exist
            if (idCardFront) {
                submitData.append("idCardFront", idCardFront);
                console.log("✅ Appending new front image");
            } else if (frontPreview) {
                console.log("ℹ️ Using existing front image");
            }

            if (idCardBack) {
                submitData.append("idCardBack", idCardBack);
                console.log("✅ Appending new back image");
            } else if (backPreview) {
                console.log("ℹ️ Using existing back image");
            }

            console.log("🚀 Sending request to server...");
            const response = await fetch(
                `${API_BASE_URL}/identity-verification/submit`,
                {
                    method: "POST",
                    body: submitData,
                }
            );

            console.log("📥 Response status:", response.status);

            if (response.ok) {
                const data = await response.json();
                console.log("✅ Verification submitted successfully:", data);

                // Save submitted data and show success modal
                setSubmittedData({
                    fullName: formData.fullName,
                    phoneNumber: formData.phoneNumber,
                    dateOfBirth: formData.dateOfBirth,
                    submittedAt: new Date(),
                });
                setShowSuccessModal(true);
            } else {
                // Get error details
                let errorData;
                try {
                    errorData = await response.json();
                } catch (e) {
                    // If response is not JSON, get text
                    const errorText = await response.text();
                    console.error("❌ Server response (text):", errorText);
                    throw new Error(`Server error (${response.status}): ${errorText}`);
                }

                console.error("❌ Server error response:", {
                    status: response.status,
                    statusText: response.statusText,
                    error: errorData
                });
                throw new Error(errorData.message || `Failed to submit verification (${response.status})`);
            }
        } catch (error) {
            console.error("❌ Error submitting verification:", error);
            console.error("❌ Error details:", {
                name: error.name,
                message: error.message,
                stack: error.stack
            });
            setError(error.message || "Failed to submit verification. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="identity-verification-form">
            {/* Status Display for Pending/Rejected */}
            {existingVerification && existingVerification.status !== "approved" && (
                <div className={`verification-status-banner ${existingVerification.status}`}>
                    {existingVerification.status === "pending" ? (
                        <>
                            <div className="status-icon pending-icon">
                                <span className="icon">⏳</span>
                                <div className="pulse-ring"></div>
                            </div>
                            <div className="status-content">
                                <h3>
                                    <span className="status-badge pending">Pending Review</span>
                                </h3>
                                <p className="status-message">
                                    Your identity verification is currently under review by our admin team.
                                    This usually takes 24-48 hours. You'll be notified via email once it's approved.
                                </p>
                                <div className="status-info">
                                    <div className="info-item">
                                        <span className="label">📝 Submitted:</span>
                                        <span className="value">
                      {new Date(existingVerification.submittedAt).toLocaleString()}
                    </span>
                                    </div>
                                    <div className="info-item">
                                        <span className="label">👤 Name:</span>
                                        <span className="value">{existingVerification.fullName}</span>
                                    </div>
                                </div>
                                <div className="status-actions">
                                    <p className="note">
                                        ℹ️ You cannot create Shared Room or Roommate listings until approved.
                                    </p>
                                </div>
                            </div>
                        </>
                    ) : existingVerification.status === "rejected" ? (
                        <>
                            <div className="status-icon rejected-icon">
                                <span className="icon">❌</span>
                                <div className="warning-ring"></div>
                            </div>
                            <div className="status-content">
                                <h3>
                                    <span className="status-badge rejected">Verification Rejected</span>
                                </h3>
                                <p className="status-message error">
                                    Unfortunately, your identity verification was rejected.
                                    {existingVerification.rejectionReason && " Please review the reason below and resubmit with corrected information."}
                                </p>

                                {existingVerification.rejectionReason && (
                                    <div className="rejection-reason-box">
                                        <div className="reason-header">
                                            <span className="icon">⚠️</span>
                                            <strong>Rejection Reason:</strong>
                                        </div>
                                        <p className="reason-text">{existingVerification.rejectionReason}</p>
                                    </div>
                                )}

                                <div className="status-info">
                                    <div className="info-item">
                                        <span className="label">📅 Rejected At:</span>
                                        <span className="value">
                      {new Date(existingVerification.reviewedAt || existingVerification.updatedAt).toLocaleString()}
                    </span>
                                    </div>
                                    {existingVerification.reviewedBy && (
                                        <div className="info-item">
                                            <span className="label">👨‍💼 Reviewed By:</span>
                                            <span className="value">Admin</span>
                                        </div>
                                    )}
                                </div>

                                <div className="status-actions">
                                    <div className="alert-box">
                                        <span className="alert-icon">💡</span>
                                        <p>
                                            <strong>What to do next:</strong>
                                            <br/>
                                            • Review the rejection reason carefully
                                            <br/>
                                            • Update your information below with correct details
                                            <br/>
                                            • Upload clear, valid ID card images
                                            <br/>
                                            • Submit again for review
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : null}
                </div>
            )}

            <div className="form-header">
                <div className="header-icon">🔐</div>
                <h2>
                    {existingVerification?.status === "rejected"
                        ? "Resubmit Identity Verification"
                        : existingVerification?.status === "pending"
                            ? "Your Verification Details"
                            : "Identity Verification"
                    }
                </h2>
                <p className="subtitle">
                    {existingVerification?.status === "rejected"
                        ? "Please correct the information and resubmit your verification."
                        : existingVerification?.status === "pending"
                            ? "Your verification is being reviewed. Details submitted are shown below."
                            : "To ensure safety and trust in our community, please verify your identity before creating Shared Room or Roommate listings."
                    }
                </p>
            </div>

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
                                        <img src={frontPreview} alt="ID Card Front"/>
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
                                    style={{display: "none"}}
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
                                        <img src={backPreview} alt="ID Card Back"/>
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
                                    style={{display: "none"}}
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

            {/* Success Modal */}
            {showSuccessModal && (
                <VerificationSuccessModal
                    verificationData={submittedData}
                    onClose={() => {
                        setShowSuccessModal(false);
                        onSuccess();
                    }}
                />
            )}
        </div>
    );
};

export default IdentityVerificationForm;

