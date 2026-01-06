/**
 * useConcurrentBooking Hook
 *
 * React hook for handling concurrent booking with locking mechanism
 * Provides automatic lock management and countdown timer
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  checkListingAvailability,
  createBookingIntent,
  getBookingIntent,
  confirmBookingPayment,
  cancelBookingIntent,
  extendBookingLock,
  getUserActiveIntent,
} from '../utils/concurrentBookingService';

const useConcurrentBooking = (listingId, customerId) => {
  const [intent, setIntent] = useState(null);
  const [isLocking, setIsLocking] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  const [lockError, setLockError] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isExpired, setIsExpired] = useState(false);

  const countdownRef = useRef(null);

  // Start countdown timer
  const startCountdown = useCallback((expiresAt) => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }

    const updateCountdown = () => {
      const now = new Date();
      const expiry = new Date(expiresAt);
      const remaining = Math.max(0, Math.floor((expiry - now) / 1000));

      setTimeRemaining(remaining);

      if (remaining === 0) {
        setIsExpired(true);
        clearInterval(countdownRef.current);
      }
    };

    updateCountdown();
    countdownRef.current = setInterval(updateCountdown, 1000);
  }, []);

  // Cleanup countdown on unmount
  useEffect(() => {
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, []);

  // Check availability
  const checkAvailability = useCallback(async (startDate, endDate) => {
    try {
      const result = await checkListingAvailability(listingId, startDate, endDate);
      setIsAvailable(result.available);
      return result;
    } catch (error) {
      console.error('Error checking availability:', error);
      throw error;
    }
  }, [listingId]);

  // Create booking lock
  const createLock = useCallback(async (bookingData) => {
    setIsLocking(true);
    setLockError(null);

    try {
      const result = await createBookingIntent({
        ...bookingData,
        customerId,
        listingId,
      });

      if (result.success) {
        setIntent(result.intent);
        setIsAvailable(true);
        setIsExpired(false);
        startCountdown(result.expiresAt);
        return result;
      } else {
        setIsAvailable(false);
        setLockError(result.message);
        return result;
      }
    } catch (error) {
      setLockError(error.message);
      throw error;
    } finally {
      setIsLocking(false);
    }
  }, [customerId, listingId, startCountdown]);

  // Confirm payment
  const confirmPayment = useCallback(async (transactionId = null) => {
    if (!intent) {
      throw new Error('No active booking intent');
    }

    try {
      const result = await confirmBookingPayment(intent.intentId, transactionId);

      if (result.success) {
        if (countdownRef.current) {
          clearInterval(countdownRef.current);
        }
        setIntent(null);
        setTimeRemaining(0);
      }

      return result;
    } catch (error) {
      console.error('Error confirming payment:', error);
      throw error;
    }
  }, [intent]);

  // Cancel lock
  const cancelLock = useCallback(async (reason = 'User cancelled') => {
    if (!intent) {
      return { success: true };
    }

    try {
      const result = await cancelBookingIntent(intent.intentId, reason);

      if (result.success) {
        if (countdownRef.current) {
          clearInterval(countdownRef.current);
        }
        setIntent(null);
        setTimeRemaining(0);
        setIsExpired(false);
      }

      return result;
    } catch (error) {
      console.error('Error cancelling lock:', error);
      throw error;
    }
  }, [intent]);

  // Extend lock
  const extendLock = useCallback(async (additionalMinutes = 5) => {
    if (!intent) {
      throw new Error('No active booking intent');
    }

    try {
      const result = await extendBookingLock(intent.intentId, additionalMinutes);

      if (result.success) {
        setIntent(result.intent);
        setIsExpired(false);
        startCountdown(result.newExpiresAt);
      }

      return result;
    } catch (error) {
      console.error('Error extending lock:', error);
      throw error;
    }
  }, [intent, startCountdown]);

  // Check for existing intent on mount
  useEffect(() => {
    const checkExistingIntent = async () => {
      if (!customerId || !listingId) return;

      try {
        const result = await getUserActiveIntent(customerId, listingId);

        if (result.hasActiveIntent && result.intent) {
          setIntent(result.intent);
          setIsExpired(false);
          startCountdown(result.intent.expiresAt);
        }
      } catch (error) {
        console.error('Error checking existing intent:', error);
      }
    };

    checkExistingIntent();
  }, [customerId, listingId, startCountdown]);

  // Format time remaining for display
  const formatTimeRemaining = useCallback(() => {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [timeRemaining]);

  return {
    // State
    intent,
    isLocking,
    isAvailable,
    lockError,
    timeRemaining,
    isExpired,
    hasActiveLock: intent !== null && !isExpired,

    // Actions
    checkAvailability,
    createLock,
    confirmPayment,
    cancelLock,
    extendLock,

    // Helpers
    formatTimeRemaining,
  };
};

export default useConcurrentBooking;

