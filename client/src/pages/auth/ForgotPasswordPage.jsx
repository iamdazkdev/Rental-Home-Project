import { useState } from "react";
import { Link } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import { MailOutline, CheckCircleOutline, ArrowBack } from "@mui/icons-material";
import api from "../../services/api";
import { API_ENDPOINTS } from "../../constants/api";

import AuthLayout from "../../components/layout/AuthLayout";
import AppTextField from "../../components/ui/AppTextField";
import AppPrimaryButton from "../../components/ui/AppPrimaryButton";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await api.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { email }, {
        ignoreAuthInterceptor: true
      });

      if (response.status === 200) {
        setEmailSent(true);
        setMessage(
          "Password reset instructions have been sent to your email address."
        );
        setEmail(""); // Clear the email field
      }
    } catch (err) {
      console.error("Error sending reset email:", err);
      const status = err.response?.status;
      const data = err.response?.data;

      switch (status) {
        case 404:
          setError("No account found with this email address.");
          break;
        case 429:
          setError("Too many requests. Please try again later.");
          break;
        default:
          setError(
            data?.message || "Network error. Please check your connection and try again."
          );
      }
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
    <AuthLayout
      title="Forgot Password?"
      subtitle={
        emailSent
          ? "Check your email for reset instructions"
          : "Enter your email address and we'll send you a link to reset your password."
      }
    >
      {/* Error Message */}
      {error && (
        <Box sx={{ p: 2, mb: 3, bgcolor: '#ffdad6', color: '#93000a', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>{error}</Typography>
        </Box>
      )}

      {/* Success Message */}
      {message && (
        <Box sx={{ p: 2, mb: 3, bgcolor: '#eaddff', color: '#25005a', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>{message}</Typography>
        </Box>
      )}

      {!emailSent ? (
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <AppTextField
              id="email"
              label="Email address"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              error={error ? { message: "" } : null}
              icon={MailOutline}
            />

            <AppPrimaryButton type="submit" isLoading={isLoading} loadingText="Sending...">
              Send Reset Link
            </AppPrimaryButton>
          </Box>
        </form>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center', textAlign: 'center' }}>
          <Box sx={{ width: 80, height: 80, borderRadius: '50%', bgcolor: 'rgba(92, 0, 202, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5c00ca' }}>
            <CheckCircleOutline sx={{ fontSize: 40 }} />
          </Box>

          <Box>
            <Typography sx={{ color: '#464555', mb: 2, fontWeight: 500 }}>
              Didn't receive the email?
            </Typography>
            <AppPrimaryButton
              onClick={handleResendEmail}
              isLoading={isLoading}
              loadingText="Sending..."
              sx={{ bgcolor: '#424666', '&:hover': { bgcolor: '#2f3133' }, boxShadow: 'none' }}
            >
              Resend Email
            </AppPrimaryButton>
          </Box>
        </Box>
      )}

      {/* Back Link */}
      <Box sx={{ mt: 5, textAlign: 'center' }}>
        <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#ac332a', fontWeight: 600, textDecoration: 'none' }}>
          <ArrowBack fontSize="small" />
          Back to Sign In
        </Link>
      </Box>
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
