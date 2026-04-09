const typeService = require("../services/propertyType.service");
const { HTTP_STATUS } = require("../constants");

const getAllPropertyTypes = async (req, res) => {
    const types = await typeService.getAllPropertyTypes(req.query.activeOnly);
    res.status(HTTP_STATUS.OK).json(types);
};

const getPropertyTypeById = async (req, res) => {
    const type = await typeService.getPropertyTypeById(req.params.id);
    res.status(HTTP_STATUS.OK).json(type);
};

const createPropertyType = async (req, res) => {
    const type = await typeService.createPropertyType(req.body);
    res.status(HTTP_STATUS.CREATED).json({ message: "Property type created successfully", type });
};

const updatePropertyType = async (req, res) => {
    const type = await typeService.updatePropertyType(req.params.id, req.body);
    res.status(HTTP_STATUS.OK).json({ message: "Property type updated successfully", type });
};

const deletePropertyType = async (req, res) => {
    const result = await typeService.deletePropertyType(req.params.id, req.query.permanent, req.body.userId);
    if (result.deleted) {
        res.status(HTTP_STATUS.OK).json({ message: "Property type permanently deleted" });
    } else {
        res.status(HTTP_STATUS.OK).json({ message: "Property type deactivated successfully", type: result.type });
    }
};

const reactivatePropertyType = async (req, res) => {
    const type = await typeService.reactivatePropertyType(req.params.id, req.body.userId);
    res.status(HTTP_STATUS.OK).json({ message: "Property type reactivated successfully", type });
};

const bulkUpdateOrder = async (req, res) => {
    await typeService.bulkUpdate(req.body.types);
    res.status(HTTP_STATUS.OK).json({ message: "Display order updated successfully" });
};

module.exports = {
    getAllPropertyTypes,
    getPropertyTypeById,
    createPropertyType,
    updatePropertyType,
    deletePropertyType,
    reactivatePropertyType,
    bulkUpdateOrder
};
