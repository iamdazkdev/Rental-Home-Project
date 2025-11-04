import { useState } from "react";
import "../../styles/Login.scss";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setLogin } from "../../redux/state";
const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Clear error when user starts typing
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Clear previous messages
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:3001/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      console.log("Login response:", data);

      if (response.ok) {
        // Success - user logged in
        setSuccess("Login successful! Redirecting to home...");

        // Clear form fields after successful login
        setFormData({
          email: "",
          password: "",
        });

        // Store user data and token in localStorage
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        // Dispatch Redux action
        if (data) {
          dispatch(
            setLogin({
              user: data.user,
              token: data.token,
            })
          );
        }

        // Redirect to home page after 1.5 seconds
        setTimeout(() => {
          navigate("/");
        }, 1500);
      } else {
        // Handle different error status codes
        switch (response.status) {
          case 401:
            setError(
              "Invalid email or password. Please check your credentials and try again."
            );
            break;
          case 400:
            if (data.message.includes("email")) {
              setError("Please enter a valid email address.");
            } else if (data.message.includes("required")) {
              setError("Please fill in both email and password.");
            } else {
              setError(
                data.message || "Please check your input and try again."
              );
            }
            break;
          case 500:
            setError("Server error. Please try again later.");
            break;
          default:
            setError(data.message || "Login failed. Please try again.");
        }
      }
    } catch (err) {
      console.error("Error during login:", err);
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login">
      <div className="login_content">
        <div className="login_header">
          <h1>Welcome Back</h1>
          <p>Sign in to your Dream Nest account</p>
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

        <form className="login_content_form" onSubmit={handleSubmit}>
          <div className="input_group">
            <input
              placeholder="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              className={error && error.includes("email") ? "error" : ""}
            />
          </div>

          <div className="input_group">
            <input
              placeholder="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
              className={error && error.includes("password") ? "error" : ""}
            />
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
