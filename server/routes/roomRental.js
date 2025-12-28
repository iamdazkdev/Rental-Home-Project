const router = require("express").Router();
const RoomRentalApplication = require("../models/RoomRentalApplication");
const Listing = require("../models/Listing");
const User = require("../models/User");
const compatibilityService = require("../services/compatibilityService");

/**
 * POST /room-rental/apply
 * Apply for a room rental
 */
router.post("/apply", async (req, res) => {
  try {
    const {
      listingId,
      applicantNotes,
      tenantInfo,
    } = req.body;

    const applicantId = req.body.applicantId; // From auth middleware

    // Validate listing exists and is a room type
    const listing = await Listing.findById(listingId).populate("creator");
    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    if (listing.type !== "Room" && listing.type !== "Shared Room") {
      return res.status(400).json({
        message: "This listing is not a room rental",
      });
    }

    // Check if user already applied
    const existingApplication = await RoomRentalApplication.findOne({
      applicantId,
      listingId,
      status: { $nin: ["rejected", "withdrawn"] },
    });

    if (existingApplication) {
      return res.status(400).json({
        message: "You have already applied for this room",
      });
    }

    // Get host and tenant profiles
    const host = await User.findById(listing.creator._id);
    const tenant = await User.findById(applicantId);

    // Calculate compatibility
    const hostProfile = listing.hostProfile || {};
    const tenantProfile = tenant.lifestyleProfile || {};

    const compatibility = compatibilityService.calculateCompatibility(
      hostProfile,
      tenantProfile
    );

    // Check for deal breakers
    const dealBreakers = compatibilityService.haseDealBreakers(
      hostProfile,
      tenantProfile
    );

    if (dealBreakers.length > 0) {
      return res.status(400).json({
        message: "Your profile has conflicts with host preferences",
        dealBreakers,
      });
    }

    // Require minimum compatibility score (50%)
    if (compatibility.score < 50) {
      return res.status(400).json({
        message: "Compatibility score too low",
        score: compatibility.score,
        recommendation: "Please find a better match",
      });
    }

    // Create application
    const application = new RoomRentalApplication({
      applicantId,
      listingId,
      hostId: listing.creator._id,
      compatibilityScore: compatibility.score,
      compatibilityBreakdown: compatibility.breakdown,
      applicantNotes,
      tenantInfo,
      status: "applied",
    });

    await application.save();

    // TODO: Send notification to host

    res.status(201).json({
      message: "Application submitted successfully",
      application,
      compatibility,
    });
  } catch (error) {
    console.error("Error applying for room:", error);
    res.status(500).json({ message: "Failed to submit application" });
  }
});

/**
 * GET /room-rental/applications/tenant/:tenantId
 * Get all applications by a tenant
 */
router.get("/applications/tenant/:tenantId", async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { status } = req.query;

    const query = { applicantId: tenantId };
    if (status) {
      query.status = status;
    }

    const applications = await RoomRentalApplication.find(query)
      .populate("listingId")
      .populate("hostId", "firstName lastName profileImagePath")
      .sort({ createdAt: -1 });

    res.status(200).json({ applications });
  } catch (error) {
    console.error("Error fetching tenant applications:", error);
    res.status(500).json({ message: "Failed to fetch applications" });
  }
});

/**
 * GET /room-rental/applications/host/:hostId
 * Get all applications received by a host
 */
router.get("/applications/host/:hostId", async (req, res) => {
  try {
    const { hostId } = req.params;
    const { status, sortBy } = req.query;

    const query = { hostId };
    if (status) {
      query.status = status;
    }

    let sort = { createdAt: -1 }; // Default: newest first
    if (sortBy === "compatibility") {
      sort = { compatibilityScore: -1 }; // Highest compatibility first
    }

    const applications = await RoomRentalApplication.find(query)
      .populate("listingId", "title streetAddress city")
      .populate("applicantId", "firstName lastName profileImagePath email")
      .sort(sort);

    res.status(200).json({ applications });
  } catch (error) {
    console.error("Error fetching host applications:", error);
    res.status(500).json({ message: "Failed to fetch applications" });
  }
});

/**
 * POST /room-rental/applications/:id/review
 * Host reviews application and changes status
 */
router.post("/applications/:id/review", async (req, res) => {
  try {
    const { id } = req.params;
    const { action, hostNotes } = req.body;
    // action: 'accept_review', 'schedule_interview', 'reject'

    const application = await RoomRentalApplication.findById(id);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    if (application.status !== "applied") {
      return res.status(400).json({
        message: "Application is no longer in 'applied' status",
      });
    }

    if (action === "accept_review") {
      application.status = "under_review";
      application.reviewedAt = new Date();
    } else if (action === "schedule_interview") {
      application.status = "interview_scheduled";
    } else if (action === "reject") {
      application.status = "rejected";
      application.rejection = {
        rejectedBy: "host",
        reason: hostNotes,
        rejectedAt: new Date(),
      };
    }

    if (hostNotes) {
      application.hostNotes = hostNotes;
    }

    await application.save();

    res.status(200).json({
      message: "Application updated successfully",
      application,
    });
  } catch (error) {
    console.error("Error reviewing application:", error);
    res.status(500).json({ message: "Failed to review application" });
  }
});

/**
 * POST /room-rental/applications/:id/schedule-interview
 * Schedule interview with tenant
 */
