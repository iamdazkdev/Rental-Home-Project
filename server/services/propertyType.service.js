const PropertyType = require("../models/PropertyType");
const { HTTP_STATUS } = require("../constants");

class PropertyTypeService {
    async getAllPropertyTypes(activeOnly) {
        return activeOnly === "true" ? await PropertyType.getActive() : await PropertyType.getAll();
    }

    async getPropertyTypeById(id) {
        const type = await PropertyType.findById(id);
        if (!type) {
            const error = new Error("Property type not found");
            error.statusCode = HTTP_STATUS.NOT_FOUND;
            throw error;
        }
        return type;
    }

    async createPropertyType(data) {
        const existing = await PropertyType.findOne({ name: data.name });
        if (existing) {
            const error = new Error("Property type with this name already exists");
            error.statusCode = HTTP_STATUS.BAD_REQUEST;
            throw error;
        }

        const type = new PropertyType({ ...data, isActive: true, createdBy: data.userId });
        await type.save();
        return type;
    }

    async updatePropertyType(id, updateData) {
        const type = await PropertyType.findById(id);
        if (!type) {
            const error = new Error("Property type not found");
            error.statusCode = HTTP_STATUS.NOT_FOUND;
            throw error;
        }

        Object.keys(updateData).forEach(k => {
            if (updateData[k] !== undefined && k !== "userId") {
                type[k] = updateData[k];
            }
        });
        
        type.updatedBy = updateData.userId;
        await type.save();
        return type;
    }

    async deletePropertyType(id, permanent, userId) {
        if (permanent === "true") {
            await PropertyType.findByIdAndDelete(id);
            return { deleted: true };
        } else {
            const type = await PropertyType.findByIdAndUpdate(id, { isActive: false, updatedBy: userId }, { new: true });
            if (!type) {
                const error = new Error("Property type not found");
                error.statusCode = HTTP_STATUS.NOT_FOUND;
                throw error;
            }
            return { deleted: false, type };
        }
    }

    async reactivatePropertyType(id, userId) {
        const type = await PropertyType.findByIdAndUpdate(id, { isActive: true, updatedBy: userId }, { new: true });
        if (!type) {
            const error = new Error("Property type not found");
            error.statusCode = HTTP_STATUS.NOT_FOUND;
            throw error;
        }
        return type;
    }

    async bulkUpdate(types) {
        const bulkOps = types.map(t => ({
            updateOne: { filter: { _id: t.id }, update: { displayOrder: t.displayOrder } }
        }));
        await PropertyType.bulkWrite(bulkOps);
    }
}

module.exports = new PropertyTypeService();
