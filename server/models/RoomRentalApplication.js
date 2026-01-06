const mongoose = require("mongoose");

const RoomRentalApplicationSchema = new mongoose.Schema(
  {
    // Applicant (Tenant)
    applicantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Room listing
    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing",
      required: true,
    },

    // Host of the room
    hostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Application status
    status: {
      type: String,
      enum: [
        "applied",
        "under_review",
        "interview_scheduled",
        "offer_made",
        "accepted",
        "contracted",
        "rejected",
        "withdrawn",
      ],
      default: "applied",
    },

    // Compatibility score (calculated by algorithm)
    compatibilityScore: {
      type: Number,
      min: 0,
      max: 100,
      required: true,
    },

    // Lifestyle compatibility breakdown
    compatibilityBreakdown: {
      sleepSchedule: { type: Number, default: 0 }, // 0-20
      smoking: { type: Number, default: 0 }, // 0-25
      cleanliness: { type: Number, default: 0 }, // 0-15
      noiseTolerance: { type: Number, default: 0 }, // 0-10
      guestPolicy: { type: Number, default: 0 }, // 0-10
      petPreference: { type: Number, default: 0 }, // 0-15
      personality: { type: Number, default: 0 }, // 0-5
    },

    // Interview details
    interview: {
      scheduledDate: { type: Date },
      scheduledTime: { type: String },
      meetingType: {
        type: String,
        enum: ["in_person", "video_call", "phone_call"],
      },
      meetingLink: { type: String }, // For video calls
      notes: { type: String }, // Host's interview notes
      completed: { type: Boolean, default: false },
    },

    // Offer details (if host makes an offer)
    offer: {
      monthlyRent: { type: Number },
      depositAmount: { type: Number }, // Usually 1 month rent
      moveInDate: { type: Date },
      leaseDuration: { type: Number }, // In months
      specialTerms: { type: String }, // Any special conditions
      expiresAt: { type: Date }, // Offer expiration
      offeredAt: { type: Date },
    },

    // Tenant's response to offer
    tenantResponse: {
      accepted: { type: Boolean },
      responseDate: { type: Date },
      message: { type: String }, // Tenant's message
    },

    // Contract details (after acceptance)
    contract: {
      signed: { type: Boolean, default: false },
      signedAt: { type: Date },
      contractUrl: { type: String }, // PDF contract link
      startDate: { type: Date },
      endDate: { type: Date },
      monthlyRent: { type: Number },
      depositPaid: { type: Boolean, default: false },
      depositAmount: { type: Number },
    },

    // Rejection/Withdrawal details
    rejection: {
      rejectedBy: {
        type: String,
        enum: ["host", "applicant"],
      },
      reason: { type: String },
      rejectedAt: { type: Date },
    },

    // Additional tenant information
    tenantInfo: {
      currentEmployment: { type: String },
      monthlyIncome: { type: Number },
      moveInReason: { type: String },
      emergencyContact: {
        name: { type: String },
        phone: { type: String },
        relationship: { type: String },
      },
      references: [
        {
          name: { type: String },
          phone: { type: String },
          relationship: { type: String },
        },
      ],
    },

    // Timeline tracking
    appliedAt: { type: Date, default: Date.now },
    reviewedAt: { type: Date },
    interviewScheduledAt: { type: Date },
    offerMadeAt: { type: Date },
    acceptedAt: { type: Date },
    contractedAt: { type: Date },

    // Notes
    applicantNotes: { type: String }, // Tenant's cover letter
    hostNotes: { type: String }, // Host's private notes
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
RoomRentalApplicationSchema.index({ applicantId: 1, listingId: 1 });
RoomRentalApplicationSchema.index({ hostId: 1, status: 1 });
RoomRentalApplicationSchema.index({ status: 1, createdAt: -1 });

// Virtual for time in current status
RoomRentalApplicationSchema.virtual("daysInStatus").get(function () {
  const statusDate = this.updatedAt || this.createdAt;
  const now = new Date();
  const diffTime = Math.abs(now - statusDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

const RoomRentalApplication = mongoose.model(
  "RoomRentalApplication",
  RoomRentalApplicationSchema
);

module.exports = RoomRentalApplication;

