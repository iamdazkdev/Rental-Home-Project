const router = require("express").Router();
const { RentalAgreement, RentalPayment, RentalStatus } = require("../models/RoomRental");
const Notification = require("../models/Notification");
const { canTerminateRental } = require("../services/roomRentalValidation");

// Helper: Create notification
const createNotification = async (userId, type, message, link) => {
  try {
    await Notification.create({
      userId,
      type,
      message,
      link,
    });
  } catch (error) {
    console.error("Error creating notification:", error);
  }
};

// Helper: Generate monthly rent for next month
const generateMonthlyRent = (year, month, agreement) => {
  const monthStr = `${year}-${String(month).padStart(2, "0")}`;
  const dueDate = new Date(year, month - 1, 5); // Due on 5th

  return {
    agreementId: agreement._id,
    tenantId: agreement.tenantId,
    hostId: agreement.hostId,
    amount: agreement.rentAmount,
    paymentType: "MONTHLY",
    method: agreement.paymentMethod,
    status: "UNPAID",
    dueDate,
    month: monthStr,
  };
};

/**
 * POST /room-rental/monthly-rent/generate
 * Generate monthly rent records for active rentals
 */
router.post("/monthly-rent/generate", async (req, res) => {
  try {
    const { month, year } = req.body; // Format: month: 1-12, year: 2025

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: "Month and year are required",
      });
    }

    // Get all active agreements
    const activeAgreements = await RentalAgreement.find({ status: "ACTIVE" });

    const monthStr = `${year}-${String(month).padStart(2, "0")}`;
    const generatedPayments = [];
    const errors = [];

    for (const agreement of activeAgreements) {
      try {
        // Check if payment already exists
        const existingPayment = await RentalPayment.findOne({
          agreementId: agreement._id,
          paymentType: "MONTHLY",
          month: monthStr,
        });

        if (existingPayment) {
          console.log(`ℹ️ Monthly rent for ${monthStr} already exists for agreement ${agreement._id}`);
          continue;
        }

        // Generate payment
        const paymentData = generateMonthlyRent(year, month, agreement);
        const payment = await RentalPayment.create(paymentData);

        generatedPayments.push(payment);

        // Notify tenant
        await createNotification(
          agreement.tenantId,
          "rent_due",
          `Monthly rent for ${monthStr} is due on ${new Date(paymentData.dueDate).toLocaleDateString()}`,
          `/room-rental/payments/${payment._id}`
        );

        console.log(`✅ Generated monthly rent for agreement ${agreement._id}, month ${monthStr}`);
      } catch (error) {
        console.error(`Error generating rent for agreement ${agreement._id}:`, error);
        errors.push({
          agreementId: agreement._id,
          error: error.message,
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Generated ${generatedPayments.length} monthly rent records`,
      count: generatedPayments.length,
      payments: generatedPayments,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Error generating monthly rent:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate monthly rent",
      error: error.message,
    });
  }
});

/**
 * GET /room-rental/payments/tenant/:tenantId
 * Get all payments for a tenant
 */
router.get("/payments/tenant/:tenantId", async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { status } = req.query;

    const query = { tenantId };
    if (status) {
      query.status = status;
    }

    const payments = await RentalPayment.find(query)
      .populate("agreementId")
      .populate("hostId", "firstName lastName profileImagePath")
      .sort({ dueDate: -1 });

    res.status(200).json({
      success: true,
      count: payments.length,
      payments,
    });
  } catch (error) {
    console.error("Error fetching tenant payments:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch payments",
      error: error.message,
    });
  }
});

/**
 * GET /room-rental/payments/host/:hostId
 * Get all payments for a host
 */
router.get("/payments/host/:hostId", async (req, res) => {
  try {
    const { hostId } = req.params;
    const { status } = req.query;

    const query = { hostId };
    if (status) {
      query.status = status;
    }

    const payments = await RentalPayment.find(query)
      .populate("agreementId")
      .populate("tenantId", "firstName lastName profileImagePath")
      .sort({ dueDate: -1 });

    res.status(200).json({
      success: true,
      count: payments.length,
      payments,
    });
  } catch (error) {
    console.error("Error fetching host payments:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch payments",
      error: error.message,
    });
  }
});

/**
 * POST /room-rental/termination/request
 * Request rental termination
 */
router.post("/termination/request", async (req, res) => {
  try {
    const { agreementId, userId, reason } = req.body;

    const validation = await canTerminateRental(agreementId, userId);

    if (!validation.canTerminate) {
      return res.status(400).json({
        success: false,
        message: validation.reason,
      });
    }

    const { agreement, rentalStatus, requestedBy } = validation;

    // Calculate expected move-out date based on notice period
    const noticePeriod = agreement.noticePeriod || 30;
    const expectedMoveOutDate = new Date();
    expectedMoveOutDate.setDate(expectedMoveOutDate.getDate() + noticePeriod);

    // Update rental status
    rentalStatus.status = "TERMINATING";
    rentalStatus.terminationRequestedBy = userId;
    rentalStatus.terminationRequestedAt = new Date();
    rentalStatus.terminationReason = reason || "No reason provided";
    rentalStatus.expectedMoveOutDate = expectedMoveOutDate;
    await rentalStatus.save();

    console.log(`✅ Termination requested by ${requestedBy}`);

    // Notify the other party
    const otherParty = requestedBy === "tenant" ? agreement.hostId : agreement.tenantId;
    await createNotification(
      otherParty,
      "termination_requested",
      `${requestedBy === "tenant" ? "Tenant" : "Host"} has requested to terminate the rental. Expected move-out: ${expectedMoveOutDate.toLocaleDateString()}`,
      `/room-rental/status/${rentalStatus._id}`
    );

    res.status(200).json({
      success: true,
      message: "Termination request submitted",
      rentalStatus,
      expectedMoveOutDate,
    });
  } catch (error) {
    console.error("Error requesting termination:", error);
    res.status(500).json({
      success: false,
      message: "Failed to request termination",
      error: error.message,
    });
  }
});

/**
 * PUT /room-rental/move-out/:statusId/confirm
 * Confirm move-out and complete rental
 */
router.put("/move-out/:statusId/confirm", async (req, res) => {
  try {
    const { statusId } = req.params;
    const { hostId, depositRefundAmount, depositRefundReason } = req.body;

    const rentalStatus = await RentalStatus.findById(statusId).populate("agreementId");

    if (!rentalStatus) {
      return res.status(404).json({
        success: false,
        message: "Rental status not found",
      });
    }

    if (rentalStatus.status !== "TERMINATING") {
      return res.status(400).json({
        success: false,
        message: "Rental is not in terminating status",
      });
    }

    if (rentalStatus.hostId.toString() !== hostId) {
      return res.status(403).json({
        success: false,
        message: "Only host can confirm move-out and complete rental",
      });
    }

    // Update rental status
    rentalStatus.status = "COMPLETED";
    rentalStatus.actualMoveOutDate = new Date();
    rentalStatus.depositRefundAmount = depositRefundAmount || 0;
    rentalStatus.depositRefundReason = depositRefundReason || "";
    rentalStatus.completedAt = new Date();
    await rentalStatus.save();

    // Update agreement status
    const agreement = await RentalAgreement.findById(rentalStatus.agreementId);
    if (agreement) {
      agreement.status = "TERMINATED";
      agreement.endDate = new Date();
      await agreement.save();
    }

    console.log("✅ Rental completed and terminated");

    // Notify tenant
    await createNotification(
      rentalStatus.tenantId,
      "rental_completed",
      `Move-out confirmed. Rental completed. ${depositRefundAmount ? `Deposit refund: ${depositRefundAmount}` : ""}`,
      `/room-rental/status/${rentalStatus._id}`
    );

    res.status(200).json({
      success: true,
      message: "Move-out confirmed and rental completed",
      rentalStatus,
    });
  } catch (error) {
    console.error("Error confirming move-out:", error);
    res.status(500).json({
      success: false,
      message: "Failed to confirm move-out",
      error: error.message,
    });
  }
});

/**
 * GET /room-rental/status/tenant/:tenantId
 * Get rental status for tenant
 */
router.get("/status/tenant/:tenantId", async (req, res) => {
  try {
    const { tenantId } = req.params;

    const statuses = await RentalStatus.find({ tenantId })
      .populate({
        path: "agreementId",
        populate: {
          path: "roomId",
          select: "title price listingPhotoPaths city province",
        },
      })
      .populate("hostId", "firstName lastName profileImagePath")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: statuses.length,
      statuses,
    });
  } catch (error) {
    console.error("Error fetching tenant rental status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch rental status",
      error: error.message,
    });
  }
});

/**
 * GET /room-rental/status/host/:hostId
 * Get rental status for host's rooms
 */
router.get("/status/host/:hostId", async (req, res) => {
  try {
    const { hostId } = req.params;

    const statuses = await RentalStatus.find({ hostId })
      .populate({
        path: "agreementId",
        populate: {
          path: "roomId",
          select: "title price listingPhotoPaths city province",
        },
      })
      .populate("tenantId", "firstName lastName profileImagePath")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: statuses.length,
      statuses,
    });
  } catch (error) {
    console.error("Error fetching host rental status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch rental status",
      error: error.message,
    });
  }
});

/**
 * GET /room-rental/dashboard/tenant/:tenantId
 * Get dashboard summary for tenant
 */
router.get("/dashboard/tenant/:tenantId", async (req, res) => {
  try {
    const { tenantId } = req.params;

    // Get active rentals
    const activeRentals = await RentalStatus.find({
      tenantId,
      status: { $in: ["PENDING_MOVE_IN", "ACTIVE"] },
    })
      .populate({
        path: "agreementId",
        populate: {
          path: "roomId",
          select: "title price listingPhotoPaths city province",
        },
      })
      .populate("hostId", "firstName lastName profileImagePath");

    // Get pending payments
    const pendingPayments = await RentalPayment.find({
      tenantId,
      status: { $in: ["UNPAID", "PARTIALLY_PAID"] },
    })
      .populate({
        path: "agreementId",
        populate: {
          path: "roomId",
          select: "title",
        },
      })
      .sort({ dueDate: 1 })
      .limit(5);

    // Get pending requests
    const pendingRequests = await require("../models/RoomRental").RentalRequest.find({
      tenantId,
      status: "REQUESTED",
    })
      .populate("roomId", "title price listingPhotoPaths")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      dashboard: {
        activeRentals,
        pendingPayments,
        pendingRequests,
      },
    });
  } catch (error) {
    console.error("Error fetching tenant dashboard:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard",
      error: error.message,
    });
  }
});

/**
 * GET /room-rental/dashboard/host/:hostId
 * Get dashboard summary for host
 */
router.get("/dashboard/host/:hostId", async (req, res) => {
  try {
    const { hostId } = req.params;

    // Get active rentals
    const activeRentals = await RentalStatus.find({
      hostId,
      status: { $in: ["PENDING_MOVE_IN", "ACTIVE"] },
    })
      .populate({
        path: "agreementId",
        populate: {
          path: "roomId",
          select: "title price listingPhotoPaths city province",
        },
      })
      .populate("tenantId", "firstName lastName profileImagePath");

    // Get pending requests
    const pendingRequests = await require("../models/RoomRental").RentalRequest.find({
      hostId,
      status: "REQUESTED",
    })
      .populate("roomId", "title price listingPhotoPaths")
      .populate("tenantId", "firstName lastName profileImagePath")
      .sort({ createdAt: -1 });

    // Get expected payments
    const expectedPayments = await RentalPayment.find({
      hostId,
      status: { $in: ["UNPAID", "PARTIALLY_PAID"] },
    })
      .populate({
        path: "agreementId",
        populate: {
          path: "roomId",
          select: "title",
        },
      })
      .populate("tenantId", "firstName lastName")
      .sort({ dueDate: 1 })
      .limit(5);

    res.status(200).json({
      success: true,
      dashboard: {
        activeRentals,
        pendingRequests,
        expectedPayments,
      },
    });
  } catch (error) {
    console.error("Error fetching host dashboard:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard",
      error: error.message,
    });
  }
});

module.exports = router;

