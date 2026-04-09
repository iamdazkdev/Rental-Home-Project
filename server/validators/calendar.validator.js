const { z } = require("zod");
const mongoose = require("mongoose");

const objectIdValidator = z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), "Invalid ObjectId format");

const calendarGetSchema = {
    params: z.object({ listingId: objectIdValidator }),
    query: z.object({
        month: z.coerce.number().min(1).max(12).optional(),
        year: z.coerce.number().min(1970).optional()
    })
};

const blockDateSchema = {
    params: z.object({ listingId: objectIdValidator }),
    body: z.object({
        startDate: z.string().min(1),
        endDate: z.string().min(1),
        reason: z.string().optional(),
        note: z.string().optional(),
        recurring: z.any().optional()
    })
};

const deleteBlockSchema = {
    params: z.object({
        listingId: objectIdValidator,
        blockId: objectIdValidator
    })
};

const setPricingSchema = {
    params: z.object({ listingId: objectIdValidator }),
    body: z.object({
        date: z.string().min(1),
        price: z.coerce.number().min(0.01),
        reason: z.string().optional()
    })
};

const deletePricingSchema = {
    params: z.object({
        listingId: objectIdValidator,
        priceId: objectIdValidator
    })
};

const checkAvailabilitySchema = {
    params: z.object({ listingId: objectIdValidator }),
    query: z.object({
        startDate: z.string().min(1),
        endDate: z.string().min(1)
    })
};

module.exports = {
    calendarGetSchema,
    blockDateSchema,
    deleteBlockSchema,
    setPricingSchema,
    deletePricingSchema,
    checkAvailabilitySchema
};
