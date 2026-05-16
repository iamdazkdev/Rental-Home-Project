import { Box, Typography } from "@mui/material";

const AppTextField = ({ id, label, type = "text", placeholder, register, error, icon: Icon, ...props }) => {
  return (
    <Box>
      <Typography component="label" htmlFor={id} sx={{ display: "block", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#777587", ml: 2, mb: 1 }}>
        {label}
      </Typography>
      <Box sx={{ position: "relative" }}>
        {Icon && <Icon sx={{ position: "absolute", left: 20, top: "50%", transform: "translateY(-50%)", color: "#777587", zIndex: 1 }} />}
        <Box
          component="input"
          id={id}
          type={type}
          placeholder={placeholder}
          {...(register ? register(id) : {})}
          {...props}
          sx={{
            width: "100%", pl: Icon ? "56px" : 3, pr: 3, py: 2, bgcolor: "#f3f3f6", border: "none", borderRadius: "16px",
            fontWeight: 500, color: "#1a1c1e", outline: "none", transition: "all 0.2s",
            fontFamily: "inherit", fontSize: "1rem", boxSizing: "border-box",
            "&:focus": { bgcolor: "#ffffff", boxShadow: "0 0 0 2px rgba(92, 0, 202, 0.2)" }
          }}
        />
      </Box>
      {error && <Typography sx={{ color: "#ba1a1a", fontSize: "0.75rem", ml: 2, mt: 0.5 }}>{error.message}</Typography>}
    </Box>
  );
};

export default AppTextField;
