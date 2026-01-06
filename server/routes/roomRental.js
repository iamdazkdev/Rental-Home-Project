const router = require("express").Router();
const { RentalRequest, RentalAgreement, RentalPayment, RentalStatus } = require("../models/RoomRental");
const Listing = require("../models/Listing");
const User = require("../models/User");
const Notification = require("../models/Notification");
const { upload } = require("../services/cloudinaryService");
const {
  validateRentalRequest,
  validateAgreementAcceptance,
  validatePaymentCreation,
  canTerminateRental,
  isRoomAvailable,
} = require("../services/roomRentalValidation");

// Helper: Create notification for Room Rental
const createNotification = async (userId, type, message, link, rentalRequestId = null) => {
  try {
    // Validate notification type for Room Rental
    const validRentalTypes = [
      "rental_request",
      "rental_accepted",
      "rental_approved",
      "rental_rejected",
      "rental_cancelled",
      "rental_agreement_created",
      "rental_agreement_signed",
      "rental_agreement_confirmed",
      "rental_agreement_active",
      "rental_agreement_tenant_accepted",
      "rental_move_in",
      "rental_move_in_confirmed",
      "rental_move_out",
      "rental_payment_due",
      "rental_payment_received",
      "rental_payment_confirmed",
      "rental_terminated",
      "rental_termination_request",
      "system_notification"
    ];

    if (!validRentalTypes.includes(type)) {
      console.warn(`⚠️ Invalid notification type for Room Rental: ${type}`);
      return;
    }

    const notificationData = {
      userId,
      type,
      message,
      link: link || "",
    };

    // Add rentalRequestId if provided (for Room Rental notifications)
    if (rentalRequestId) {
      notificationData.rentalRequestId = rentalRequestId;
    }

    const notification = await Notification.create(notificationData);
    console.log(`✅ Notification created for user ${userId}, type: ${type}, id: ${notification._id}`);
  } catch (error) {
    console.error("❌ Error creating Room Rental notification:", error.message);
    // Log more details for debugging
    console.error("Notification data attempted:", { userId, type, message, link, rentalRequestId });
  }
};

// ============================================
// PHASE 1: CORE FLOW
// ============================================

/**
 * POST /room-rental/rooms/create
 * Create a new room rental listing
 * This is used when a host wants to list a room for monthly rental
 */
router.post("/rooms/create", upload.array("roomPhotos"), async (req, res) => {
  try {
    const {
      hostId,
      category,
      type,
      streetAddress,
      aptSuite,
      city,
      province,
      country,
      guestCount,
      bedroomCount,
      bedCount,
      bathroomCount,
      amenities,
      title,
      description,
      highlight,
      highlightDesc,
      monthlyRent,
      depositAmount,
      roomArea, // Room area in m²
      hostBio,
      hostProfile,
    } = req.body;

    console.log("🏠 Creating Room Rental listing for host:", hostId);
    console.log("📤 Request body:", req.body);
    console.log("📸 Uploaded files:", req.files?.length || 0);

    // Validate required fields
    if (!hostId) {
      return res.status(400).json({
        success: false,
        message: "Host ID is required",
      });
    }

    if (!monthlyRent) {
      return res.status(400).json({
        success: false,
        message: "Monthly rent is required",
      });
    }

    // Process uploaded photos
    const listingPhotoPaths = req.files ? req.files.map((file) => file.path) : [];

    console.log("📷 Processed photo paths:", listingPhotoPaths);

    // Parse JSON fields if they're strings
    const parsedAmenities = typeof amenities === "string" ? JSON.parse(amenities) : amenities;
    const parsedHostProfile = typeof hostProfile === "string" ? JSON.parse(hostProfile) : hostProfile;

    // Calculate daily rate from monthly (for display purposes only)
    const dailyPrice = Math.round((parseFloat(monthlyRent) / 30) * 100) / 100;

    // Create listing data
    const listingData = {
      creator: hostId,
      category: category || "Apartment",
      type: type || "Room(s)", // Default to Room(s) for room rental
      streetAddress: streetAddress || "",
      aptSuite: aptSuite || "",
      city: city || "",
      province: province || "",
      country: country || "",
      guestCount: parseInt(guestCount) || 1,
      bedroomCount: parseInt(bedroomCount) || 1,
      bedCount: parseInt(bedCount) || 1,
      bathroomCount: parseInt(bathroomCount) || 1,
      amenities: parsedAmenities || [],
      listingPhotoPaths,
      title: title || "Room for Rent",
      description: description || "",
      price: dailyPrice, // Store daily equivalent for compatibility
      monthlyRent: parseFloat(monthlyRent), // Store actual monthly rent
      depositAmount: depositAmount ? parseFloat(depositAmount) : parseFloat(monthlyRent), // Default: 1 month deposit
      roomArea: roomArea ? parseFloat(roomArea) : null, // Room area in m²
      hostBio: hostBio || "",
      hostProfile: parsedHostProfile || {},
      rentalType: "MONTHLY", // Mark as monthly rental
      isActive: true,
    };

    // Add optional fields only if they exist
    if (highlight && highlight.trim()) {
      listingData.highlight = highlight;
    }
    if (highlightDesc && highlightDesc.trim()) {
      listingData.highlightDesc = highlightDesc;
    }

    console.log("📝 Listing data to save:", listingData);

    // Create the listing
    const newListing = new Listing(listingData);
    await newListing.save();

    // Update user's property list
    await User.findByIdAndUpdate(hostId, {
      $push: { propertyList: newListing._id },
    });

    console.log("✅ Room rental listing created:", newListing._id);

    res.status(201).json({
      success: true,
      message: "Room rental listing created successfully",
      listing: newListing,
    });
  } catch (error) {
    console.error("❌ Error creating room rental listing:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create room rental listing",
      error: error.message,
    });
  }
});

