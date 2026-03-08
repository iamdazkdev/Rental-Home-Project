const router = require("express").Router();
const { upload } = require("../services/cloudinaryService");
const ctrl = require("../controllers/auth.controller");

/* REGISTER — with profile image upload */
router.post("/register", (req, res, next) => {
    upload.single("profileImage")(req, res, (err) => {
        if (err) {
            if (err.message.includes("Only image files are allowed")) {
                return res.status(400).json({ success: false, message: "Invalid file type. Please upload an image file." });
            }
            if (err.code === "LIMIT_FILE_SIZE") {
                return res.status(400).json({ success: false, message: "File size too large. Maximum size is 10MB." });
            }
            return res.status(400).json({ success: false, message: "File upload error", error: err.message });
        }
        next();
    });
}, ctrl.register);

/* LOGIN */
router.post("/login", ctrl.login);

/* FORGOT PASSWORD */
router.post("/forgot-password", ctrl.forgotPassword);

/* VERIFY RESET TOKEN */
router.get("/verify-reset-token", ctrl.verifyResetToken);

/* RESET PASSWORD */
router.post("/reset-password", ctrl.resetPassword);

module.exports = router;
