const mongoose = require('mongoose');

/**
 * CustomPrice Model
 * Allows hosts to set special pricing for specific dates
 * Used for peak seasons, holidays, events, etc.
 */
const customPriceSchema = new mongoose.Schema({
    listingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Listing',
        required: true,
        index: true
    },
    hostId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    date: {
        type: Date,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    reason: {
        type: String,
        maxlength: 200
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Unique constraint: one custom price per listing per date
customPriceSchema.index({listingId: 1, date: 1}, {unique: true});

// Method to check if custom price is valid for a date
customPriceSchema.methods.isValidForDate = function (checkDate) {
    const priceDate = new Date(this.date);
    priceDate.setHours(0, 0, 0, 0);

    const compareDate = new Date(checkDate);
    compareDate.setHours(0, 0, 0, 0);

    return priceDate.getTime() === compareDate.getTime() && this.isActive;
};

module.exports = mongoose.model('CustomPrice', customPriceSchema);