/**
 * GET /room-rental/search
 * Search available rooms for rental
 */
router.get("/search", async (req, res) => {
  try {
    const { location, minPrice, maxPrice, amenities } = req.query;

    console.log("🔍 Room rental search - query params:", req.query);

    // Base query for rooms - type must be "Room(s)" or contain "room" and must be active
    const typeCondition = {
      $and: [
        { isActive: true },
        {
          $or: [
            { type: "Room(s)" },
            { type: { $regex: /room/i } }
          ]
        }
      ]
    };

    // Build additional conditions
    const conditions = [typeCondition];

    if (location) {
      conditions.push({
        $or: [
          { city: { $regex: location, $options: "i" } },
          { province: { $regex: location, $options: "i" } },
          { country: { $regex: location, $options: "i" } },
        ]
      });
    }

    if (minPrice || maxPrice) {
      const priceCondition = {};
      if (minPrice) priceCondition.$gte = Number(minPrice);
      if (maxPrice) priceCondition.$lte = Number(maxPrice);

      conditions.push({
        $or: [
          { price: priceCondition },
          { monthlyRent: priceCondition }
        ]
      });
    }

    if (amenities) {
      const amenitiesArray = amenities.split(",").map(a => a.trim());
      conditions.push({ amenities: { $all: amenitiesArray } });
    }

    // Combine all conditions with $and
    const query = conditions.length === 1 ? conditions[0] : { $and: conditions };

    console.log("🔍 Room rental search - final query:", JSON.stringify(query, null, 2));

    const rooms = await Listing.find(query)
      .populate("creator", "firstName lastName profileImagePath")
      .sort({ createdAt: -1 });

    console.log(`✅ Room rental search - found ${rooms.length} rooms`);

    // Add availability status to each room
    const roomsWithStatus = await Promise.all(
      rooms.map(async (room) => {
        const roomObj = room.toObject();
        const available = await isRoomAvailable(room._id);
        roomObj.roomAvailabilityStatus = available ? 'AVAILABLE' : 'RENTED';
        return roomObj;
      })
    );

    res.status(200).json({
      success: true,
      count: roomsWithStatus.length,
      rooms: roomsWithStatus,
    });
  } catch (error) {
    console.error("Error searching rooms:", error);
    res.status(500).json({
      success: false,
      message: "Failed to search rooms",
      error: error.message,
    });
  }
});

/**
 * GET /room-rental/host/:hostId/rooms
 * Get all rooms listed by a host (for room management)
 */
router.get("/host/:hostId/rooms", async (req, res) => {
  try {
    const { hostId } = req.params;

    const rooms = await Listing.find({
      creator: hostId,
      type: { $in: ["A Room", "Room(s)", "Room"] }
    })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: rooms.length,
      rooms,
    });
  } catch (error) {
    console.error("Error fetching host rooms:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch rooms",
      error: error.message,
    });
  }
});

/**
 * PATCH /room-rental/rooms/:roomId/toggle-visibility
 * Toggle room visibility (active/inactive)
 */
router.patch("/rooms/:roomId/toggle-visibility", async (req, res) => {
  try {
    const { roomId } = req.params;
    const { isActive } = req.body;

    const room = await Listing.findByIdAndUpdate(
      roomId,
      { isActive },
      { new: true }
    );

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    res.status(200).json({
      success: true,
      message: `Room ${isActive ? 'activated' : 'deactivated'} successfully`,
      room,
    });
  } catch (error) {
    console.error("Error toggling room visibility:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update room visibility",
      error: error.message,
    });
  }
});

/**
 * DELETE /room-rental/rooms/:roomId
 * Delete a room listing
 */
