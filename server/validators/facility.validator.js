const { z } = require("zod");

const createFacilitySchema = {
  body: z.object({
    name: z.string().min(1, "Name is required"),
    icon: z.string().optional(),
    category: z.string().optional().default("other"),
    displayOrder: z.number().int().optional().default(0),
    userId: z.string().optional() // User ID typically appended by authentication middleware
  })
};

const updateFacilitySchema = {
  body: z.object({
    name: z.string().optional(),
    icon: z.string().optional(),
    category: z.string().optional(),
    displayOrder: z.number().int().optional(),
    isActive: z.boolean().optional(),
    userId: z.string().optional()
  }),
  params: z.object({
    id: z.string().min(1, "ID is required")
  })
};

const bulkUpdateOrderSchema = {
  body: z.object({
    facilities: z.array(
      z.object({
        id: z.string().min(1),
        displayOrder: z.number().int()
      })
    ).min(1, "At least one facility is required")
  })
};

module.exports = {
  createFacilitySchema,
  updateFacilitySchema,
  bulkUpdateOrderSchema
};
