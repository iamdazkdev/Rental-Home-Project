import { Button } from "@mui/material";
import { ArrowForward } from "@mui/icons-material";

const AppPrimaryButton = ({ children, isLoading, loadingText = "Loading...", disabled, type = "button", ...props }) => {
  return (
    <Button
      type={type}
      disabled={isLoading || disabled}
      {...props}
      sx={{
        width: "100%", bgcolor: "#fd6e60", color: "#ffffff", py: 2, borderRadius: "16px", fontWeight: 700, fontSize: "1.125rem",
        textTransform: "none", display: "flex", gap: 1, boxShadow: "0 10px 15px -3px rgba(253, 110, 96, 0.2)",
        transition: "all 0.3s", "&:hover": { bgcolor: "#ac332a", transform: "translateY(-1px)" },
        "&.Mui-disabled": { bgcolor: "#f3f3f6", color: "#777587" },
        ...props.sx
      }}
    >
      {isLoading ? loadingText : children}
      {!isLoading && <ArrowForward sx={{ transition: "transform 0.2s", ".MuiButton-root:hover &": { transform: "translateX(4px)" } }} />}
    </Button>
  );
};

export default AppPrimaryButton;
