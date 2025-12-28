const mongoose = require("mongoose");

// Room Rental Request Schema
const RentalRequestSchema = new mongoose.Schema({
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Listing",
    required: true,
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  hostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  message: {
    type: String,
    required: true,
    minlength: 50,
    maxlength: 1000,
  },
  moveInDate: {
    type: Date,
    required: true,
  },
  intendedStayDuration: {
    type: Number, // in months
    required: true,
    min: 1,
  },
  status: {
    type: String,
    enum: ["REQUESTED", "APPROVED", "REJECTED", "CANCELLED"],
    default: "REQUESTED",
  },
  rejectionReason: {
    type: String,
    default: "",
  },
  reviewedAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update timestamp on save
RentalRequestSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Rental Agreement Schema
const RentalAgreementSchema = new mongoose.Schema({
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Listing",
    required: true,
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  hostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  rentalRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "RentalRequest",
    required: true,
  },
  rentAmount: {
    type: Number,
    required: true,
  },
  depositAmount: {
    type: Number,
    required: true,
  },
  paymentMethod: {
    type: String,
    enum: ["ONLINE", "CASH", "MIXED"],
    default: "CASH",
  },
  noticePeriod: {
    type: Number, // in days
    default: 30,
  },
  houseRules: {
    type: String,
    default: "",
  },
  status: {
    type: String,
    enum: ["DRAFT", "ACTIVE", "TERMINATED"],
    default: "DRAFT",
  },
  agreedByTenantAt: {
    type: Date,
  },
  agreedByHostAt: {
    type: Date,
  },
  startDate: {
    type: Date,
  },
  endDate: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update timestamp on save
RentalAgreementSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Rental Payment Schema
const RentalPaymentSchema = new mongoose.Schema({
  agreementId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "RentalAgreement",
    required: true,
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  hostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  paymentType: {
    type: String,
    enum: ["DEPOSIT", "MONTHLY"],
    required: true,
  },
  method: {
    type: String,
    enum: ["ONLINE", "CASH"],
    required: true,
  },
  status: {
    type: String,
    enum: ["UNPAID", "PARTIALLY_PAID", "PAID"],
    default: "UNPAID",
  },
  paidAmount: {
    type: Number,
    default: 0,
  },
  paidAt: {
    type: Date,
  },
  dueDate: {
    type: Date,
  },
  month: {
    type: String, // Format: "YYYY-MM"
  },
  transactionId: {
    type: String,
  },
  notes: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update timestamp on save
RentalPaymentSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Rental Status Schema (Lifecycle management)
const RentalStatusSchema = new mongoose.Schema({
  agreementId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "RentalAgreement",
    required: true,
    unique: true,
  },
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Listing",
    required: true,
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  hostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  status: {
    type: String,
    enum: ["PENDING_MOVE_IN", "ACTIVE", "TERMINATING", "COMPLETED"],
    default: "PENDING_MOVE_IN",
  },
  moveInConfirmedByTenant: {
    type: Boolean,
    default: false,
  },
  moveInConfirmedByHost: {
    type: Boolean,
    default: false,
  },
  moveInDate: {
    type: Date,
  },
  terminationRequestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  terminationRequestedAt: {
    type: Date,
  },
  terminationReason: {
    type: String,
  },
  expectedMoveOutDate: {
    type: Date,
  },
  actualMoveOutDate: {
    type: Date,
  },
  depositRefundAmount: {
    type: Number,
    default: 0,
  },
  depositRefundReason: {
    type: String,
  },
  completedAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update timestamp on save
RentalStatusSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Create indexes for performance
RentalRequestSchema.index({ roomId: 1, status: 1 });
RentalRequestSchema.index({ tenantId: 1, status: 1 });
RentalRequestSchema.index({ hostId: 1, status: 1 });

RentalAgreementSchema.index({ roomId: 1, status: 1 });
RentalAgreementSchema.index({ tenantId: 1, status: 1 });
RentalAgreementSchema.index({ hostId: 1, status: 1 });

RentalPaymentSchema.index({ agreementId: 1, status: 1 });
RentalPaymentSchema.index({ tenantId: 1, dueDate: 1 });

RentalStatusSchema.index({ roomId: 1, status: 1 });
RentalStatusSchema.index({ agreementId: 1 });

const RentalRequest = mongoose.model("RentalRequest", RentalRequestSchema);
const RentalAgreement = mongoose.model("RentalAgreement", RentalAgreementSchema);
const RentalPayment = mongoose.model("RentalPayment", RentalPaymentSchema);
const RentalStatus = mongoose.model("RentalStatus", RentalStatusSchema);

module.exports = {
  RentalRequest,
  RentalAgreement,
  RentalPayment,
  RentalStatus,
};