router.post("/applications/:id/schedule-interview", async (req, res) => {
  try {
    const { id } = req.params;
    const { scheduledDate, scheduledTime, meetingType, meetingLink } =
      req.body;

    const application = await RoomRentalApplication.findById(id);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    application.status = "interview_scheduled";
    application.interview = {
      scheduledDate,
      scheduledTime,
      meetingType,
      meetingLink,
      completed: false,
    };
    application.interviewScheduledAt = new Date();

    await application.save();

    // TODO: Send notification to tenant

    res.status(200).json({
      message: "Interview scheduled successfully",
      application,
    });
  } catch (error) {
    console.error("Error scheduling interview:", error);
    res.status(500).json({ message: "Failed to schedule interview" });
  }
});

/**
 * POST /room-rental/applications/:id/make-offer
 * Host makes an offer to tenant
 */
router.post("/applications/:id/make-offer", async (req, res) => {
  try {
    const { id } = req.params;
    const { monthlyRent, depositAmount, moveInDate, leaseDuration, specialTerms } =
      req.body;

    const application = await RoomRentalApplication.findById(id);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    if (application.status !== "interview_scheduled") {
      return res.status(400).json({
        message: "Interview must be completed first",
      });
    }

    // Offer expires in 7 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    application.status = "offer_made";
    application.offer = {
      monthlyRent,
      depositAmount: depositAmount || monthlyRent, // Default: 1 month rent
      moveInDate,
      leaseDuration,
      specialTerms,
      expiresAt,
      offeredAt: new Date(),
    };
    application.offerMadeAt = new Date();

    await application.save();

    // TODO: Send notification to tenant

    res.status(200).json({
      message: "Offer made successfully",
      application,
    });
  } catch (error) {
    console.error("Error making offer:", error);
    res.status(500).json({ message: "Failed to make offer" });
  }
});

/**
 * POST /room-rental/applications/:id/respond-offer
 * Tenant responds to offer (accept/decline)
 */
router.post("/applications/:id/respond-offer", async (req, res) => {
  try {
    const { id } = req.params;
    const { accepted, message } = req.body;

    const application = await RoomRentalApplication.findById(id);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    if (application.status !== "offer_made") {
      return res.status(400).json({ message: "No offer to respond to" });
    }

    // Check if offer expired
    if (new Date() > application.offer.expiresAt) {
      return res.status(400).json({ message: "Offer has expired" });
    }

    application.tenantResponse = {
      accepted,
      responseDate: new Date(),
      message,
    };

    if (accepted) {
      application.status = "accepted";
      application.acceptedAt = new Date();
    } else {
      application.status = "rejected";
      application.rejection = {
        rejectedBy: "applicant",
        reason: message,
        rejectedAt: new Date(),
      };
    }

    await application.save();

    res.status(200).json({
      message: accepted ? "Offer accepted!" : "Offer declined",
      application,
    });
  } catch (error) {
    console.error("Error responding to offer:", error);
    res.status(500).json({ message: "Failed to respond to offer" });
  }
});

/**
 * POST /room-rental/applications/:id/sign-contract
 * Finalize contract (after offer accepted)
 */
router.post("/applications/:id/sign-contract", async (req, res) => {
  try {
    const { id } = req.params;
    const { contractUrl, depositPaid } = req.body;

    const application = await RoomRentalApplication.findById(id);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    if (application.status !== "accepted") {
      return res.status(400).json({
        message: "Offer must be accepted first",
      });
    }

    const endDate = new Date(application.offer.moveInDate);
    endDate.setMonth(endDate.getMonth() + application.offer.leaseDuration);

    application.status = "contracted";
    application.contract = {
      signed: true,
      signedAt: new Date(),
      contractUrl,
      startDate: application.offer.moveInDate,
      endDate,
      monthlyRent: application.offer.monthlyRent,
      depositPaid,
      depositAmount: application.offer.depositAmount,
    };
    application.contractedAt = new Date();

    await application.save();

    res.status(200).json({
      message: "Contract signed successfully!",
      application,
    });
  } catch (error) {
    console.error("Error signing contract:", error);
    res.status(500).json({ message: "Failed to sign contract" });
  }
});

/**
 * POST /room-rental/applications/:id/withdraw
 * Tenant withdraws application
 */
router.post("/applications/:id/withdraw", async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const application = await RoomRentalApplication.findById(id);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    if (["accepted", "contracted"].includes(application.status)) {
      return res.status(400).json({
        message: "Cannot withdraw at this stage",
      });
    }

    application.status = "withdrawn";
    application.rejection = {
      rejectedBy: "applicant",
      reason,
      rejectedAt: new Date(),
    };

    await application.save();

    res.status(200).json({
      message: "Application withdrawn",
      application,
    });
  } catch (error) {
    console.error("Error withdrawing application:", error);
    res.status(500).json({ message: "Failed to withdraw application" });
  }
});

/**
 * GET /room-rental/compatibility/:listingId/:userId
 * Preview compatibility score before applying
 */
router.get("/compatibility/:listingId/:userId", async (req, res) => {
  try {
    const { listingId, userId } = req.params;

    const listing = await Listing.findById(listingId);
    const user = await User.findById(userId);

    if (!listing || !user) {
      return res.status(404).json({ message: "Listing or user not found" });
    }

    const compatibility = compatibilityService.calculateCompatibility(
      listing.hostProfile || {},
      user.lifestyleProfile || {}
    );

    const dealBreakers = compatibilityService.haseDealBreakers(
      listing.hostProfile || {},
      user.lifestyleProfile || {}
    );

    res.status(200).json({
      compatibility,
      dealBreakers,
      canApply: dealBreakers.length === 0 && compatibility.score >= 50,
    });
  } catch (error) {
    console.error("Error checking compatibility:", error);
    res.status(500).json({ message: "Failed to check compatibility" });
  }
});

module.exports = router;