router.delete("/rooms/:roomId", async (req, res) => {
  try {
    const { roomId } = req.params;

    // Check if room has any active rentals or requests
    const activeRequests = await RentalRequest.countDocuments({
      roomId,
      status: { $in: ["REQUESTED", "APPROVED"] }
    });

    if (activeRequests > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete room with active rental requests",
      });
    }

    const room = await Listing.findByIdAndDelete(roomId);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    // Remove from host's property list
    await User.findByIdAndUpdate(room.creator, {
      $pull: { propertyList: roomId }
    });

    res.status(200).json({
      success: true,
      message: "Room deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting room:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete room",
      error: error.message,
    });
  }
});

/**
 * PUT /room-rental/rooms/:roomId
 * Update a room listing
 */
router.put("/rooms/:roomId", upload.array("roomPhotos"), async (req, res) => {
  try {
    const { roomId } = req.params;
    const {
      title,
      description,
      category,
      streetAddress,
      city,
      province,
      country,
      monthlyRent,
      depositAmount,
      roomSize,
      guestCount,
      bedroomCount,
      bedCount,
      bathroomCount,
      amenities,
      isActive,
      existingPhotos
    } = req.body;

    console.log("📝 Updating room:", roomId);

    // Find the room
    const room = await Listing.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    // Parse JSON fields
    const parsedAmenities = typeof amenities === "string" ? JSON.parse(amenities) : amenities;
    const parsedExistingPhotos = typeof existingPhotos === "string" ? JSON.parse(existingPhotos) : existingPhotos;

    // Handle photos
    let listingPhotoPaths = parsedExistingPhotos || [];

    // Add new uploaded photos
    if (req.files && req.files.length > 0) {
      const newPhotoPaths = req.files.map((file) => file.path);
      listingPhotoPaths = [...listingPhotoPaths, ...newPhotoPaths];
    }

    // Update room data
    const updateData = {
      title: title || room.title,
      description: description || room.description,
      category: category || room.category,
      streetAddress: streetAddress || room.streetAddress,
      city: city || room.city,
      province: province || room.province,
      country: country || room.country,
      monthlyRent: monthlyRent ? parseFloat(monthlyRent) : room.monthlyRent,
      price: monthlyRent ? Math.round(parseFloat(monthlyRent) / 30 * 100) / 100 : room.price,
      depositAmount: depositAmount ? parseFloat(depositAmount) : room.depositAmount,
      roomArea: roomSize ? parseFloat(roomSize) : room.roomArea,
      guestCount: guestCount ? parseInt(guestCount) : room.guestCount,
      bedroomCount: bedroomCount ? parseInt(bedroomCount) : room.bedroomCount,
      bedCount: bedCount ? parseInt(bedCount) : room.bedCount,
      bathroomCount: bathroomCount ? parseInt(bathroomCount) : room.bathroomCount,
      amenities: parsedAmenities || room.amenities,
      listingPhotoPaths,
      isActive: isActive !== undefined ? isActive === 'true' || isActive === true : room.isActive,
      updatedAt: new Date()
    };

    const updatedRoom = await Listing.findByIdAndUpdate(
      roomId,
      updateData,
      { new: true }
    );

    console.log("✅ Room updated:", roomId);

    res.status(200).json({
      success: true,
      message: "Room updated successfully",
      room: updatedRoom,
    });
  } catch (error) {
    console.error("Error updating room:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update room",
      error: error.message,
    });
  }
});

/**
 * POST /room-rental/request
 * Submit rental request
 */
router.post("/request", async (req, res) => {
  try {
    const { roomId, tenantId, message, moveInDate, intendedStayDuration } = req.body;

    console.log("📝 Creating rental request:", { roomId, tenantId, moveInDate, intendedStayDuration });
    console.log("📄 Full request body:", req.body);

    // Validate request
    const validation = await validateRentalRequest({
      roomId,
      tenantId,
      message,
      moveInDate,
      intendedStayDuration,
    });

    if (!validation.valid) {
      console.log("❌ Validation failed:", validation.errors);
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.errors,
      });
    }

    const room = validation.room;
    const hostId = room.creator;

    // Create rental request
    const rentalRequest = await RentalRequest.create({
      roomId,
      tenantId,
      hostId,
      message,
      moveInDate,
      intendedStayDuration,
      status: "REQUESTED",
    });

    console.log("✅ Rental request created:", rentalRequest._id);

    // Populate data for response
    await rentalRequest.populate([
      { path: "roomId", select: "title price listingPhotoPaths city province" },
      { path: "tenantId", select: "firstName lastName email profileImagePath" },
    ]);

    // Create notification for host
    await createNotification(
      hostId,
      "rental_request",
      `New rental request from ${req.body.tenantName || "a tenant"} for your room`,
      `/room-rental/requests/${rentalRequest._id}`,
      rentalRequest._id
    );

    res.status(201).json({
      success: true,
      message: "Rental request submitted successfully",
      rentalRequest,
    });
  } catch (error) {
    console.error("Error creating rental request:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create rental request",
      error: error.message,
    });
  }
});

/**
 * GET /room-rental/requests/tenant/:tenantId
 * Get rental requests by tenant
 */
