/**
 * CONCURRENT BOOKING TEST SCRIPT
 *
 * This script simulates multiple users trying to book the same listing
 * at the same time to test the booking intent locking mechanism.
 *
 * Usage: node scripts/testConcurrentBooking.js
 *
 * Prerequisites:
 * - Server must be running on localhost:3001
 * - MongoDB must be connected
 * - At least one listing must exist in the database
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

// Test configuration
const CONFIG = {
  // Number of concurrent users to simulate
  CONCURRENT_USERS: 5,

  // Listing ID to test (will be fetched dynamically if not set)
  LISTING_ID: null,

  // Booking dates - use dates 60+ days in the future to avoid existing bookings
  START_DATE: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toDateString(), // 60 days from now
  END_DATE: new Date(Date.now() + 63 * 24 * 60 * 60 * 1000).toDateString(), // 63 days from now

  // Test user IDs (simulated - using valid 24-character MongoDB ObjectIds)
  TEST_USERS: [
    { id: '6950fa375d1324f5c10cf2e1', name: 'User A' },
    { id: '6950fa375d1324f5c10cf2e2', name: 'User B' },
    { id: '6950fa375d1324f5c10cf2e3', name: 'User C' },
    { id: '6950fa375d1324f5c10cf2e4', name: 'User D' },
    { id: '6950fa375d1324f5c10cf2e5', name: 'User E' },
  ],
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

function logUser(userName, color, message) {
  console.log(`${color}[${userName}] ${message}${colors.reset}`);
}

/**
 * Fetch a listing to use for testing
 */
async function fetchTestListing() {
  try {
    const response = await axios.get(`${BASE_URL}/listing`);
    if (response.data && response.data.length > 0) {
      const listing = response.data[0];
      log(colors.cyan, `\n📋 Using listing: "${listing.title}" (ID: ${listing._id})`);
      return listing;
    }
    throw new Error('No listings found');
  } catch (error) {
    log(colors.red, `❌ Failed to fetch listings: ${error.message}`);
    throw error;
  }
}

/**
 * Simulate a user attempting to create a booking intent
 */
