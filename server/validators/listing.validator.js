const { z } = require("zod");

const parseJsonStr = (val) => {
  if (typeof val === 'string') {
    try {
      return JSON.parse(val);
    } catch(e) {
      return val;
    }
  }
  return val;
};

const createListingSchema = {
  body: z.object({
    creator: z.string(),
    category: z.string().refine(val => val !== "All", { message: "Category cannot be 'All'" }),
    type: z.string().min(1, "Property type is required"),
    streetAddress: z.string(),
    aptSuite: z.string().optional(),
    city: z.string(),
    province: z.string(),
    country: z.string(),
    guestCount: z.coerce.number().min(1),
    bedroomCount: z.coerce.number().min(1),
    bathroomCount: z.coerce.number().min(1),
    bedCount: z.coerce.number().min(1),
    amenities: z.preprocess(parseJsonStr, z.array(z.string()).or(z.string())).optional(),
    title: z.string(),
    description: z.string(),
    highlight: z.string().optional(),
    highlightDesc: z.string().optional(),
    price: z.coerce.number(),
    monthlyPrice: z.coerce.number().optional(),
    pricingType: z.string().optional(),
    hostProfile: z.preprocess(parseJsonStr, z.record(z.any()).or(z.null())).optional(),
  })
};

const updateListingSchema = {
  params: z.object({ id: z.string() }),
  body: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    type: z.string().optional(),
    price: z.coerce.number().optional(),
    streetAddress: z.string().optional(),
    aptSuite: z.string().optional().default(""),
    city: z.string().optional(),
    province: z.string().optional(),
    country: z.string().optional(),
    bedroomCount: z.coerce.number().optional().default(1),
    bedCount: z.coerce.number().optional().default(1),
    bathroomCount: z.coerce.number().optional().default(1),
    guestCount: z.coerce.number().optional().default(1),
    amenities: z.preprocess(parseJsonStr, z.array(z.string()).or(z.string())).optional()
  })
};

module.exports = { createListingSchema, updateListingSchema };