router.get("/requests/tenant/:tenantId", async (req, res) => {
  try {
    const { tenantId } = req.params;

    const requests = await RentalRequest.find({ tenantId })
      .populate("roomId", "title price listingPhotoPaths city province")
      .populate("hostId", "firstName lastName profileImagePath")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      requests,
    });
  } catch (error) {
    console.error("Error fetching tenant requests:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch rental requests",
      error: error.message,
    });
  }
});

/**
 * GET /room-rental/requests/host/:hostId
 * Get rental requests for host's rooms
 */
router.get("/requests/host/:hostId", async (req, res) => {
  try {
    const { hostId } = req.params;

    const requests = await RentalRequest.find({ hostId })
      .populate("roomId", "title price listingPhotoPaths city province")
      .populate("tenantId", "firstName lastName email profileImagePath")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      requests,
    });
  } catch (error) {
    console.error("Error fetching host requests:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch rental requests",
      error: error.message,
    });
  }
});

/**
 * PUT /room-rental/requests/:requestId/cancel
 * Tenant cancels their rental request
 */
router.put("/requests/:requestId/cancel", async (req, res) => {
  try {
    const { requestId } = req.params;

    const request = await RentalRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Rental request not found",
      });
    }

    if (request.status !== "REQUESTED") {
      return res.status(400).json({
        success: false,
        message: "Only pending requests can be cancelled",
      });
    }

    request.status = "CANCELLED";
    await request.save();

    // Update room availability back to AVAILABLE if needed
    const Listing = require("../models/Listing");
    const room = await Listing.findById(request.roomId);
    if (room && room.roomAvailabilityStatus === 'RENTED') {
      // Only reset if there are no other approved/active requests
      const otherActiveRequests = await RentalRequest.countDocuments({
        roomId: request.roomId,
        _id: { $ne: request._id },
        status: { $in: ['APPROVED', 'REQUESTED'] }
      });

      if (otherActiveRequests === 0) {
        room.roomAvailabilityStatus = 'AVAILABLE';
        await room.save();
        console.log('🏠 Room availability reset to AVAILABLE after cancellation');
      }
    }

    // Notify host
    await createNotification(
      request.hostId,
      "rental_cancelled",
      "A tenant has cancelled their rental request",
      `/room-rental/host/requests`,
      request._id
    );

    console.log(`✅ Rental request ${requestId} cancelled`);

    res.status(200).json({
      success: true,
      message: "Rental request cancelled successfully",
      request,
    });
  } catch (error) {
    console.error("Error cancelling request:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cancel request",
      error: error.message,
    });
  }
});

/**
 * PUT /room-rental/requests/:requestId/approve
 * Host approves rental request and generates agreement
 */
router.put("/requests/:requestId/approve", async (req, res) => {
  try {
    const { requestId } = req.params;
    const { hostId, houseRules, noticePeriod } = req.body;

    const request = await RentalRequest.findById(requestId).populate("roomId");

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Rental request not found",
      });
    }

    if (request.status !== "REQUESTED") {
      return res.status(400).json({
        success: false,
        message: "Request has already been processed",
      });
    }

    if (request.hostId.toString() !== hostId) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to approve this request",
      });
    }

    // Check if room is still available
    const available = await isRoomAvailable(request.roomId._id);
    if (!available) {
      return res.status(400).json({
        success: false,
        message: "Room is no longer available",
      });
    }

    // Update request status
    request.status = "APPROVED";
    request.reviewedAt = new Date();
    await request.save();

    // Update room availability status
    await Listing.findByIdAndUpdate(request.roomId._id, {
      roomAvailabilityStatus: "PENDING_APPROVAL",
    });

    console.log("🏠 Room availability updated to PENDING_APPROVAL");

    // Generate rental agreement
    const agreement = await RentalAgreement.create({
      roomId: request.roomId._id,
      tenantId: request.tenantId,
      hostId: request.hostId,
      rentalRequestId: request._id,
      rentAmount: request.roomId.price,
      depositAmount: request.roomId.price, // Default: 1 month rent as deposit
      paymentMethod: "CASH", // Default
      noticePeriod: noticePeriod || 30,
      houseRules: houseRules || request.roomId.description || "",
      status: "DRAFT",
    });

    console.log("✅ Rental agreement generated:", agreement._id);

    // Populate data
    await agreement.populate([
      { path: "roomId", select: "title price listingPhotoPaths city province" },
      { path: "tenantId", select: "firstName lastName email profileImagePath" },
      { path: "hostId", select: "firstName lastName profileImagePath" },
    ]);

    // Create notification for tenant
    await createNotification(
      request.tenantId,
      "rental_approved",
      `Your rental request has been approved! Please review the agreement.`,
      `/room-rental/agreements/${agreement._id}`,
      request._id
    );

    res.status(200).json({
      success: true,
      message: "Rental request approved and agreement generated",
      request,
      agreement,
    });
  } catch (error) {
    console.error("Error approving rental request:", error);
    res.status(500).json({
      success: false,
      message: "Failed to approve rental request",
      error: error.message,
    });
  }
});

