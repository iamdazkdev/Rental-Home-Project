const facilityService = require("../services/facility.service");
const { HTTP_STATUS } = require("../constants");

const getFacilities = async (req, res) => {
  const facilities = await facilityService.getFacilities(req.query);
  console.log(`✅ Found ${facilities.length} facilities`);
  res.status(HTTP_STATUS.OK).json(facilities);
};

const getFacilityById = async (req, res) => {
  const facility = await facilityService.getFacilityById(req.params.id);
  if (!facility) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({ message: "Facility not found" });
  }
  res.status(HTTP_STATUS.OK).json(facility);
};

const createFacility = async (req, res) => {
  const facility = await facilityService.createFacility(req.body);
  console.log(`✅ Facility created: ${facility.name}`);
  res.status(HTTP_STATUS.CREATED).json({
    message: "Facility created successfully",
    facility,
  });
};

const updateFacility = async (req, res) => {
  const facility = await facilityService.updateFacility(req.params.id, req.body);
  console.log(`✅ Facility updated: ${facility.name}`);
  res.status(HTTP_STATUS.OK).json({
    message: "Facility updated successfully",
    facility,
  });
};

const deleteFacility = async (req, res) => {
  const result = await facilityService.deleteFacility(req.params.id, req.query.permanent, req.body.userId);
  if (result.permanent) {
    console.log(`🗑️  Facility permanently deleted: ${req.params.id}`);
    res.status(HTTP_STATUS.OK).json({ message: "Facility permanently deleted" });
  } else {
    console.log(`✅ Facility deactivated: ${result.facility.name}`);
    res.status(HTTP_STATUS.OK).json({
      message: "Facility deactivated successfully",
      facility: result.facility,
    });
  }
};

const reactivateFacility = async (req, res) => {
  const facility = await facilityService.reactivateFacility(req.params.id, req.body.userId);
  console.log(`✅ Facility reactivated: ${facility.name}`);
  res.status(HTTP_STATUS.OK).json({
    message: "Facility reactivated successfully",
    facility,
  });
};

const bulkUpdateDisplayOrder = async (req, res) => {
  await facilityService.bulkUpdateDisplayOrder(req.body.facilities);
  console.log(`✅ Updated display order for ${req.body.facilities.length} facilities`);
  res.status(HTTP_STATUS.OK).json({
    message: "Display order updated successfully",
  });
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
