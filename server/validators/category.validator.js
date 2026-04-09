const { z } = require("zod");
const mongoose = require("mongoose");

const objectIdValidator = z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), "Invalid ObjectId format");

const getAllQuerySchema = {
    query: z.object({ activeOnly: z.enum(["true", "false"]).optional() })
};

const idParamSchema = {
    params: z.object({ id: objectIdValidator })
};

const createCategorySchema = {
    body: z.object({
        label: z.string().min(1),
        description: z.string().optional(),
        img: z.string().optional(),
        icon: z.string().optional(),
        displayOrder: z.coerce.number().optional(),
        userId: objectIdValidator.optional()
    })
};

const updateCategorySchema = {
    params: z.object({ id: objectIdValidator }),
    body: z.object({
        label: z.string().min(1).optional(),
        description: z.string().optional(),
        img: z.string().optional(),
        icon: z.string().optional(),
        displayOrder: z.coerce.number().optional(),
        isActive: z.boolean().optional(),
        userId: objectIdValidator.optional()
    })
};

const deleteCategorySchema = {
    params: z.object({ id: objectIdValidator }),
    query: z.object({ permanent: z.enum(["true", "false"]).optional() })
};

const bulkUpdateSchema = {
    body: z.object({
        categories: z.array(z.object({
            id: objectIdValidator,
            displayOrder: z.coerce.number()
        }))
    })
};

module.exports = {
    getAllQuerySchema,
    idParamSchema,
    createCategorySchema,
    updateCategorySchema,
    deleteCategorySchema,
    bulkUpdateSchema
};