/**
 * PUT /room-rental/requests/:requestId/reject
 * Host rejects rental request
 */
router.put("/requests/:requestId/reject", async (req, res) => {
  try {
    const { requestId } = req.params;
    const { hostId, rejectionReason } = req.body;

    const request = await RentalRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Rental request not found",
      });
    }

    if (request.status !== "REQUESTED") {
      return res.status(400).json({
        success: false,
        message: "Request has already been processed",
      });
    }

    if (request.hostId.toString() !== hostId) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to reject this request",
      });
    }

    // Update request status
    request.status = "REJECTED";
    request.rejectionReason = rejectionReason || "No reason provided";
    request.reviewedAt = new Date();
    await request.save();

    // Update room availability back to AVAILABLE if needed
    const Listing = require("../models/Listing");
    const room = await Listing.findById(request.roomId);
    if (room && room.roomAvailabilityStatus === 'RENTED') {
      // Only reset if there are no other approved/active requests
      const otherActiveRequests = await RentalRequest.countDocuments({
        roomId: request.roomId,
        _id: { $ne: request._id },
        status: { $in: ['APPROVED', 'REQUESTED'] }
      });

      if (otherActiveRequests === 0) {
        room.roomAvailabilityStatus = 'AVAILABLE';
        await room.save();
        console.log('🏠 Room availability reset to AVAILABLE after rejection');
      }
    }

    // Create notification for tenant
    await createNotification(
      request.tenantId,
      "rental_rejected",
      `Your rental request has been rejected.`,
      `/room-rental/requests/${request._id}`,
      request._id
    );

    res.status(200).json({
      success: true,
      message: "Rental request rejected",
      request,
    });
  } catch (error) {
    console.error("Error rejecting rental request:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reject rental request",
      error: error.message,
    });
  }
});

/**
 * GET /room-rental/agreements/tenant/:tenantId
 * Get all agreements for a tenant
 */
router.get("/agreements/tenant/:tenantId", async (req, res) => {
  try {
    const { tenantId } = req.params;

    const agreements = await RentalAgreement.find({ tenantId })
      .populate("roomId", "title price listingPhotoPaths city province streetAddress")
      .populate("hostId", "firstName lastName email profileImagePath")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: agreements.length,
      agreements,
    });
  } catch (error) {
    console.error("Error fetching tenant agreements:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch agreements",
      error: error.message,
    });
  }
});

/**
 * GET /room-rental/agreements/host/:hostId
 * Get all agreements for a host
 */
router.get("/agreements/host/:hostId", async (req, res) => {
  try {
    const { hostId } = req.params;

    const agreements = await RentalAgreement.find({ hostId })
      .populate("roomId", "title price listingPhotoPaths city province streetAddress")
      .populate("tenantId", "firstName lastName email profileImagePath")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: agreements.length,
      agreements,
    });
  } catch (error) {
    console.error("Error fetching host agreements:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch agreements",
      error: error.message,
    });
  }
});

/**
 * PUT /room-rental/agreements/:agreementId/host-confirm
 * Host confirms/signs agreement
 */
router.put("/agreements/:agreementId/host-confirm", async (req, res) => {
  try {
    const { agreementId } = req.params;

    const agreement = await RentalAgreement.findById(agreementId)
      .populate("tenantId", "firstName lastName email")
      .populate("roomId", "title");

    if (!agreement) {
      return res.status(404).json({
        success: false,
        message: "Agreement not found",
      });
    }

    if (agreement.status !== "DRAFT") {
      return res.status(400).json({
        success: false,
        message: "Agreement is not in DRAFT status",
      });
    }

    if (!agreement.agreedByTenantAt) {
      return res.status(400).json({
        success: false,
        message: "Tenant must sign agreement first",
      });
    }

    if (agreement.agreedByHostAt) {
      return res.status(400).json({
        success: false,
        message: "You have already confirmed this agreement",
      });
    }

    // Host confirms agreement
    agreement.agreedByHostAt = new Date();
    agreement.status = "ACTIVE"; // Agreement becomes active when both parties sign
    await agreement.save();

    // Create notification for tenant
    await createNotification(
      agreement.tenantId._id,
      "rental_agreement_confirmed",
      `Host has confirmed the rental agreement for ${agreement.roomId.title}. You can now proceed with payment.`,
      `/room-rental/my-payments`,
      agreement.rentalRequestId || null
    );

    console.log(`✅ Agreement ${agreementId} confirmed by host`);

    res.status(200).json({
      success: true,
      message: "Agreement confirmed successfully",
      agreement,
    });
  } catch (error) {
    console.error("Error confirming agreement:", error);
    res.status(500).json({
      success: false,
      message: "Failed to confirm agreement",
      error: error.message,
    });
  }
});

