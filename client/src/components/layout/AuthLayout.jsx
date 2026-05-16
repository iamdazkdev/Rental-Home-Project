import { Box, Typography } from "@mui/material";
import { Business } from "@mui/icons-material";

const AuthLayout = ({ children, title, subtitle }) => {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 3,
        position: "relative",
        overflow: "hidden",
        backgroundColor: "#f9f9fc",
        backgroundImage: `
          radial-gradient(at 0% 0%, #eaddff 0%, transparent 50%),
          radial-gradient(at 100% 0%, #d5d9ff 0%, transparent 50%),
          radial-gradient(at 100% 100%, #ffdad5 0%, transparent 50%),
          radial-gradient(at 0% 100%, #f3f3f6 0%, transparent 50%),
          url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 86c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zm76-26c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1z' fill='%23424666' fill-opacity='0.03' fill-rule='evenodd'/%3E%3C/svg%3E")
        `,
      }}
    >
      {/* Decorative orbs */}
      <Box sx={{ position: "absolute", top: -96, left: -96, width: 384, height: 384, bgcolor: "rgba(92, 0, 202, 0.05)", borderRadius: "50%", filter: "blur(64px)" }} />
      <Box sx={{ position: "absolute", bottom: -96, right: -96, width: 384, height: 384, bgcolor: "rgba(172, 51, 42, 0.05)", borderRadius: "50%", filter: "blur(64px)" }} />
      {/* Main Card */}
      <Box
        component="main"
        sx={{
          width: "100%",
          maxWidth: 480,
          bgcolor: "#ffffff",
          borderRadius: "24px",
          boxShadow: "0px 20px 40px rgba(26,28,30,0.06)",
          p: { xs: 4, md: 6 },
          zIndex: 10,
        }}
      >
        {/* Header Section */}
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 5 }}>
          <Box sx={{ mb: 4, display: "flex", alignItems: "center", gap: 1 }}>
            <Box sx={{ width: 40, height: 40, bgcolor: "#424666", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Business sx={{ color: "#fff" }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 900, color: "#424666", letterSpacing: "-0.05em" }}>
              Rento
            </Typography>
          </Box>
          <Typography variant="h3" sx={{ fontWeight: 800, color: "#1a1c1e", letterSpacing: "-0.02em", mb: 1, textAlign: "center", fontSize: "2.5rem" }}>
            {title}
          </Typography>
          <Typography sx={{ color: "#464555", fontWeight: 500, textAlign: "center" }}>
            {subtitle}
          </Typography>
        </Box>

        {children}
      </Box>
    </Box>
  );
};

export default AuthLayout;
