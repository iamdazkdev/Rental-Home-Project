import { useState, useEffect, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "../../utils/validations/authSchema";
import "../../styles/Login.scss";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setToken } from "../../redux/slices/authSlice";
import { setUser } from "../../redux/slices/userSlice";
import {
  API_ENDPOINTS,
} from "../../constants/api";
import api from "../../services/api";

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
  const [showPassword, setShowPassword] = useState(false);
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

  // Removed manual handleChange in favor of react-hook-form

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  const onSubmit = async (data) => {
    // Clear previous messages
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const response = await api.post(API_ENDPOINTS.AUTH.LOGIN, data);
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
    <div className="login">
      <div className="login_content">
        <div className="login_header">
          <h1>Welcome Back</h1>
          <p>Sign in to your Rento account</p>
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
        {success && (
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
            <span>{success}</span>
          </div>
        )}

        <form className="login_content_form" onSubmit={hookFormSubmit(onSubmit)}>
          <div className="input_group">
            <input
              placeholder="Email Address"
              type="email"
              {...register("email")}
              className={errors.email || (error && error.includes("email")) ? "error" : ""}
            />
            {errors.email && <span className="field-error">{errors.email.message}</span>}
          </div>

          <div className="input_group password_input_group">
            <input
              placeholder="Password"
              type={showPassword ? "text" : "password"}
              {...register("password")}
              className={errors.password || (error && error.includes("password")) ? "error" : ""}
            />
            <button
              type="button"
              className="password_toggle_btn"
              onClick={togglePasswordVisibility}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M1 1l22 22"
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
                    d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle
                    cx="12"
                    cy="12"
                    r="3"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
            {errors.password && <span className="field-error">{errors.password.message}</span>}
          </div>

          <div className="forgot_password">
            <a href="/forgot-password">Forgot Password?</a>
          </div>

          <button type="submit" disabled={isLoading} className="login_btn">
            <span>{isLoading ? "Signing In..." : "Sign In"}</span>
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
                  d="M5 12H19M19 12L12 5M19 12L12 19"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        </form>

        <div className="register_link">
          <span>Don't have an account?</span>
          <a href="/register">Create Account</a>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