/**
 * GET /room-rental/agreements/:agreementId
 * Get specific agreement details
 */
router.get("/agreements/:agreementId", async (req, res) => {
  try {
    const { agreementId } = req.params;

    const agreement = await RentalAgreement.findById(agreementId)
      .populate("roomId", "title price listingPhotoPaths city province description")
      .populate("tenantId", "firstName lastName email profileImagePath phoneNumber")
      .populate("hostId", "firstName lastName email profileImagePath phoneNumber")
      .populate("rentalRequestId");

    if (!agreement) {
      return res.status(404).json({
        success: false,
        message: "Agreement not found",
      });
    }

    res.status(200).json({
      success: true,
      agreement,
    });
  } catch (error) {
    console.error("Error fetching agreement:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch agreement",
      error: error.message,
    });
  }
});

/**
 * PUT /room-rental/agreements/:agreementId/accept/tenant
 * Tenant accepts agreement
 */
router.put("/agreements/:agreementId/accept/tenant", async (req, res) => {
  try {
    const { agreementId } = req.params;
    const { tenantId } = req.body;

    const validation = await validateAgreementAcceptance(agreementId, tenantId, "tenant");

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.errors,
      });
    }

    const agreement = validation.agreement;

    // Mark tenant acceptance
    agreement.agreedByTenantAt = new Date();
    await agreement.save();

    // Check if both parties have accepted
    if (agreement.agreedByTenantAt && agreement.agreedByHostAt) {
      agreement.status = "ACTIVE";
      agreement.startDate = new Date();
      await agreement.save();

      // Update room availability status to RENTED
      await Listing.findByIdAndUpdate(agreement.roomId, {
        roomAvailabilityStatus: "RENTED",
      });

      console.log("🏠 Room availability updated to RENTED");

      // Create rental status
      await RentalStatus.create({
        agreementId: agreement._id,
        roomId: agreement.roomId,
        tenantId: agreement.tenantId,
        hostId: agreement.hostId,
        status: "PENDING_MOVE_IN",
      });

      console.log("✅ Agreement is now ACTIVE");

      // Notify host
      await createNotification(
        agreement.hostId,
        "rental_agreement_active",
        `Rental agreement is now active. Waiting for move-in confirmation.`,
        `/room-rental/agreements/${agreement._id}`,
        agreement.rentalRequestId || null
      );
    } else {
      // Notify host that tenant has accepted
      await createNotification(
        agreement.hostId,
        "rental_agreement_tenant_accepted",
        `Tenant has accepted the rental agreement. Please review and accept.`,
        `/room-rental/agreements/${agreement._id}`,
        agreement.rentalRequestId || null
      );
    }

    res.status(200).json({
      success: true,
      message: "Agreement accepted by tenant",
      agreement,
    });
  } catch (error) {
    console.error("Error accepting agreement (tenant):", error);
    res.status(500).json({
      success: false,
      message: "Failed to accept agreement",
      error: error.message,
    });
  }
});

/**
 * PUT /room-rental/agreements/:agreementId/accept/host
 * Host confirms agreement
 */
router.put("/agreements/:agreementId/accept/host", async (req, res) => {
  try {
    const { agreementId } = req.params;
    const { hostId } = req.body;

    const validation = await validateAgreementAcceptance(agreementId, hostId, "host");

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.errors,
      });
    }

    const agreement = validation.agreement;

    // Mark host acceptance
    agreement.agreedByHostAt = new Date();
    await agreement.save();

    // Check if both parties have accepted
    if (agreement.agreedByTenantAt && agreement.agreedByHostAt) {
      agreement.status = "ACTIVE";
      agreement.startDate = new Date();
      await agreement.save();

      // Update room availability status to RENTED
      await Listing.findByIdAndUpdate(agreement.roomId, {
        roomAvailabilityStatus: "RENTED",
      });

      console.log("🏠 Room availability updated to RENTED");

      // Create rental status
      await RentalStatus.create({
        agreementId: agreement._id,
        roomId: agreement.roomId,
        tenantId: agreement.tenantId,
        hostId: agreement.hostId,
        status: "PENDING_MOVE_IN",
      });

      console.log("✅ Agreement is now ACTIVE");

      // Notify tenant
      await createNotification(
        agreement.tenantId,
        "rental_agreement_active",
        `Rental agreement is now active. You can proceed with payment.`,
        `/room-rental/agreements/${agreement._id}`,
        agreement.rentalRequestId || null
      );
    } else {
      // Notify tenant that host has accepted
      await createNotification(
        agreement.tenantId,
        "rental_agreement_confirmed",
        `Host has confirmed the rental agreement. Please review and accept.`,
        `/room-rental/agreements/${agreement._id}`,
        agreement.rentalRequestId || null
      );
    }

    res.status(200).json({
      success: true,
      message: "Agreement confirmed by host",
      agreement,
    });
  } catch (error) {
    console.error("Error confirming agreement (host):", error);
    res.status(500).json({
      success: false,
      message: "Failed to confirm agreement",
      error: error.message,
    });
  }
});

