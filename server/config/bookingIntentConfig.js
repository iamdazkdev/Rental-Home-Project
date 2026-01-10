/**
 * Booking Intent Configuration
 * Centralized configuration for BookingIntent timeout and lock duration
 */

// BookingIntent timeout in minutes
// This is the time a user has to complete payment after creating a booking intent
const BOOKING_INTENT_TIMEOUT_MINUTES = 30;

// Convert to milliseconds for JavaScript Date calculations
const BOOKING_INTENT_TIMEOUT_MS = BOOKING_INTENT_TIMEOUT_MINUTES * 60 * 1000;

// Max extension time from original lock (in minutes)
const MAX_INTENT_LOCK_DURATION_MINUTES = 30;

module.exports = {
    BOOKING_INTENT_TIMEOUT_MINUTES,
    BOOKING_INTENT_TIMEOUT_MS,
    MAX_INTENT_LOCK_DURATION_MINUTES,
};

