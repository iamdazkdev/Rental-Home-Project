const categoryService = require("../services/category.service");
const { HTTP_STATUS } = require("../constants");

const getAllCategories = async (req, res) => {
    const categories = await categoryService.getAllCategories(req.query.activeOnly);
    res.status(HTTP_STATUS.OK).json(categories);
};

const getCategoryById = async (req, res) => {
    const category = await categoryService.getCategoryById(req.params.id);
    res.status(HTTP_STATUS.OK).json(category);
};

const createCategory = async (req, res) => {
    const category = await categoryService.createCategory(req.body);
    res.status(HTTP_STATUS.CREATED).json({ message: "Category created successfully", category });
};

const updateCategory = async (req, res) => {
    const category = await categoryService.updateCategory(req.params.id, req.body);
    res.status(HTTP_STATUS.OK).json({ message: "Category updated successfully", category });
};

const deleteCategory = async (req, res) => {
    const result = await categoryService.deleteCategory(req.params.id, req.query.permanent, req.body.userId);
    if (result.deleted) {
        res.status(HTTP_STATUS.OK).json({ message: "Category permanently deleted" });
    } else {
        res.status(HTTP_STATUS.OK).json({ message: "Category deactivated successfully", category: result.category });
    }
};

const reactivateCategory = async (req, res) => {
    const category = await categoryService.reactivateCategory(req.params.id, req.body.userId);
    res.status(HTTP_STATUS.OK).json({ message: "Category reactivated successfully", category });
};

const bulkUpdateOrder = async (req, res) => {
    await categoryService.bulkUpdate(req.body.categories);
    res.status(HTTP_STATUS.OK).json({ message: "Display order updated successfully" });
};

module.exports = {
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
    reactivateCategory,
    bulkUpdateOrder
};
