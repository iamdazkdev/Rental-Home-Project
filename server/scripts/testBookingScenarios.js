/**
 * DETAILED CONCURRENT BOOKING TEST SCENARIOS
 *
 * This file contains individual test cases that can be run separately
 * for more controlled testing of the concurrent booking system.
 *
 * Usage:
 *   node scripts/testBookingScenarios.js [scenario_number]
 *
 * Examples:
 *   node scripts/testBookingScenarios.js 1   # Run scenario 1
 *   node scripts/testBookingScenarios.js all # Run all scenarios
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

// Test data
const TEST_LISTING_PRICE = 1000000; // 1,000,000 VND per night

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  white: '\x1b[37m',
};

const log = {
  info: (msg) => console.log(`${colors.cyan}ℹ️  ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  step: (msg) => console.log(`${colors.blue}→  ${msg}${colors.reset}`),
  header: (msg) => console.log(`\n${colors.magenta}${'═'.repeat(60)}\n${msg}\n${'═'.repeat(60)}${colors.reset}`),
  subheader: (msg) => console.log(`\n${colors.white}${'-'.repeat(40)}\n${msg}\n${'-'.repeat(40)}${colors.reset}`),
};

// Helper to get a listing
async function getListing() {
  const response = await axios.get(`${BASE_URL}/listing`);
  if (!response.data || response.data.length === 0) {
    throw new Error('No listings available');
  }
  return response.data[0];
}

// Helper to create booking intent
async function createIntent(userId, hostId, listingId, startDate, endDate, options = {}) {
  return axios.post(`${BASE_URL}/booking-intent/create`, {
    customerId: userId,
    hostId,
    listingId,
    bookingType: options.bookingType || 'entire_place',
    startDate,
    endDate,
    totalPrice: options.totalPrice || TEST_LISTING_PRICE * 3,
    paymentMethod: options.paymentMethod || 'vnpay',
    paymentType: options.paymentType || 'full',
    paymentAmount: options.paymentAmount || TEST_LISTING_PRICE * 3,
    depositPercentage: options.depositPercentage || 0,
    depositAmount: options.depositAmount || 0,
    remainingAmount: options.remainingAmount || 0,
  });
}

// Helper to cancel intent
async function cancelIntent(intentId, userId) {
  return axios.put(`${BASE_URL}/booking-intent/${intentId}/cancel`, {
    userId,
    reason: 'Test cancellation',
  });
}

// Helper to confirm intent
async function confirmIntent(intentId, transactionId) {
  return axios.put(`${BASE_URL}/booking-intent/${intentId}/confirm`, {
    transactionId: transactionId || `TXN_${Date.now()}`,
  });
}

// Helper to check availability
async function checkAvailability(listingId, startDate, endDate, userId) {
  return axios.get(`${BASE_URL}/booking-intent/check-availability/${listingId}`, {
    params: { startDate, endDate, userId },
  });
}

// Generate future dates - use far future dates to avoid conflicts
function getFutureDates(daysFromNow, nights = 3) {
  // Start from 1000+ days in future with random offset to avoid existing bookings
  const randomOffset = Math.floor(Math.random() * 100);
  const baseDays = 1000 + daysFromNow + randomOffset;
  const start = new Date(Date.now() + baseDays * 24 * 60 * 60 * 1000);
  const end = new Date(start.getTime() + nights * 24 * 60 * 60 * 1000);
  return {
    startDate: start.toDateString(),
    endDate: end.toDateString(),
  };
}

// ============================================================================
// SCENARIO 1: Basic Lock Creation
// ============================================================================
async function scenario1_BasicLock() {
  log.header('SCENARIO 1: Basic Lock Creation');
  log.info('One user creates a booking intent and gets a lock');

  try {
    const listing = await getListing();
    const { startDate, endDate } = getFutureDates(180); // Use far future dates
    const userId = '6950fa375d1324f5c10cf001';

    log.step(`Creating booking intent for listing: ${listing._id}`);
    log.step(`Dates: ${startDate} to ${endDate}`);

    const response = await createIntent(
      userId,
      listing.creator._id || listing.creator,
      listing._id,
      startDate,
      endDate
    );

    if (response.data.success) {
      log.success(`Lock created successfully!`);
      log.info(`Intent ID: ${response.data.bookingIntent.intentId}`);
      log.info(`Expires in: ${response.data.expiresIn} seconds`);

      // Cleanup
      await cancelIntent(response.data.bookingIntent.intentId, userId);
      log.success('Lock cancelled (cleanup)');

      return true;
    }
  } catch (error) {
    log.error(`Failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// ============================================================================
// SCENARIO 2: Second User Blocked
// ============================================================================
async function scenario2_SecondUserBlocked() {
  log.header('SCENARIO 2: Second User Blocked by Lock');
  log.info('User A gets lock, User B should be blocked');

  try {
    const listing = await getListing();
    const { startDate, endDate } = getFutureDates(185); // Use far future dates
    const userA = '6950fa375d1324f5c10cfa01';
    const userB = '6950fa375d1324f5c10cfb01';

    // User A creates lock
    log.step('User A creating booking intent...');
    const responseA = await createIntent(
      userA,
      listing.creator._id || listing.creator,
      listing._id,
      startDate,
      endDate
    );

    if (!responseA.data.success) {
      log.error('User A failed to create lock');
      return false;
    }

    log.success(`User A got lock: ${responseA.data.bookingIntent.intentId}`);

    // User B tries to create lock
    log.step('User B attempting to book same listing...');

    try {
      await createIntent(
        userB,
        listing.creator._id || listing.creator,
        listing._id,
        startDate,
        endDate
      );

      log.error('FAIL: User B should have been blocked!');
      return false;
    } catch (error) {
      if (error.response?.status === 409) {
        log.success('User B correctly blocked with 409 Conflict');
        log.info(`Reason: ${error.response.data.message}`);
        log.info(`Retry after: ${error.response.data.retryAfterSeconds} seconds`);

        // Cleanup
        await cancelIntent(responseA.data.bookingIntent.intentId, userA);
        log.success('Lock cancelled (cleanup)');

        return true;
      }
      throw error;
    }
  } catch (error) {
    log.error(`Unexpected error: ${error.message}`);
    return false;
  }
}

// ============================================================================
// SCENARIO 3: Same User Gets Own Lock Back
// ============================================================================
async function scenario3_SameUserOwnLock() {
  log.header('SCENARIO 3: Same User Gets Own Lock Back');
  log.info('User creates lock, then requests again - should get existing lock');

  try {
    const listing = await getListing();
    const { startDate, endDate } = getFutureDates(200);
    const userId = '6950fa375d1324f5c10cf002';

    // First request
    log.step('Creating first booking intent...');
    const response1 = await createIntent(
      userId,
      listing.creator._id || listing.creator,
      listing._id,
      startDate,
      endDate
    );

    if (!response1.data.success) {
      log.error('Failed to create first lock');
      return false;
    }

    const intentId1 = response1.data.bookingIntent.intentId;
    log.success(`First lock created: ${intentId1}`);

    // Second request from same user
    log.step('Same user requesting again...');
    const response2 = await createIntent(
      userId,
      listing.creator._id || listing.creator,
      listing._id,
      startDate,
      endDate
    );

    if (response2.data.success && response2.data.isExisting) {
      log.success('Correctly returned existing lock');
      log.info(`Lock ID: ${response2.data.bookingIntent.intentId}`);

      // Cleanup
      await cancelIntent(intentId1, userId);
      log.success('Lock cancelled (cleanup)');

      return true;
    } else {
      log.error('Should have returned existing lock');
      return false;
    }
  } catch (error) {
    log.error(`Error: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// ============================================================================
// SCENARIO 4: Lock Release After Cancellation
// ============================================================================
async function scenario4_LockReleaseAfterCancel() {
  log.header('SCENARIO 4: Lock Release After Cancellation');
  log.info('User A locks, cancels, User B should be able to lock');

  try {
    const listing = await getListing();
    const { startDate, endDate } = getFutureDates(210);
    const userA = '6950fa375d1324f5c10cfa02';
    const userB = '6950fa375d1324f5c10cfb02';

    // User A creates lock
    log.step('User A creating lock...');
    const responseA = await createIntent(
      userA,
      listing.creator._id || listing.creator,
      listing._id,
      startDate,
      endDate
    );

    if (!responseA.data.success) {
      log.error('User A failed to create lock');
      return false;
    }

    const intentIdA = responseA.data.bookingIntent.intentId;
    log.success(`User A got lock: ${intentIdA}`);

    // User A cancels
    log.step('User A cancelling lock...');
    await cancelIntent(intentIdA, userA);
    log.success('User A cancelled lock');

    // User B tries to lock
    log.step('User B attempting to book...');
    const responseB = await createIntent(
      userB,
      listing.creator._id || listing.creator,
      listing._id,
      startDate,
      endDate
    );

    if (responseB.data.success) {
      log.success('User B successfully got lock after cancellation!');

      // Cleanup
      await cancelIntent(responseB.data.bookingIntent.intentId, userB);
      log.success('Lock cancelled (cleanup)');

      return true;
    } else {
      log.error('User B should have been able to get lock');
      return false;
    }
  } catch (error) {
    log.error(`Error: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// ============================================================================
// SCENARIO 5: Payment Confirmation Creates Booking
// ============================================================================
async function scenario5_PaymentConfirmation() {
  log.header('SCENARIO 5: Payment Confirmation Creates Booking');
  log.info('User creates lock, confirms payment, booking is created');

  try {
    const listing = await getListing();
    const { startDate, endDate } = getFutureDates(220);
    const userId = '6950fa375d1324f5c10cf003';

    // Create lock
    log.step('Creating booking intent...');
    const response = await createIntent(
      userId,
      listing.creator._id || listing.creator,
      listing._id,
      startDate,
      endDate
    );

    if (!response.data.success) {
      log.error('Failed to create lock');
      return false;
    }

    const intentId = response.data.bookingIntent.intentId;
    log.success(`Lock created: ${intentId}`);

    // Confirm payment
    log.step('Confirming payment...');
    const confirmResponse = await confirmIntent(intentId, `TXN_TEST_${Date.now()}`);

    if (confirmResponse.data.success) {
      log.success('Payment confirmed and booking created!');
      log.info(`Booking ID: ${confirmResponse.data.booking._id}`);
      log.info(`Booking Status: ${confirmResponse.data.booking.bookingStatus}`);
      log.info(`Payment Status: ${confirmResponse.data.booking.paymentStatus}`);

      // Note: Booking is now permanent - no cleanup needed for intent
      return true;
    } else {
      log.error('Failed to confirm payment');
      return false;
    }
  } catch (error) {
    log.error(`Error: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// ============================================================================
// SCENARIO 6: Concurrent Race Condition Stress Test
// ============================================================================
async function scenario6_StressTest() {
  log.header('SCENARIO 6: Stress Test - 20 Concurrent Users');
  log.info('20 users try to book the same listing at exactly the same time');

  try {
    const listing = await getListing();
    const { startDate, endDate } = getFutureDates(240);

    // Generate 20 fake users with valid ObjectId format (24 hex characters)
    const users = Array.from({ length: 20 }, (_, i) => ({
      id: `6950fa375d1324f5c10c${String(i + 1).padStart(4, '0')}`,
      name: `StressUser${i + 1}`,
    }));

    log.step(`Sending 20 concurrent requests...`);

    const startTime = Date.now();

    const results = await Promise.allSettled(
      users.map(user =>
        createIntent(
          user.id,
          listing.creator._id || listing.creator,
          listing._id,
          startDate,
          endDate
        )
      )
    );

    const duration = Date.now() - startTime;

    // Analyze results
    const successful = results.filter(r =>
      r.status === 'fulfilled' && r.value?.data?.success
    );
    const blocked = results.filter(r =>
      r.status === 'rejected' && r.reason?.response?.status === 409
    );
    const errors = results.filter(r =>
      r.status === 'rejected' && r.reason?.response?.status !== 409
    );

    log.subheader('Results');
    log.info(`Total time: ${duration}ms`);
    log.info(`Average per request: ${(duration / 20).toFixed(2)}ms`);
    log.success(`Successful locks: ${successful.length}`);
    log.warning(`Blocked (409): ${blocked.length}`);
    log.error(`Other errors: ${errors.length}`);

    if (successful.length === 1) {
      log.success('\n🎉 PERFECT! Only one user got the lock!');

      // Cleanup
      const winnerId = successful[0].value.data.bookingIntent.intentId;
      const winnerUserId = successful[0].value.data.bookingIntent.customerId;
      await cancelIntent(winnerId, winnerUserId);
      log.success('Lock cancelled (cleanup)');

      return true;
    } else if (successful.length === 0) {
      log.warning('No successful locks - listing might already be booked');
      return false;
    } else {
      log.error(`FAIL! ${successful.length} users got locks - should be exactly 1!`);
      return false;
    }
  } catch (error) {
    log.error(`Error: ${error.message}`);
    return false;
  }
}

// ============================================================================
// SCENARIO 7: Availability Check API
// ============================================================================
async function scenario7_AvailabilityCheck() {
  log.header('SCENARIO 7: Availability Check API');
  log.info('Test the availability check endpoint');

  try {
    const listing = await getListing();
    const { startDate, endDate } = getFutureDates(260);
    const userA = '6950fa375d1324f5c10cfa03';
    const userB = '6950fa375d1324f5c10cfb03';

    // Check initial availability
    log.step('Checking initial availability...');
    const check1 = await checkAvailability(listing._id, startDate, endDate, userA);

    if (check1.data.available) {
      log.success('Listing is initially available');
    } else {
      log.warning('Listing is not available - may have existing booking');
    }

    // User A creates lock
    log.step('User A creating lock...');
    const lockResponse = await createIntent(
      userA,
      listing.creator._id || listing.creator,
      listing._id,
      startDate,
      endDate
    );

    if (!lockResponse.data.success) {
      log.error('Failed to create lock');
      return false;
    }

    log.success('Lock created by User A');

    // Check availability for User B (should be unavailable)
    log.step('User B checking availability...');
    const check2 = await checkAvailability(listing._id, startDate, endDate, userB);

    if (!check2.data.available && check2.data.reason === 'locked_by_other') {
      log.success('Correctly shows unavailable for User B');
    } else {
      log.error('Should show unavailable for User B');
    }

    // Check availability for User A (should be available - own lock)
    log.step('User A checking availability (own lock)...');
    const check3 = await checkAvailability(listing._id, startDate, endDate, userA);

    if (check3.data.available && check3.data.reason === 'own_lock') {
      log.success('Correctly shows available for User A (own lock)');
    } else {
      log.error('Should show available for User A');
    }

    // Cleanup
    await cancelIntent(lockResponse.data.bookingIntent.intentId, userA);
    log.success('Lock cancelled (cleanup)');

    return true;
  } catch (error) {
    log.error(`Error: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// ============================================================================
// Run selected or all scenarios
// ============================================================================
const scenarios = {
  1: { name: 'Basic Lock Creation', fn: scenario1_BasicLock },
  2: { name: 'Second User Blocked', fn: scenario2_SecondUserBlocked },
  3: { name: 'Same User Gets Own Lock', fn: scenario3_SameUserOwnLock },
  4: { name: 'Lock Release After Cancel', fn: scenario4_LockReleaseAfterCancel },
  5: { name: 'Payment Confirmation', fn: scenario5_PaymentConfirmation },
  6: { name: 'Stress Test (20 users)', fn: scenario6_StressTest },
  7: { name: 'Availability Check API', fn: scenario7_AvailabilityCheck },
};

async function runScenario(num) {
  const scenario = scenarios[num];
  if (!scenario) {
    log.error(`Unknown scenario: ${num}`);
    return false;
  }

  const result = await scenario.fn();
  return result;
}

async function runAllScenarios() {
  const results = {};

  for (const [num, scenario] of Object.entries(scenarios)) {
    try {
      results[num] = await scenario.fn();
    } catch (error) {
      log.error(`Scenario ${num} crashed: ${error.message}`);
      results[num] = false;
    }

    // Small delay between scenarios
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Summary
  log.header('TEST SUMMARY');

  let passed = 0;
  let failed = 0;

  for (const [num, result] of Object.entries(results)) {
    const status = result ? `${colors.green}PASS${colors.reset}` : `${colors.red}FAIL${colors.reset}`;
    console.log(`  Scenario ${num}: ${scenarios[num].name} - ${status}`);
    if (result) passed++;
    else failed++;
  }

  console.log(`\n  Total: ${passed} passed, ${failed} failed`);
}

// Main entry point
async function main() {
  const arg = process.argv[2];

  console.log(`\n${colors.cyan}🧪 Booking Intent Test Suite${colors.reset}`);
  console.log(`${colors.cyan}Server: ${BASE_URL}${colors.reset}\n`);

  if (!arg || arg === 'all') {
    await runAllScenarios();
  } else {
    const num = parseInt(arg);
    if (isNaN(num)) {
      console.log('Usage: node testBookingScenarios.js [scenario_number|all]');
      console.log('\nAvailable scenarios:');
      for (const [num, scenario] of Object.entries(scenarios)) {
        console.log(`  ${num}: ${scenario.name}`);
      }
    } else {
      await runScenario(num);
    }
  }
}

main().catch(console.error);

