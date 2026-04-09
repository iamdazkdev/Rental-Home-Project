const { z } = require("zod");
const mongoose = require("mongoose");

const objectIdValidator = z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), "Invalid ObjectId format");

const createPaymentUrlSchema = {
    body: z.object({
        tempOrderId: z.string().optional(),
        bookingData: z.record(z.any()).optional(),
        amount: z.coerce.number().min(1, "Valid amount is required"),
        orderInfo: z.string().optional(),
        ipAddr: z.string().optional(),
        returnUrl: z.string().optional()
    }).refine(data => data.tempOrderId || data.bookingData, {
        message: "Either tempOrderId or bookingData is required"
    })
};

const queryTransactionSchema = {
    body: z.object({
        orderId: objectIdValidator
    })
};

module.exports = {
    createPaymentUrlSchema,
    queryTransactionSchema
};
