const { z } = require("zod");
const mongoose = require("mongoose");

const objectIdValidator = z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), "Invalid ObjectId format");

const userIdSchema = {
    params: z.object({ userId: objectIdValidator })
};

const getMessagesSchema = {
    params: z.object({ conversationId: z.string().min(1) }),
    query: z.object({ userId: objectIdValidator.optional() })
};

const sendMessageSchema = {
    body: z.object({
        senderId: objectIdValidator,
        receiverId: objectIdValidator,
        listingId: objectIdValidator.optional(),
        message: z.string().min(1),
        messageType: z.string().optional()
    })
};

const markReadSchema = {
    params: z.object({ conversationId: z.string().min(1) }),
    body: z.object({ userId: objectIdValidator })
};

module.exports = {
    userIdSchema,
    getMessagesSchema,
    sendMessageSchema,
    markReadSchema
};
