const Facility = require("../models/Facility");

/**
 * Get all facilities (active only, or by category)
 */
const getFacilities = async ({ activeOnly, category }) => {
  if (category) {
    return await Facility.getByCategory(category);
  } else if (activeOnly === "true" || activeOnly === true) {
    return await Facility.getActive();
  } else {
    return await Facility.getAll();
  }
};

/**
 * Get facility by ID
 */
const getFacilityById = async (id) => {
  return await Facility.findById(id);
};

/**
 * Create a new facility
 */
const createFacility = async (data) => {
  const existing = await Facility.findOne({ name: data.name });
  if (existing) {
    const error = new Error("Facility with this name already exists");
    error.status = 400; // Standard format matched by errorHandler middleware (which uses err.status or err.statusCode)
    throw error;
  }

  const facility = new Facility({
    name: data.name,
    icon: data.icon,
    category: data.category || "other",
    displayOrder: data.displayOrder || 0,
    isActive: true,
    createdBy: data.userId,
  });

  return await facility.save();
};

/**
 * Update an existing facility
 */
const updateFacility = async (id, data) => {
  const facility = await Facility.findById(id);
  if (!facility) {
    const error = new Error("Facility not found");
    error.status = 404;
    throw error;
  }

  // Update fields
  if (data.name !== undefined) facility.name = data.name;
  if (data.icon !== undefined) facility.icon = data.icon;
  if (data.category !== undefined) facility.category = data.category;
  if (data.displayOrder !== undefined) facility.displayOrder = data.displayOrder;
  if (data.isActive !== undefined) facility.isActive = data.isActive;

  if (data.userId) facility.updatedBy = data.userId;

  return await facility.save();
};

/**
 * Delete or deactivate facility
 */
const deleteFacility = async (id, permanent, updatedByUserId) => {
  if (permanent === "true" || permanent === true) {
    await Facility.findByIdAndDelete(id);
    return { permanent: true };
  } else {
    const facility = await Facility.findByIdAndUpdate(
      id,
      { isActive: false, updatedBy: updatedByUserId },
      { new: true }
    );

    if (!facility) {
      const error = new Error("Facility not found");
      error.status = 404;
      throw error;
    }
    return { permanent: false, facility };
  }
};

/**
 * Reactivate a facility
 */
const reactivateFacility = async (id, updatedByUserId) => {
  const facility = await Facility.findByIdAndUpdate(
    id,
    { isActive: true, updatedBy: updatedByUserId },
    { new: true }
  );

  if (!facility) {
    const error = new Error("Facility not found");
    error.status = 404;
    throw error;
  }
  return facility;
};

/**
 * Bulk update display order
 */
const bulkUpdateDisplayOrder = async (facilities) => {
  const bulkOps = facilities.map((f) => ({
    updateOne: {
      filter: { _id: f.id },
      update: { displayOrder: f.displayOrder }
    }
  }));

  return await Facility.bulkWrite(bulkOps);
};

module.exports = {
  getFacilities,
  getFacilityById,
  createFacility,
  updateFacility,
  deleteFacility,
  reactivateFacility,
  bulkUpdateDisplayOrder
};
