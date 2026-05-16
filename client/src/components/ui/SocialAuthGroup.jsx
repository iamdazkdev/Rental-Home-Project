import { Box, Typography, Divider, Button } from "@mui/material";
import { Apple, Google } from "@mui/icons-material";

const SocialAuthGroup = () => {
  return (
    <>
      {/* Separator */}
      <Box sx={{ position: "relative", my: 5 }}>
        <Divider sx={{ borderColor: "rgba(119, 117, 135, 0.3)" }} />
        <Box sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", bgcolor: "#ffffff", px: 2 }}>
          <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(119, 117, 135, 0.6)" }}>
            Or continue with
          </Typography>
        </Box>
      </Box>

      {/* Social Buttons */}
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 5 }}>
        <Button
          variant="outlined"
          startIcon={<Google />}
          sx={{
            py: 1.5, borderRadius: "16px", color: "#424666", borderColor: "rgba(119, 117, 135, 0.1)",
            bgcolor: "#f3f3f6", textTransform: "none", fontWeight: 700, "&:hover": { bgcolor: "#e8e8ea" }
          }}
        >
          Google
        </Button>
        <Button
          variant="outlined"
          startIcon={<Apple />}
          sx={{
            py: 1.5, borderRadius: "16px", color: "#424666", borderColor: "rgba(119, 117, 135, 0.1)",
            bgcolor: "#f3f3f6", textTransform: "none", fontWeight: 700, "&:hover": { bgcolor: "#e8e8ea" }
          }}
        >
          Apple
        </Button>
      </Box>
    </>
  );
};

export default SocialAuthGroup;
