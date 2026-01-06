import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import IdentityVerificationForm from "../../components/IdentityVerificationForm";
import "../../styles/IdentityVerificationPage.scss";

const IdentityVerificationPage = () => {
  const user = useSelector((state) => state.user);
  const navigate = useNavigate();
  const [existingVerification, setExistingVerification] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Redirect if not logged in
    if (!user) {
      navigate("/login");
      return;
    }

    // Fetch existing verification if any
    const fetchVerification = async () => {
      try {
        const userId = user?.id || user?._id;
        const response = await fetch(
          `http://localhost:3001/identity-verification/${userId}/status`
        );
        const data = await response.json();

        if (data.exists && data.verification) {
          setExistingVerification(data.verification);
        }
      } catch (error) {
        console.error("Error fetching verification:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVerification();
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="identity-verification-page">
          <div className="verification-container">
            <div className="verification-header">
              <h1>Loading...</h1>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const userId = user?.id || user?._id;

  // Handle successful verification submission
  const handleVerificationSuccess = () => {
    console.log("✅ Verification submitted successfully");
    // Optionally navigate somewhere or refresh verification status
    // navigate("/"); // or wherever you want to redirect
    // Or refresh verification status:
    window.location.reload(); // Reload to show new status
  };

  return (
    <>
      <Navbar />
      <div className="identity-verification-page">
        <div className="verification-container">
          <div className="verification-header">
            <h1>🔐 Identity Verification</h1>
            <p className="subtitle">
              Verify your identity to access Room Rental and Roommate features
            </p>
          </div>

          <div className="verification-content">
            <div className="info-section">
              <h2>Why verify your identity?</h2>
              <div className="benefits-grid">
                <div className="benefit-item">
                  <span className="icon">✅</span>
                  <div>
                    <h3>Build Trust</h3>
                    <p>Show hosts you're a verified, trustworthy tenant</p>
                  </div>
                </div>
                <div className="benefit-item">
                  <span className="icon">🏠</span>
                  <div>
                    <h3>Access Room Rentals</h3>
                    <p>Required to request room rentals and shared living</p>
                  </div>
                </div>
                <div className="benefit-item">
                  <span className="icon">🔒</span>
                  <div>
                    <h3>Secure Community</h3>
                    <p>Help keep our platform safe for everyone</p>
                  </div>
                </div>
                <div className="benefit-item">
                  <span className="icon">⚡</span>
                  <div>
                    <h3>Faster Approvals</h3>
                    <p>Verified users get approved faster by hosts</p>
                  </div>
                </div>
              </div>

              <div className="requirements-box">
                <h3>📋 What you'll need</h3>
                <ul>
                  <li>Valid government-issued ID card</li>
                  <li>Clear photos of ID front and back</li>
                  <li>Your full legal name and date of birth</li>
                  <li>A valid phone number</li>
                </ul>
              </div>
            </div>

            <div className="form-section">
              <IdentityVerificationForm
                userId={userId}
                existingVerification={existingVerification}
                onSuccess={handleVerificationSuccess}
              />
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default IdentityVerificationPage;

