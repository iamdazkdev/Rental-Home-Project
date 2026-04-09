const { z } = require("zod");
const mongoose = require("mongoose");

const objectIdValidator = z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
  message: "Invalid ObjectId format"
});

const createIntentSchema = {
  body: z.object({
    listingId: objectIdValidator,
    hostId: objectIdValidator,
    startDate: z.string().min(1, "startDate is required"),
    endDate: z.string().min(1, "endDate is required"),
    totalPrice: z.coerce.number().min(0, "totalPrice must be positive"),
    paymentType: z.enum(["full", "deposit"])
  })
};

const checkAvailabilitySchema = {
  query: z.object({
    listingId: objectIdValidator,
    startDate: z.string().min(1, "startDate is required"),
    endDate: z.string().min(1, "endDate is required")
  })
};

const createFromPaymentSchema = {
  body: z.object({
    tempOrderId: z.string().min(1, "tempOrderId is required"),
    transactionId: z.string().optional(),
    paymentData: z.record(z.any())
  })
};

const cashBookingSchema = {
  body: z.object({
    listingId: objectIdValidator,
    hostId: objectIdValidator,
    startDate: z.string().min(1, "startDate is required"),
    endDate: z.string().min(1, "endDate is required"),
    totalPrice: z.coerce.number().min(0, "totalPrice must be positive")
  })
};

const extendSchema = {
  params: z.object({ id: objectIdValidator }),
  body: z.object({
    newEndDate: z.string().min(1),
    additionalNights: z.coerce.number().min(1)
  })
};

const reasonSchema = {
  params: z.object({ id: objectIdValidator }),
  body: z.object({ reason: z.string().optional() })
};

const confirmCashPaymentSchema = {
  params: z.object({ id: objectIdValidator }),
  body: z.object({
    amount: z.coerce.number(),
    notes: z.string().optional()
  })
};

const completeSchema = {
  params: z.object({ id: objectIdValidator }),
  body: z.object({
    hasDamage: z.boolean(),
    damageReport: z.string().optional()
  })
};

const extensionActionSchema = {
  params: z.object({
    id: objectIdValidator,
    extensionId: objectIdValidator
  }),
  body: z.object({
    reason: z.string().optional()
  }).optional()
};

const getUserBookingsSchema = {
  params: z.object({ userId: objectIdValidator }),
  query: z.object({
    status: z.string().optional(),
    role: z.string().optional()
  })
};

module.exports = {
  createIntentSchema,
  checkAvailabilitySchema,
  createFromPaymentSchema,
  cashBookingSchema,
  extendSchema,
  reasonSchema,
  confirmCashPaymentSchema,
  completeSchema,
  extensionActionSchema,
  getUserBookingsSchema
};
