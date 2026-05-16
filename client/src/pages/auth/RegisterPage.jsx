import { useEffect, useState, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema } from "../../utils/validations/authSchema";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setToken } from "../../redux/slices/authSlice";
import { setUser } from "../../redux/slices/userSlice";
import { API_ENDPOINTS } from "../../constants/api";
import api from "../../services/api";

import { Box, Typography, Checkbox } from "@mui/material";
import { MailOutline, AddAPhoto } from "@mui/icons-material";

import AuthLayout from "../../components/layout/AuthLayout";
import AppTextField from "../../components/ui/AppTextField";
import AppPasswordInput from "../../components/ui/AppPasswordInput";
import AppPrimaryButton from "../../components/ui/AppPrimaryButton";

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

  const handleImageChange = useCallback((e) => {
    if (e.target.files && e.target.files[0]) {
      setValue("profileImage", e.target.files[0], { shouldValidate: true });
    }
  }, [setValue]);

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

      const response = await api.post(API_ENDPOINTS.AUTH.REGISTER, register_form, {
        ignoreAuthInterceptor: true
      });
      const resData = response.data;
      console.log("Registration response:", resData);

      if (response.status === 200 || response.status === 201) {
        // Success - user registered, now auto-login
        setSuccess("Account created successfully! Logging you in...");

        // Auto-login with the registered credentials
        try {
          const loginResponse = await api.post(API_ENDPOINTS.AUTH.LOGIN, {
            email: resData.email,
            password: data.password,
          }, {
            ignoreAuthInterceptor: true
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
    <AuthLayout title="Create Account" subtitle="Join Rento and find your perfect home">
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
          
          {/* Name Row */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
            <AppTextField
              id="firstName"
              label="First Name"
              placeholder="Jane"
              register={register}
              error={errors.firstName}
            />
            <AppTextField
              id="lastName"
              label="Last Name"
              placeholder="Doe"
              register={register}
              error={errors.lastName}
            />
          </Box>

          {/* Email */}
          <AppTextField
            id="email"
            label="Email Address"
            placeholder="jane.doe@example.com"
            type="email"
            register={register}
            error={errors.email}
            icon={MailOutline}
          />

          {/* Password Group */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <AppPasswordInput
              id="password"
              label="Password"
              register={register}
              error={errors.password}
            />
            <AppPasswordInput
              id="confirmPassword"
              label="Confirm Password"
              register={register}
              error={errors.confirmPassword}
            />
          </Box>

          {/* Profile Picture Upload */}
          <Box>
            <Typography component="label" sx={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#777587', ml: 2, mb: 1 }}>
              Profile Picture
            </Typography>
            
            <input
              id="profileImageInput"
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleImageChange}
            />

            <Box
              component="label"
              htmlFor="profileImageInput"
              sx={{
                border: '2px dashed',
                borderColor: 'rgba(199, 196, 216, 0.3)',
                borderRadius: '16px',
                p: 4,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1.5,
                bgcolor: 'rgba(243, 243, 246, 0.5)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': { bgcolor: 'rgba(232, 232, 234, 0.5)' },
                '&:hover .photo-icon': { transform: 'scale(1.1)' }
              }}
            >
              {profileImage ? (
                <>
                  <Box
                    component="img"
                    src={URL.createObjectURL(profileImage)}
                    alt="Profile preview"
                    sx={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '2px solid #fd6e60' }}
                  />
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#424666' }}>Change Photo</Typography>
                </>
              ) : (
                <>
                  <Box className="photo-icon" sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: 'rgba(253, 110, 96, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ac332a', transition: 'transform 0.2s' }}>
                    <AddAPhoto />
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#424666' }}>Upload Your Photo</Typography>
                    <Typography sx={{ fontSize: '0.6875rem', color: 'rgba(70, 69, 85, 0.7)' }}>Click to select an image from your device</Typography>
                  </Box>
                </>
              )}
            </Box>
            {errors.profileImage && <Typography sx={{ color: '#ba1a1a', fontSize: '0.75rem', ml: 2, mt: 0.5 }}>{errors.profileImage.message}</Typography>}
          </Box>

          {/* Terms and Privacy */}
          <Box sx={{ px: 1, display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            <Checkbox id="terms" sx={{ color: '#777587', p: 0, mt: 0.5, '&.Mui-checked': { color: '#ac332a' } }} required />
            <Typography sx={{ fontSize: '0.75rem', color: '#464555', lineHeight: 1.6 }}>
              By creating an account, I agree to Rento's{' '}
              <Link to="#" style={{ color: '#ac332a', fontWeight: 600, textDecoration: 'none' }}>Terms of Service</Link>{' '}
              and{' '}
              <Link to="#" style={{ color: '#ac332a', fontWeight: 600, textDecoration: 'none' }}>Privacy Policy</Link>.
            </Typography>
          </Box>

          {/* Submit */}
          <AppPrimaryButton type="submit" isLoading={isLoading} loadingText="Creating Account...">
            Create Account
          </AppPrimaryButton>
        </Box>
      </form>

      {/* Bottom Navigation */}
      <Box sx={{ mt: 5, textAlign: 'center' }}>
        <Typography sx={{ fontSize: '0.875rem', color: '#464555', fontWeight: 500 }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#ac332a', fontWeight: 700, textDecoration: 'none' }}>
            Sign In
          </Link>
        </Typography>
      </Box>
    </AuthLayout>
  );
};

export default RegisterPage;
