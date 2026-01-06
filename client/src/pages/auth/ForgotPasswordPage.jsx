import { useState } from "react";
import { Link } from "react-router-dom";
import "../../styles/ForgotPassword.scss";
import {
  API_ENDPOINTS,
  DEFAULT_HEADERS,
  HTTP_METHODS,
} from "../../constants/api";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  // const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, {
        method: HTTP_METHODS.POST,
        headers: DEFAULT_HEADERS,
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setEmailSent(true);
        setMessage(
          "Password reset instructions have been sent to your email address."
        );
        setEmail(""); // Clear the email field
      } else {
        switch (response.status) {
          case 404:
            setError("No account found with this email address.");
            break;
          case 429:
            setError("Too many requests. Please try again later.");
            break;
          default:
            setError(
              data.message || "Failed to send reset email. Please try again."
            );
        }
      }
    } catch (err) {
      console.error("Error sending reset email:", err);
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    await handleSubmit({ preventDefault: () => {} });
  };

  return (
    <div className="forgot-password">
      <div className="forgot-password_content">
        <div className="forgot-password_header">
          <h1>Forgot Password?</h1>
          <p>
            {emailSent
              ? "Check your email for reset instructions"
              : "Enter your email address and we'll send you instructions to reset your password"}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="message error_message">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
                fill="currentColor"
              />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Success Message */}
        {message && (
          <div className="message success_message">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"
                fill="currentColor"
              />
            </svg>
            <span>{message}</span>
          </div>
        )}

        {!emailSent ? (
          <form className="forgot-password_form" onSubmit={handleSubmit}>
            <div className="input_group">
              <input
                placeholder="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={error ? "error" : ""}
              />
            </div>

            <button type="submit" disabled={isLoading} className="reset_btn">
              <span>
                {isLoading ? "Sending..." : "Send Reset Instructions"}
              </span>
              {isLoading ? (
                <svg
                  className="loading-spinner"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 2V6M12 18V22M4.93 4.93L7.76 7.76M16.24 16.24L19.07 19.07M2 12H6M18 12H22M4.93 19.07L7.76 16.24M16.24 7.76L19.07 4.93"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M3 8l7.89 3.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
          </form>
        ) : (
          <div className="success_actions">
            <div className="email_sent_info">
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="email_icon"
              >
                <path
                  d="M3 8l7.89 3.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <p>
                We've sent password reset instructions to your email address.
              </p>
            </div>

            <div className="resend_section">
              <p>Didn't receive the email?</p>
              <button
                type="button"
                className="resend_btn"
                onClick={handleResendEmail}
                disabled={isLoading}
              >
                {isLoading ? "Sending..." : "Resend Email"}
              </button>
            </div>
          </div>
        )}

        <div className="back_to_login">
          <Link to="/login">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M19 12H5M5 12L12 19M5 12L12 5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
