const router = require("express").Router();
const multer = require("multer");
const IdentityVerification = require("../models/IdentityVerification");
const { uploadToCloudinary } = require("../services/cloudinaryService");

// Verify uploadToCloudinary function exists
console.log("🔍 [Identity Verification] uploadToCloudinary function:", typeof uploadToCloudinary);
if (typeof uploadToCloudinary !== 'function') {
  console.error("❌ [Identity Verification] uploadToCloudinary is not a function!");
}

// Multer config for ID card images
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"), false);
    }
  },
});

// GET: Check verification status
router.get("/:userId/status", async (req, res) => {
  try {
    const { userId } = req.params;

    console.log("🔍 [Identity Verification] Checking status for user:", userId);

    if (!userId || userId === 'undefined') {
      console.log("❌ [Identity Verification] Invalid userId:", userId);
      return res.status(400).json({
        exists: false,
        status: null,
        message: "Invalid user ID",
      });
    }

    const verification = await IdentityVerification.findOne({ userId });

    if (!verification) {
      console.log("📝 [Identity Verification] No verification found for user:", userId);
      return res.json({
        exists: false,
        status: null,
        message: "No verification found. Please submit your identity documents.",
      });
    }

    console.log("✅ [Identity Verification] Found verification, status:", verification.status);
    res.json({
      exists: true,
      status: verification.status,
      verification: {
        fullName: verification.fullName,
        phoneNumber: verification.phoneNumber,
        dateOfBirth: verification.dateOfBirth,
        idCardFront: verification.idCardFront,
        idCardBack: verification.idCardBack,
        submittedAt: verification.submittedAt,
        reviewedAt: verification.reviewedAt,
        rejectionReason: verification.rejectionReason,
      },
    });
  } catch (error) {
    console.error("❌ [Identity Verification] Error checking status:", error);
    res.status(500).json({ message: "Failed to check verification status", error: error.message });
  }
});

