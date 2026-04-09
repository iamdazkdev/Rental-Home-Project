const { z } = require("zod");
const mongoose = require("mongoose");

const objectIdValidator = z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), "Invalid ObjectId format");

const createSchema = {
  body: z.object({
    customerId: objectIdValidator,
    hostId: objectIdValidator,
    listingId: objectIdValidator,
    bookingType: z.string().optional(),
    startDate: z.string().min(1),
    endDate: z.string().min(1),
    totalPrice: z.coerce.number().min(0),
    paymentMethod: z.string().optional(),
    paymentType: z.string().optional(),
    paymentAmount: z.coerce.number().optional(),
    depositPercentage: z.coerce.number().optional(),
    depositAmount: z.coerce.number().optional(),
    remainingAmount: z.coerce.number().optional()
  })
};

const checkAvailabilitySchema = {
  params: z.object({ listingId: objectIdValidator }),
  query: z.object({
    startDate: z.string().min(1),
    endDate: z.string().min(1),
    userId: objectIdValidator.optional()
  })
};

const cancelSchema = {
  params: z.object({ intentId: z.string() }),
  body: z.object({
    userId: objectIdValidator,
    reason: z.string().optional()
  })
};

const confirmSchema = {
  params: z.object({ intentId: z.string() }),
  body: z.object({
    transactionId: z.string().optional()
  })
};

module.exports = {
  createSchema,
  checkAvailabilitySchema,
  cancelSchema,
  confirmSchema
};
