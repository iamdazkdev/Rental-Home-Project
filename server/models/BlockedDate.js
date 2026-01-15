const mongoose = require('mongoose');

/**
 * BlockedDate Model
 * Represents dates that are blocked by hosts for their listings
 * Used to prevent bookings on specific dates (maintenance, personal use, etc.)
 */
const blockedDateSchema = new mongoose.Schema({
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
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    reason: {
        type: String,
        enum: ['maintenance', 'personal', 'holiday', 'renovation', 'other'],
        default: 'personal'
    },
    note: {
        type: String,
        maxlength: 500
    },
    recurring: {
        enabled: {
            type: Boolean,
            default: false
        },
        pattern: {
            type: String,
            enum: ['weekly', 'monthly', 'yearly'],
            required: function () {
                return this.recurring.enabled;
            }
        },
        endRecurring: {
            type: Date,
            required: function () {
                return this.recurring.enabled;
            }
        }
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Compound index for efficient queries
blockedDateSchema.index({listingId: 1, startDate: 1, endDate: 1});
blockedDateSchema.index({hostId: 1, isActive: 1});

// Validation: endDate must be >= startDate
blockedDateSchema.pre('save', function (next) {
    if (this.endDate < this.startDate) {
        next(new Error('End date must be greater than or equal to start date'));
    }
    next();
});

// Method to check if a date range overlaps with this blocked period
blockedDateSchema.methods.overlaps = function (startDate, endDate) {
    return (
        (startDate <= this.endDate && endDate >= this.startDate)
    );
};

module.exports = mongoose.model('BlockedDate', blockedDateSchema);

