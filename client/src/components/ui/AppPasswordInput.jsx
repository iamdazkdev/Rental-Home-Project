import { useState } from "react";
import { Box, Typography, IconButton } from "@mui/material";
import { LockOutlined, Visibility, VisibilityOff } from "@mui/icons-material";
import { Link } from "react-router-dom";

const AppPasswordInput = ({ id, label = "Password", placeholder = "••••••••", register, error, showForgotPassword = false }) => {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", px: 2, mb: 1 }}>
        <Typography component="label" htmlFor={id} sx={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#777587" }}>
          {label}
        </Typography>
        {showForgotPassword && (
          <Link to="/forgot-password" style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#ac332a", textDecoration: "none" }}>
            Forgot Password?
          </Link>
        )}
      </Box>
      <Box sx={{ position: "relative" }}>
        <LockOutlined sx={{ position: "absolute", left: 20, top: "50%", transform: "translateY(-50%)", color: "#777587", zIndex: 1 }} />
        <Box
          component="input"
          id={id}
          type={showPassword ? "text" : "password"}
          placeholder={placeholder}
          {...(register ? register(id) : {})}
          sx={{
            width: "100%", pl: "56px", pr: "56px", py: 2, bgcolor: "#f3f3f6", border: "none", borderRadius: "16px",
            fontWeight: 500, color: "#1a1c1e", outline: "none", transition: "all 0.2s",
            fontFamily: "inherit", fontSize: "1rem", boxSizing: "border-box",
            "&:focus": { bgcolor: "#ffffff", boxShadow: "0 0 0 2px rgba(92, 0, 202, 0.2)" }
          }}
        />
        <IconButton
          onClick={togglePasswordVisibility}
          sx={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#777587" }}
        >
          {showPassword ? <VisibilityOff /> : <Visibility />}
        </IconButton>
      </Box>
      {error && <Typography sx={{ color: "#ba1a1a", fontSize: "0.75rem", ml: 2, mt: 0.5 }}>{error.message}</Typography>}
    </Box>
  );
};

export default AppPasswordInput;
