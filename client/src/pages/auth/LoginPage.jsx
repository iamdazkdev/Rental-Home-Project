import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "../../utils/validations/authSchema";
import "../../styles/Login.scss";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setToken } from "../../redux/slices/authSlice";
import { setUser } from "../../redux/slices/userSlice";
import { API_ENDPOINTS } from "../../constants/api";
import api from "../../services/api";
import { Box, Typography, Checkbox, FormControlLabel } from "@mui/material";
import { MailOutline } from "@mui/icons-material";
import AuthLayout from "../../components/layout/AuthLayout";
import AppTextField from "../../components/ui/AppTextField";
import AppPasswordInput from "../../components/ui/AppPasswordInput";
import AppPrimaryButton from "../../components/ui/AppPrimaryButton";
import SocialAuthGroup from "../../components/ui/SocialAuthGroup";

const LoginPage = () => {
  const {
    register,
    handleSubmit: hookFormSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const from = location.state?.from?.pathname || "/";

  const timeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const onSubmit = async (data) => {
    // Clear previous messages
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const response = await api.post(API_ENDPOINTS.AUTH.LOGIN, data, {
        ignoreAuthInterceptor: true
      });
      const resData = response.data;
      console.log("Login response:", resData);

      if (response.status === 200) {
        // Success - user logged in
        setSuccess("Login successful! Redirecting to home...");

        // Clear form fields after successful login
        reset();

        // Dispatch Redux action
        if (resData) {
          dispatch(setToken(resData.token));
          dispatch(setUser(resData.user));
        }

        // Redirect to previous page or home page
        timeoutRef.current = setTimeout(() => {
          navigate(from, { replace: true });
        }, 500);
      }
    } catch (err) {
      console.error("Error during login:", err);
      
      const status = err.response?.status;
      const errorData = err.response?.data;

      if (status === 401) {
        setError("Invalid email or password. Please check your credentials and try again.");
      } else if (status === 400) {
        if (errorData?.message?.includes("email")) {
          setError("Please enter a valid email address.");
        } else if (errorData?.message?.includes("required")) {
          setError("Please fill in both email and password.");
        } else {
          setError(errorData?.message || "Please check your input and try again.");
        }
      } else if (status === 500) {
        setError("Server error. Please try again later.");
      } else {
        setError(errorData?.message || "Network error. Please check your connection and try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title="Welcome Back" subtitle="Sign in to your Rento account">
      {/* Messages */}
      {error && (
        <Box sx={{ p: 2, mb: 3, bgcolor: '#ffdad6', color: '#93000a', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>{error}</Typography>
        </Box>
      )}
      {success && (
        <Box sx={{ p: 2, mb: 3, bgcolor: '#eaddff', color: '#25005a', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>{success}</Typography>
        </Box>
      )}

      {/* Form */}
      <form onSubmit={hookFormSubmit(onSubmit)}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          
          {/* Email */}
          <AppTextField
            id="email"
            label="Email address"
            placeholder="name@company.com"
            register={register}
            error={errors.email}
            icon={MailOutline}
          />

          {/* Password */}
          <AppPasswordInput
            id="password"
            register={register}
            error={errors.password}
            showForgotPassword={true}
          />

          {/* Remember Me */}
          <Box sx={{ px: 2, display: 'flex', alignItems: 'center' }}>
            <FormControlLabel
              control={<Checkbox id="remember" sx={{ color: '#777587', '&.Mui-checked': { color: '#5c00ca' } }} />}
              label={<Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: '#464555' }}>Remember me for 30 days</Typography>}
            />
          </Box>

          {/* Submit */}
          <AppPrimaryButton type="submit" isLoading={isLoading} loadingText="Signing In...">
            Sign In
          </AppPrimaryButton>

        </Box>
      </form>

      {/* Social Buttons */}
      <SocialAuthGroup />

      {/* Footer */}
      <Box sx={{ textAlign: 'center' }}>
        <Typography sx={{ color: '#464555', fontWeight: 500 }}>
          Don’t have an account?{' '}
          <Link to="/register" style={{ color: '#ac332a', fontWeight: 700, textDecoration: 'none' }}>
            Create Account
          </Link>
        </Typography>
      </Box>
    </AuthLayout>
  );
};

export default LoginPage;