/**
 * POST /room-rental/payments/create
 * Create payment record (deposit or monthly rent)
 */
router.post("/payments/create", async (req, res) => {
  try {
    const { agreementId, paymentType, method, month } = req.body;

    const validation = await validatePaymentCreation(
      agreementId,
      paymentType === "DEPOSIT"
        ? (await RentalAgreement.findById(agreementId)).depositAmount
        : (await RentalAgreement.findById(agreementId)).rentAmount,
      paymentType
    );

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.errors,
      });
    }

    const agreement = validation.agreement;
    const amount = paymentType === "DEPOSIT" ? agreement.depositAmount : agreement.rentAmount;

    // Check if payment already exists
    const existingPayment = await RentalPayment.findOne({
      agreementId,
      paymentType,
      ...(paymentType === "MONTHLY" && { month }),
    });

    if (existingPayment) {
      return res.status(400).json({
        success: false,
        message: "Payment record already exists",
      });
    }

    // Calculate due date
    let dueDate = new Date();
    if (paymentType === "MONTHLY" && month) {
      const [year, monthNum] = month.split("-");
      dueDate = new Date(year, monthNum - 1, 5); // Due on 5th of the month
    }

    const payment = await RentalPayment.create({
      agreementId,
      tenantId: agreement.tenantId,
      hostId: agreement.hostId,
      amount,
      paymentType,
      method,
      status: "UNPAID",
      dueDate,
      month: paymentType === "MONTHLY" ? month : undefined,
    });

    console.log("✅ Payment record created:", payment._id);

    res.status(201).json({
      success: true,
      message: "Payment record created",
      payment,
    });
  } catch (error) {
    console.error("Error creating payment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create payment",
      error: error.message,
    });
  }
});

/**
 * PUT /room-rental/payments/:paymentId/pay
 * Mark payment as paid (cash) or process online payment
 */
router.put("/payments/:paymentId/pay", async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { method, transactionId, notes } = req.body;

    const payment = await RentalPayment.findById(paymentId);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    if (payment.status === "PAID") {
      return res.status(400).json({
        success: false,
        message: "Payment has already been paid",
      });
    }

    // Update payment
    payment.status = "PAID";
    payment.paidAmount = payment.amount;
    payment.paidAt = new Date();
    payment.method = method || payment.method;
    payment.transactionId = transactionId;
    payment.notes = notes;
    await payment.save();

    console.log("✅ Payment marked as paid:", payment._id);

    // Notify host
    await createNotification(
      payment.hostId,
      "payment_received",
      `Received ${payment.paymentType === "DEPOSIT" ? "deposit" : "monthly rent"} payment`,
      `/room-rental/payments/${payment._id}`
    );

    res.status(200).json({
      success: true,
      message: "Payment processed successfully",
      payment,
    });
  } catch (error) {
    console.error("Error processing payment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process payment",
      error: error.message,
    });
  }
});

/**
 * PUT /room-rental/move-in/:agreementId/confirm
 * Confirm move-in (both tenant and host must confirm)
 */
router.put("/move-in/:agreementId/confirm", async (req, res) => {
  try {
    const { agreementId } = req.params;
    const { userId, userType } = req.body; // userType: "tenant" or "host"

    const rentalStatus = await RentalStatus.findOne({ agreementId });

    if (!rentalStatus) {
      return res.status(404).json({
        success: false,
        message: "Rental status not found",
      });
    }

    if (rentalStatus.status !== "PENDING_MOVE_IN") {
      return res.status(400).json({
        success: false,
        message: "Move-in has already been confirmed or rental is not pending",
      });
    }

    // Update confirmation based on user type
    if (userType === "tenant") {
      rentalStatus.moveInConfirmedByTenant = true;
    } else if (userType === "host") {
      rentalStatus.moveInConfirmedByHost = true;
    }

    // If both confirmed, move to ACTIVE status
    if (rentalStatus.moveInConfirmedByTenant && rentalStatus.moveInConfirmedByHost) {
      rentalStatus.status = "ACTIVE";
      rentalStatus.moveInDate = new Date();
      console.log("✅ Rental is now ACTIVE");

      // Notify both parties
      await createNotification(
        rentalStatus.tenantId,
        "move_in_confirmed",
        `Move-in confirmed! Your rental is now active.`,
        `/room-rental/status/${rentalStatus._id}`
      );

      await createNotification(
        rentalStatus.hostId,
        "move_in_confirmed",
        `Tenant has moved in. Rental is now active.`,
        `/room-rental/status/${rentalStatus._id}`
      );
    } else {
      // Notify the other party
      const otherParty = userType === "tenant" ? rentalStatus.hostId : rentalStatus.tenantId;
      await createNotification(
        otherParty,
        "move_in_pending",
        `${userType === "tenant" ? "Tenant" : "Host"} has confirmed move-in. Please confirm as well.`,
        `/room-rental/status/${rentalStatus._id}`
      );
    }

    await rentalStatus.save();

    res.status(200).json({
      success: true,
      message: `Move-in confirmed by ${userType}`,
      rentalStatus,
    });
  } catch (error) {
    console.error("Error confirming move-in:", error);
    res.status(500).json({
      success: false,
      message: "Failed to confirm move-in",
      error: error.message,
    });
  }
});

