const Category = require("../models/Category");
const { HTTP_STATUS } = require("../constants");

class CategoryService {
    async getAllCategories(activeOnly) {
        return activeOnly === "true" ? await Category.getActive() : await Category.getAll();
    }

    async getCategoryById(id) {
        const category = await Category.findById(id);
        if (!category) {
            const error = new Error("Category not found");
            error.statusCode = HTTP_STATUS.NOT_FOUND;
            throw error;
        }
        return category;
    }

    async createCategory(data) {
        const existing = await Category.findOne({ label: data.label });
        if (existing) {
            const error = new Error("Category with this label already exists");
            error.statusCode = HTTP_STATUS.BAD_REQUEST;
            throw error;
        }

        const category = new Category({ ...data, isActive: true, createdBy: data.userId });
        await category.save();
        return category;
    }

    async updateCategory(id, updateData) {
        const category = await Category.findById(id);
        if (!category) {
            const error = new Error("Category not found");
            error.statusCode = HTTP_STATUS.NOT_FOUND;
            throw error;
        }

        Object.keys(updateData).forEach(key => {
            if (updateData[key] !== undefined && key !== "userId") {
                category[key] = updateData[key];
            }
        });
        
        category.updatedBy = updateData.userId;
        await category.save();
        return category;
    }

    async deleteCategory(id, permanent, userId) {
        if (permanent === "true") {
            await Category.findByIdAndDelete(id);
            return { deleted: true };
        } else {
            const category = await Category.findByIdAndUpdate(id, { isActive: false, updatedBy: userId }, { new: true });
            if (!category) {
                const error = new Error("Category not found");
                error.statusCode = HTTP_STATUS.NOT_FOUND;
                throw error;
            }
            return { deleted: false, category };
        }
    }

    async reactivateCategory(id, userId) {
        const category = await Category.findByIdAndUpdate(id, { isActive: true, updatedBy: userId }, { new: true });
        if (!category) {
            const error = new Error("Category not found");
            error.statusCode = HTTP_STATUS.NOT_FOUND;
            throw error;
        }
        return category;
    }

    async bulkUpdate(categories) {
        const bulkOps = categories.map(cat => ({
            updateOne: {
                filter: { _id: cat.id },
                update: { displayOrder: cat.displayOrder }
            }
        }));
        await Category.bulkWrite(bulkOps);
    }
}

module.exports = new CategoryService();
