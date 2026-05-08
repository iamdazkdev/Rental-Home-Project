import { useEffect, useState, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema } from "../../utils/validations/authSchema";
import "../../styles/Register.scss";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setToken } from "../../redux/slices/authSlice";
import { setUser } from "../../redux/slices/userSlice";
import { API_ENDPOINTS } from "../../constants/api";
import api from "../../services/api";

const RegisterPage = () => {
  const {
    register,
    handleSubmit: hookFormSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      profileImage: null,
    },
  });

  const profileImage = watch("profileImage");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleImageChange = useCallback((e) => {
    if (e.target.files && e.target.files[0]) {
      setValue("profileImage", e.target.files[0], { shouldValidate: true });
    }
  }, [setValue]);

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  const toggleConfirmPasswordVisibility = useCallback(() => {
    setShowConfirmPassword(prev => !prev);
  }, []);

  const navigate = useNavigate();
  const dispatch = useDispatch();

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
      const register_form = new FormData();
      for (var key in data) {
        register_form.append(key, data[key]);
      }

      const response = await api.post(API_ENDPOINTS.AUTH.REGISTER, register_form);
      const data = response.data;
      console.log("Registration response:", data);

      if (response.status === 200 || response.status === 201) {
        // Success - user registered, now auto-login
        setSuccess("Account created successfully! Logging you in...");

        // Auto-login with the registered credentials
        try {
          const loginResponse = await api.post(API_ENDPOINTS.AUTH.LOGIN, {
            email: data.email,
            password: data.password,
          });

          const loginData = loginResponse.data;

          if (loginResponse.status === 200) {
            // Login successful - dispatch to Redux and redirect to home
            dispatch(setToken(loginData.token));
            dispatch(setUser(loginData.user));

            // Redirect to home page
            timeoutRef.current = setTimeout(() => {
              navigate("/");
            }, 500);
          } else {
            // Login failed after registration - redirect to login page
            setSuccess("Account created! Please login to continue.");
            timeoutRef.current = setTimeout(() => {
              navigate("/login");
            }, 1500);
          }
        } catch (loginError) {
          console.error("Auto-login error:", loginError);
          // If auto-login fails, redirect to login page
          setSuccess("Account created! Please login to continue.");
          timeoutRef.current = setTimeout(() => {
            navigate("/login");
          }, 1500);
        }
      }
    } catch (err) {
      console.error("Error during registration:", err);
      
      const status = err.response?.status;
      const errorData = err.response?.data;

      if (status === 409) {
        setError("An account with this email already exists. Please use a different email or try logging in.");
      } else if (status === 400) {
        if (errorData?.message?.includes("Password")) {
          setError(errorData.message);
        } else if (errorData?.message?.includes("email")) {
          setError("Please enter a valid email address.");
        } else if (errorData?.message?.includes("required")) {
          setError("Please fill in all required fields.");
        } else if (errorData?.message?.includes("image")) {
          setError("Please upload a profile image.");
        } else {
          setError(errorData?.message || "Please check your input and try again.");
        }
      } else if (status === 413) {
        setError("File size too large. Please upload an image smaller than 5MB.");
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
    <div className="register">
      <div className="register_content">
        <div className="register_header">
          <h1>Create Account</h1>
          <p>Join Rento and find your perfect home</p>
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

        <form className="register_content_form" onSubmit={hookFormSubmit(onSubmit)}>
          <div className="name_row">
            <div className="input_group">
              <input
                placeholder="First Name"
                {...register("firstName")}
                className={`name_input ${errors.firstName ? "error" : ""}`}
              />
              {errors.firstName && <span className="field-error">{errors.firstName.message}</span>}
            </div>
            <div className="input_group">
              <input
                placeholder="Last Name"
                {...register("lastName")}
                className={`name_input ${errors.lastName ? "error" : ""}`}
              />
              {errors.lastName && <span className="field-error">{errors.lastName.message}</span>}
            </div>
          </div>

          <div className="input_group">
            <input
              placeholder="Email Address"
              type="email"
              {...register("email")}
              className={errors.email ? "error" : ""}
            />
            {errors.email && <span className="field-error">{errors.email.message}</span>}
          </div>

          <div className="input_group password_input_group">
            <input
              placeholder="Password"
              type={showPassword ? "text" : "password"}
              {...register("password")}
              className={errors.password ? "error" : ""}
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

          <div className="input_group password_input_group">
            <input
              placeholder="Confirm Password"
              type={showConfirmPassword ? "text" : "password"}
              {...register("confirmPassword")}
              className={errors.confirmPassword ? "error" : ""}
            />
            <button
              type="button"
              className="password_toggle_btn"
              onClick={toggleConfirmPasswordVisibility}
              aria-label={
                showConfirmPassword
                  ? "Hide confirm password"
                  : "Show confirm password"
              }
            >
              {showConfirmPassword ? (
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
            {errors.confirmPassword && (
              <span className="field-error">{errors.confirmPassword.message}</span>
            )}
          </div>

          <div className="profile_upload_section">
            <input
              id="profileImageInput"
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleImageChange}
            />

            <div className="upload_container">
              {profileImage ? (
                <div className="preview_container">
                  <img
                    src={URL.createObjectURL(profileImage)}
                    alt="Profile preview"
                    className="profile_preview"
                  />
                  <label
                    htmlFor="profileImageInput"
                    className="change_photo_btn"
                  >
                    Change Photo
                  </label>
                </div>
              ) : (
                <label htmlFor="profileImageInput" className="upload_label">
                  <div className="upload_icon">
                    <svg
                      width="40"
                      height="40"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.1 3.89 23 5 23H19C20.1 23 21 22.1 21 21V9M19 21H5V3H13V9H19Z"
                        fill="currentColor"
                      />
                      <circle cx="12" cy="12" r="3" fill="currentColor" />
                    </svg>
                  </div>
                  <span className="upload_text">Upload Your Photo</span>
                  <span className="upload_hint">Click to select an image</span>
                </label>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="register_btn"
          >
            <span>{isLoading ? "Creating Account..." : "Create Account"}</span>
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

        <div className="login_link">
          <span>Already have an account?</span>
          <a href="/login">Sign In</a>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