/**
 * GET /room-rental/status/host/:hostId
 * Get all rental statuses for a host
 */
router.get("/status/host/:hostId", async (req, res) => {
  try {
    const { hostId } = req.params;

    const rentals = await RentalStatus.find({ hostId })
      .populate("agreementId")
      .populate("tenantId", "firstName lastName email profileImagePath")
      .populate("roomId", "title streetAddress city province")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      rentals,
    });
  } catch (error) {
    console.error("Error fetching host rentals:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch rentals",
      error: error.message,
    });
  }
});

/**
 * PUT /room-rental/move-out/:agreementId/confirm
 * Host confirms tenant has moved out
 */
router.put("/move-out/:agreementId/confirm", async (req, res) => {
  try {
    const { agreementId } = req.params;
    const { userId, userType } = req.body;

    const rentalStatus = await RentalStatus.findOne({ agreementId });
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

    if (userType === "host") {
      rentalStatus.moveOutConfirmedByHost = true;
      rentalStatus.moveOutConfirmedByHostAt = new Date();
    } else if (userType === "tenant") {
      rentalStatus.moveOutConfirmedByTenant = true;
      rentalStatus.moveOutConfirmedByTenantAt = new Date();
    }

    // If both confirmed, complete the rental
    if (
      rentalStatus.moveOutConfirmedByHost &&
      rentalStatus.moveOutConfirmedByTenant
    ) {
      rentalStatus.status = "COMPLETED";
      rentalStatus.moveOutDate = new Date();

      // Update agreement status
      const agreement = await RentalAgreement.findById(agreementId);
      if (agreement) {
        agreement.status = "TERMINATED";
        await agreement.save();
      }

      // Make room available again
      const listing = await Listing.findById(rentalStatus.roomId);
      if (listing) {
        listing.isActive = true;
        await listing.save();
      }

      // Notify both parties
      await createNotification(
        rentalStatus.tenantId,
        "rental_completed",
        `Your rental at ${listing?.title || "the property"} has been completed`,
        `/room-rental/my-rentals`
      );

      await createNotification(
        rentalStatus.hostId,
        "rental_completed",
        `Rental with tenant has been completed`,
        `/room-rental/host/rentals`
      );
    }

    await rentalStatus.save();

    res.json({
      success: true,
      message: "Move-out confirmed successfully",
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
 * GET /room-rental/payments/host/:hostId
 * Get all payment records for a host
 */
router.get("/payments/host/:hostId", async (req, res) => {
  try {
    const { hostId } = req.params;

    const payments = await RentalPayment.find()
      .populate({
        path: "agreementId",
        match: { hostId },
        populate: [
          { path: "tenantId", select: "firstName lastName email profileImagePath" },
          { path: "roomId", select: "title streetAddress city province" },
        ],
      })
      .sort({ createdAt: -1 });

    // Filter out payments where agreement doesn't match the host
    const hostPayments = payments.filter((p) => p.agreementId !== null);

    res.json({
      success: true,
      payments: hostPayments,
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
 * PUT /room-rental/payments/:paymentId/confirm
 * Host confirms receiving cash payment
 */
router.put("/payments/:paymentId/confirm", async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await RentalPayment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    if (payment.method !== "CASH") {
      return res.status(400).json({
        success: false,
        message: "Only cash payments can be confirmed manually",
      });
    }

    if (payment.status === "PAID") {
      return res.status(400).json({
        success: false,
        message: "Payment already confirmed",
      });
    }

    payment.status = "PAID";
    payment.paidAt = new Date();
    await payment.save();

    // Get agreement details for notification
    const agreement = await RentalAgreement.findById(payment.agreementId)
      .populate("roomId", "title");

    // Notify tenant
    await createNotification(
      agreement.tenantId,
      "payment_confirmed",
      `Your ${payment.paymentType.toLowerCase()} payment of ${payment.amount.toLocaleString('vi-VN')} VND has been confirmed`,
      `/room-rental/my-payments`
    );

    res.json({
      success: true,
      message: "Payment confirmed successfully",
      payment,
    });
  } catch (error) {
    console.error("Error confirming payment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to confirm payment",
      error: error.message,
    });
  }
});

module.exports = router;