async function attemptBooking(user, listing, startDate, endDate) {
  const startTime = Date.now();

  try {
    logUser(user.name, colors.yellow, `🔄 Attempting to create booking intent...`);

    const response = await axios.post(`${BASE_URL}/booking-intent/create`, {
      customerId: user.id,
      hostId: listing.creator._id || listing.creator,
      listingId: listing._id,
      bookingType: 'entire_place',
      startDate: startDate,
      endDate: endDate,
      totalPrice: listing.price * 3, // 3 nights
      paymentMethod: 'vnpay',
      paymentType: 'full',
      paymentAmount: listing.price * 3,
    });

    const duration = Date.now() - startTime;

    if (response.data.success) {
      if (response.data.isExisting) {
        logUser(user.name, colors.blue, `🔄 Already has active lock (${duration}ms)`);
      } else {
        logUser(user.name, colors.green, `✅ SUCCESS! Got booking lock (${duration}ms)`);
        logUser(user.name, colors.green, `   Intent ID: ${response.data.bookingIntent.intentId}`);
        logUser(user.name, colors.green, `   Expires in: ${response.data.expiresIn} seconds`);
      }
      return { success: true, user, response: response.data, duration };
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorData = error.response?.data;

    if (error.response?.status === 409) {
      if (errorData?.conflictType === 'locked_by_other') {
        logUser(user.name, colors.red, `🔒 BLOCKED! Listing locked by another user (${duration}ms)`);
        logUser(user.name, colors.red, `   Retry after: ${errorData.retryAfterSeconds} seconds`);
      } else if (errorData?.conflictType === 'existing_booking') {
        logUser(user.name, colors.red, `📅 BLOCKED! Already has confirmed booking (${duration}ms)`);
      }
    } else {
      logUser(user.name, colors.red, `❌ ERROR: ${errorData?.message || error.message} (${duration}ms)`);
    }

    return { success: false, user, error: errorData || error.message, duration };
  }
}

/**
 * Check availability for a listing
 */
async function checkAvailability(user, listingId, startDate, endDate) {
  try {
    const response = await axios.get(
      `${BASE_URL}/booking-intent/check-availability/${listingId}`,
      { params: { startDate, endDate, userId: user.id } }
    );

    logUser(user.name, colors.cyan, `📊 Availability check: ${response.data.available ? 'Available' : 'Not available'}`);
    if (!response.data.available) {
      logUser(user.name, colors.cyan, `   Reason: ${response.data.reason}`);
    }

    return response.data;
  } catch (error) {
    logUser(user.name, colors.red, `❌ Availability check failed: ${error.message}`);
    return null;
  }
}

/**
 * Cancel a booking intent
 */
async function cancelBookingIntent(user, intentId) {
  try {
    const response = await axios.put(`${BASE_URL}/booking-intent/${intentId}/cancel`, {
      userId: user.id,
      reason: 'Test cancellation',
    });

    if (response.data.success) {
      logUser(user.name, colors.yellow, `🗑️ Cancelled booking intent: ${intentId}`);
    }
    return response.data;
  } catch (error) {
    logUser(user.name, colors.red, `❌ Failed to cancel: ${error.message}`);
    return null;
  }
}

/**
 * Confirm a booking intent (simulate payment success)
 */
async function confirmBookingIntent(user, intentId) {
  try {
    const transactionId = `TEST_TXN_${Date.now()}`;

    const response = await axios.put(`${BASE_URL}/booking-intent/${intentId}/confirm`, {
      transactionId,
    });

    if (response.data.success) {
      logUser(user.name, colors.green, `✅ Confirmed booking! Booking ID: ${response.data.booking._id}`);
    }
    return response.data;
  } catch (error) {
    logUser(user.name, colors.red, `❌ Failed to confirm: ${error.response?.data?.message || error.message}`);
    return null;
  }
}

/**
 * Release expired locks
 */
async function releaseExpiredLocks() {
  try {
    const response = await axios.post(`${BASE_URL}/booking-intent/release-expired`);
    log(colors.cyan, `🔓 Released ${response.data.releasedCount} expired locks`);
    return response.data;
  } catch (error) {
    log(colors.red, `❌ Failed to release expired locks: ${error.message}`);
    return null;
  }
}

/**
 * TEST SCENARIO 1: Multiple users booking at the exact same time
 */
async function testConcurrentBooking() {
  log(colors.magenta, '\n' + '='.repeat(70));
  log(colors.magenta, '📋 TEST SCENARIO 1: Concurrent Booking Attempts');
  log(colors.magenta, '='.repeat(70));
  log(colors.cyan, `Simulating ${CONFIG.CONCURRENT_USERS} users trying to book the same listing simultaneously\n`);

  // Fetch a test listing
  const listing = await fetchTestListing();
  CONFIG.LISTING_ID = listing._id;

  // Get test users
  const users = CONFIG.TEST_USERS.slice(0, CONFIG.CONCURRENT_USERS);

  log(colors.cyan, `\n🗓️ Booking dates: ${CONFIG.START_DATE} to ${CONFIG.END_DATE}`);
  log(colors.cyan, `👥 Users: ${users.map(u => u.name).join(', ')}\n`);

  // All users attempt to book at the same time
  log(colors.yellow, '🚀 Starting concurrent booking attempts...\n');

  const startTime = Date.now();
  const results = await Promise.all(
    users.map(user => attemptBooking(user, listing, CONFIG.START_DATE, CONFIG.END_DATE))
  );
  const totalTime = Date.now() - startTime;

  // Analyze results
  log(colors.magenta, '\n' + '-'.repeat(70));
  log(colors.magenta, '📊 RESULTS SUMMARY');
  log(colors.magenta, '-'.repeat(70));

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  log(colors.green, `✅ Successful locks: ${successful.length}`);
  log(colors.red, `❌ Blocked requests: ${failed.length}`);
  log(colors.cyan, `⏱️ Total time: ${totalTime}ms`);

  if (successful.length === 1) {
    log(colors.green, `\n🎉 PASS! Only one user got the lock as expected.`);
    log(colors.green, `   Winner: ${successful[0].user.name}`);
  } else if (successful.length === 0) {
    log(colors.yellow, `\n⚠️ No successful locks - listing may already be booked.`);
  } else {
    log(colors.red, `\n❌ FAIL! Multiple users got locks - this should not happen!`);
  }

  return { successful, failed, listing };
}

/**
 * TEST SCENARIO 2: Lock expiration and retry
 */
async function testLockExpiration(listing, winner) {
  log(colors.magenta, '\n' + '='.repeat(70));
  log(colors.magenta, '📋 TEST SCENARIO 2: Lock Expiration & Retry');
  log(colors.magenta, '='.repeat(70));

  if (!winner) {
    log(colors.yellow, 'Skipping - no winner from previous test');
    return;
  }

  log(colors.cyan, `\nSimulating: ${winner.user.name} cancels their lock, another user retries\n`);

  // Cancel the winner's lock
  const intentId = winner.response.bookingIntent.intentId;
  await cancelBookingIntent(winner.user, intentId);

  // Another user tries to book
  const retryUser = CONFIG.TEST_USERS.find(u => u.id !== winner.user.id);

  log(colors.yellow, `\n🔄 ${retryUser.name} attempting to book after cancellation...\n`);

  const retryResult = await attemptBooking(retryUser, listing, CONFIG.START_DATE, CONFIG.END_DATE);

  if (retryResult.success) {
    log(colors.green, `\n🎉 PASS! ${retryUser.name} successfully got the lock after cancellation.`);

    // Cleanup - cancel this lock too
    await cancelBookingIntent(retryUser, retryResult.response.bookingIntent.intentId);
  } else {
    log(colors.red, `\n❌ FAIL! ${retryUser.name} could not get the lock after cancellation.`);
  }
}

/**
 * TEST SCENARIO 3: Payment confirmation creates booking
 */
async function testPaymentConfirmation(listing) {
  log(colors.magenta, '\n' + '='.repeat(70));
  log(colors.magenta, '📋 TEST SCENARIO 3: Payment Confirmation Flow');
  log(colors.magenta, '='.repeat(70));

  const testUser = CONFIG.TEST_USERS[0];
  log(colors.cyan, `\nSimulating: ${testUser.name} creates intent → confirms payment → booking created\n`);

  // Create booking intent
  const intentResult = await attemptBooking(testUser, listing, CONFIG.START_DATE, CONFIG.END_DATE);

  if (!intentResult.success) {
    log(colors.yellow, 'Skipping - could not create booking intent');
    return;
  }

  const intentId = intentResult.response.bookingIntent.intentId;

  // Confirm payment
  log(colors.yellow, `\n💳 ${testUser.name} confirming payment...`);
  const confirmResult = await confirmBookingIntent(testUser, intentId);

  if (confirmResult?.success) {
    log(colors.green, `\n🎉 PASS! Booking created successfully!`);
    log(colors.green, `   Booking ID: ${confirmResult.booking._id}`);
    log(colors.green, `   Status: ${confirmResult.booking.bookingStatus}`);
    log(colors.green, `   Payment Status: ${confirmResult.booking.paymentStatus}`);
  } else {
    log(colors.red, `\n❌ FAIL! Could not confirm booking.`);
  }
}

/**
 * TEST SCENARIO 4: Race condition with rapid requests
 */
async function testRapidRequests(listing) {
  log(colors.magenta, '\n' + '='.repeat(70));
  log(colors.magenta, '📋 TEST SCENARIO 4: Rapid Sequential Requests');
  log(colors.magenta, '='.repeat(70));

  // Use different dates to avoid conflict with previous tests
  const startDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toDateString();
  const endDate = new Date(Date.now() + 17 * 24 * 60 * 60 * 1000).toDateString();

  log(colors.cyan, `\nSimulating: 10 rapid requests from different users\n`);
  log(colors.cyan, `🗓️ Dates: ${startDate} to ${endDate}\n`);

  // Generate 10 fake users
  const rapidUsers = Array.from({ length: 10 }, (_, i) => ({
    id: `10000000000000000000000${i}`,
    name: `RapidUser${i + 1}`,
  }));

  const startTime = Date.now();
  const results = await Promise.all(
    rapidUsers.map(user => attemptBooking(user, listing, startDate, endDate))
  );
  const totalTime = Date.now() - startTime;

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  log(colors.magenta, '\n' + '-'.repeat(70));
  log(colors.green, `✅ Successful: ${successful.length}`);
  log(colors.red, `❌ Blocked: ${failed.length}`);
  log(colors.cyan, `⏱️ Total time for 10 requests: ${totalTime}ms`);
  log(colors.cyan, `⏱️ Average per request: ${(totalTime / 10).toFixed(2)}ms`);

  if (successful.length === 1) {
    log(colors.green, `\n🎉 PASS! Only one user got the lock despite rapid requests.`);

    // Cleanup
    await cancelBookingIntent(successful[0].user, successful[0].response.bookingIntent.intentId);
  } else if (successful.length === 0) {
    log(colors.yellow, `\n⚠️ No successful locks.`);
  } else {
    log(colors.red, `\n❌ FAIL! Multiple locks created!`);
  }
}

/**
 * Main test runner
 */
async function runAllTests() {
  log(colors.magenta, '\n' + '═'.repeat(70));
  log(colors.magenta, '🧪 CONCURRENT BOOKING TEST SUITE');
  log(colors.magenta, '═'.repeat(70));
  log(colors.cyan, `Server: ${BASE_URL}`);
  log(colors.cyan, `Date: ${new Date().toISOString()}`);

  try {
    // Release any expired locks first
    await releaseExpiredLocks();

    // Run tests
    const { successful, listing } = await testConcurrentBooking();

    const winner = successful[0];

    await testLockExpiration(listing, winner);

    // Use different dates for payment confirmation test
    const paymentTestListing = await fetchTestListing();
    await testPaymentConfirmation(paymentTestListing);

    // Rapid requests test
    const rapidTestListing = await fetchTestListing();
    await testRapidRequests(rapidTestListing);

    log(colors.magenta, '\n' + '═'.repeat(70));
    log(colors.magenta, '✅ ALL TESTS COMPLETED');
    log(colors.magenta, '═'.repeat(70) + '\n');

  } catch (error) {
    log(colors.red, `\n❌ Test suite failed: ${error.message}`);
    console.error(error);
  }
}

// Run tests
runAllTests();

