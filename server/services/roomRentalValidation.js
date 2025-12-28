const { RentalRequest, RentalAgreement, RentalStatus } = require("../models/RoomRental");
const Listing = require("../models/Listing");
const User = require("../models/User");

/**
 * Check if room is available for rental
 */
const isRoomAvailable = async (roomId) => {
  // Check if there's an active or pending rental for this room
  const activeRental = await RentalStatus.findOne({
    roomId,
    status: { $in: ["PENDING_MOVE_IN", "ACTIVE"] },
  });

  return !activeRental;
};

/**
 * Check if user has verified identity
 */
const hasVerifiedIdentity = async (userId) => {
  const user = await User.findById(userId);
  if (!user) return false;

  // Check if user has approved identity verification
  const IdentityVerification = require("../models/IdentityVerification");
  const verification = await IdentityVerification.findOne({
    userId,
    status: "approved",
  });

  return !!verification;
};

/**
 * Validate rental request
 */
const validateRentalRequest = async (data) => {
  const errors = [];

  // Check if room exists and is a shared room
  const room = await Listing.findById(data.roomId);
  if (!room) {
    errors.push("Room not found");
    return { valid: false, errors };
  }

  if (room.type !== "A Room") {
    errors.push("This listing is not a shared room");
    return { valid: false, errors };
  }

  // Check if room is available
  const available = await isRoomAvailable(data.roomId);
  if (!available) {
    errors.push("This room is not available for rental");
  }

  // Check if tenant has verified identity
  const verified = await hasVerifiedIdentity(data.tenantId);
  if (!verified) {
    errors.push("Identity verification required before requesting rental");
  }

  // Check if tenant is not the host
  if (data.tenantId === room.creator.toString()) {
    errors.push("You cannot rent your own room");
  }

  // Check move-in date
  const moveInDate = new Date(data.moveInDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (moveInDate < today) {
    errors.push("Move-in date cannot be in the past");
  }

  // Check intended stay duration
  if (!data.intendedStayDuration || data.intendedStayDuration < 1) {
    errors.push("Intended stay duration must be at least 1 month");
  }

  // Check message length
  if (!data.message || data.message.length < 50) {
    errors.push("Please provide a detailed message (at least 50 characters)");
  }

  if (data.message && data.message.length > 1000) {
    errors.push("Message is too long (maximum 1000 characters)");
  }

  return {
    valid: errors.length === 0,
    errors,
    room,
  };
};

/**
 * Validate agreement acceptance
 */
const validateAgreementAcceptance = async (agreementId, userId, userType) => {
  const errors = [];

  const agreement = await RentalAgreement.findById(agreementId);
  if (!agreement) {
    errors.push("Agreement not found");
    return { valid: false, errors };
  }

  if (agreement.status !== "DRAFT") {
    errors.push("Agreement is not in draft status");
  }

  // Check if user is authorized
  if (userType === "tenant" && agreement.tenantId.toString() !== userId) {
    errors.push("You are not authorized to accept this agreement");
  }

  if (userType === "host" && agreement.hostId.toString() !== userId) {
    errors.push("You are not authorized to accept this agreement");
  }

  return {
    valid: errors.length === 0,
    errors,
    agreement,
  };
};

/**
 * Validate payment creation
 */
const validatePaymentCreation = async (agreementId, amount, paymentType) => {
  const errors = [];

  const agreement = await RentalAgreement.findById(agreementId);
  if (!agreement) {
    errors.push("Agreement not found");
    return { valid: false, errors };
  }

  // Payment is only allowed when agreement is ACTIVE
  if (agreement.status !== "ACTIVE") {
    errors.push("Payment is only allowed when agreement is active");
  }

  // Validate amount based on payment type
  if (paymentType === "DEPOSIT") {
    if (amount !== agreement.depositAmount) {
      errors.push(`Deposit amount must be ${agreement.depositAmount}`);
    }
  } else if (paymentType === "MONTHLY") {
    if (amount !== agreement.rentAmount) {
      errors.push(`Monthly rent amount must be ${agreement.rentAmount}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    agreement,
  };
};

/**
 * Check if user can terminate rental
 */
const canTerminateRental = async (agreementId, userId) => {
  const agreement = await RentalAgreement.findById(agreementId);
  if (!agreement) {
    return { canTerminate: false, reason: "Agreement not found" };
  }

  if (agreement.status !== "ACTIVE") {
    return { canTerminate: false, reason: "Only active agreements can be terminated" };
  }

  const rentalStatus = await RentalStatus.findOne({ agreementId });
  if (!rentalStatus) {
    return { canTerminate: false, reason: "Rental status not found" };
  }

  if (rentalStatus.status !== "ACTIVE") {
    return { canTerminate: false, reason: "Rental is not active" };
  }

  // Check if user is tenant or host
  const isTenant = agreement.tenantId.toString() === userId;
  const isHost = agreement.hostId.toString() === userId;

  if (!isTenant && !isHost) {
    return { canTerminate: false, reason: "You are not authorized to terminate this rental" };
  }

  return {
    canTerminate: true,
    agreement,
    rentalStatus,
    requestedBy: isTenant ? "tenant" : "host",
  };
};

module.exports = {
  isRoomAvailable,
  hasVerifiedIdentity,
  validateRentalRequest,
  validateAgreementAcceptance,
  validatePaymentCreation,
  canTerminateRental,
};