// POST: Submit identity verification
router.post(
  "/submit",
  upload.fields([
    { name: "idCardFront", maxCount: 1 },
    { name: "idCardBack", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { userId, fullName, phoneNumber, dateOfBirth } = req.body;

      console.log("📥 [Identity Verification] Submit request received:", {
        userId,
        fullName,
        phoneNumber,
        dateOfBirth,
        hasIdCardFront: !!req.files?.idCardFront,
        hasIdCardBack: !!req.files?.idCardBack
      });

      // Validation
      if (!userId || !fullName || !phoneNumber || !dateOfBirth) {
        return res.status(400).json({ message: "All fields are required" });
      }

      // Check if verification already exists
      let verification = await IdentityVerification.findOne({ userId });
      const isUpdate = !!verification;

      // For new submissions, require both images
      if (!isUpdate && (!req.files?.idCardFront || !req.files?.idCardBack)) {
        return res.status(400).json({ message: "Both ID card images are required for new submission" });
      }

      let frontImageUrl = verification?.idCardFront;
      let backImageUrl = verification?.idCardBack;

      // Upload new images if provided
      if (req.files?.idCardFront) {
        console.log("📤 [Identity Verification] Uploading front ID card image...");
        console.log("📁 [Identity Verification] File details:", {
          fieldname: req.files.idCardFront[0].fieldname,
          originalname: req.files.idCardFront[0].originalname,
          mimetype: req.files.idCardFront[0].mimetype,
          size: req.files.idCardFront[0].size,
          hasBuffer: !!req.files.idCardFront[0].buffer
        });

        try {
          const frontImageResult = await uploadToCloudinary(req.files.idCardFront[0], "id-cards");
          frontImageUrl = frontImageResult.url;
          console.log("✅ [Identity Verification] Front image uploaded:", frontImageUrl);
        } catch (uploadError) {
          console.error("❌ [Identity Verification] Failed to upload front image:", uploadError);
          throw new Error(`Failed to upload front image: ${uploadError.message}`);
        }
      }

      if (req.files?.idCardBack) {
        console.log("📤 [Identity Verification] Uploading back ID card image...");
        console.log("📁 [Identity Verification] File details:", {
          fieldname: req.files.idCardBack[0].fieldname,
          originalname: req.files.idCardBack[0].originalname,
          mimetype: req.files.idCardBack[0].mimetype,
          size: req.files.idCardBack[0].size,
          hasBuffer: !!req.files.idCardBack[0].buffer
        });

        try {
          const backImageResult = await uploadToCloudinary(req.files.idCardBack[0], "id-cards");
          backImageUrl = backImageResult.url;
          console.log("✅ [Identity Verification] Back image uploaded:", backImageUrl);
        } catch (uploadError) {
          console.error("❌ [Identity Verification] Failed to upload back image:", uploadError);
          throw new Error(`Failed to upload back image: ${uploadError.message}`);
        }
      }

      if (verification) {
        // Update existing verification (resubmit)
        verification.fullName = fullName;
        verification.phoneNumber = phoneNumber;
        verification.dateOfBirth = dateOfBirth;
        verification.idCardFront = frontImageUrl;
        verification.idCardBack = backImageUrl;
        verification.status = "pending"; // Reset to pending
        verification.submittedAt = new Date();
        verification.rejectionReason = "";
        verification.reviewedAt = null;
        verification.reviewedBy = null;

        await verification.save();
        console.log("✅ Identity verification updated (resubmitted)");
      } else {
        // Create new verification
        verification = new IdentityVerification({
          userId,
          fullName,
          phoneNumber,
          dateOfBirth,
          idCardFront: frontImageUrl,
          idCardBack: backImageUrl,
          status: "pending",
        });

        await verification.save();
        console.log("✅ New identity verification submitted");
      }

      res.status(201).json({
        message: "Identity verification submitted successfully. Please wait for admin approval.",
        verification: {
          status: verification.status,
          submittedAt: verification.submittedAt,
        },
      });
    } catch (error) {
      console.error("❌ Error submitting verification:", error);
      res.status(500).json({ message: "Failed to submit verification", error: error.message });
    }
  }
);

// PATCH: Update verification status (Admin only)
router.patch("/:verificationId/review", async (req, res) => {
  try {
    const { verificationId } = req.params;
    const { status, rejectionReason, adminId } = req.body;

    // Validation
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    if (status === "rejected" && !rejectionReason) {
      return res.status(400).json({ message: "Rejection reason is required" });
    }

    const verification = await IdentityVerification.findById(verificationId);

    if (!verification) {
      return res.status(404).json({ message: "Verification not found" });
    }

    verification.status = status;
    verification.reviewedAt = new Date();
    verification.reviewedBy = adminId;

    if (status === "rejected") {
      verification.rejectionReason = rejectionReason;
    } else {
      verification.rejectionReason = "";
    }

    await verification.save();

    console.log(`✅ Verification ${status}: ${verificationId}`);

    res.json({
      message: `Verification ${status} successfully`,
      verification,
    });
  } catch (error) {
    console.error("❌ Error reviewing verification:", error);
    res.status(500).json({ message: "Failed to review verification", error: error.message });
  }
});

// GET: Get all verifications (Admin only)
router.get("/admin/all", async (req, res) => {
  try {
    const { status } = req.query;

    const filter = status && status !== "all" ? { status } : {};

    const verifications = await IdentityVerification.find(filter)
      .populate("userId", "firstName lastName email profileImagePath")
      .populate("reviewedBy", "firstName lastName")
      .sort({ submittedAt: -1 });

    res.json({
      verifications,
      total: verifications.length,
    });
  } catch (error) {
    console.error("❌ Error fetching verifications:", error);
    res.status(500).json({ message: "Failed to fetch verifications", error: error.message });
  }
});

module.exports = router;

