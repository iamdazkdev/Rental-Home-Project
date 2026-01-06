/**
 * Concurrent Booking Service
 *
 * Frontend service for handling concurrent booking with locking mechanism
 */

import { API_URL } from '../config/api';

const CONCURRENT_BOOKING_API = `${API_URL}/concurrent-booking`;

/**
 * Check if listing is available for the given dates
 */
export const checkListingAvailability = async (listingId, startDate, endDate) => {
  try {
    const response = await fetch(
      `${CONCURRENT_BOOKING_API}/availability/${listingId}?startDate=${startDate}&endDate=${endDate}`
    );
    return await response.json();
  } catch (error) {
    console.error('Error checking availability:', error);
    throw error;
  }
};

/**
 * Create a booking intent (lock the listing)
 */
export const createBookingIntent = async (bookingData) => {
  try {
    const response = await fetch(`${CONCURRENT_BOOKING_API}/intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bookingData),
    });
    return await response.json();
  } catch (error) {
    console.error('Error creating booking intent:', error);
    throw error;
  }
};

/**
 * Get booking intent by ID
 */
export const getBookingIntent = async (intentId) => {
  try {
    const response = await fetch(`${CONCURRENT_BOOKING_API}/intent/${intentId}`);
    return await response.json();
  } catch (error) {
    console.error('Error getting booking intent:', error);
    throw error;
  }
};

/**
 * Confirm payment and create booking
 */
export const confirmBookingPayment = async (intentId, transactionId = null) => {
  try {
    const response = await fetch(`${CONCURRENT_BOOKING_API}/confirm/${intentId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ transactionId }),
    });
    return await response.json();
  } catch (error) {
    console.error('Error confirming payment:', error);
    throw error;
  }
};

/**
 * Cancel booking intent (release lock)
 */
export const cancelBookingIntent = async (intentId, reason = 'User cancelled') => {
  try {
    const response = await fetch(`${CONCURRENT_BOOKING_API}/intent/${intentId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason }),
    });
    return await response.json();
  } catch (error) {
    console.error('Error cancelling booking intent:', error);
    throw error;
  }
};

/**
 * Extend booking intent lock
 */
export const extendBookingLock = async (intentId, additionalMinutes = 5) => {
  try {
    const response = await fetch(`${CONCURRENT_BOOKING_API}/intent/${intentId}/extend`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ additionalMinutes }),
    });
    return await response.json();
  } catch (error) {
    console.error('Error extending lock:', error);
    throw error;
  }
};

/**
 * Get user's active intent for a listing
 */
export const getUserActiveIntent = async (customerId, listingId) => {
  try {
    const response = await fetch(
      `${CONCURRENT_BOOKING_API}/user/${customerId}/listing/${listingId}`
    );
    return await response.json();
  } catch (error) {
    console.error('Error getting user active intent:', error);
    throw error;
  }
};

export default {
  checkListingAvailability,
  createBookingIntent,
  getBookingIntent,
  confirmBookingPayment,
  cancelBookingIntent,
  extendBookingLock,
  getUserActiveIntent,
};

