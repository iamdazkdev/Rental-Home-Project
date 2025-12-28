#!/usr/bin/env node

/**
 * Manual Testing Script for Payment Flows v2.0
 * Tests all 3 payment methods: VNPay Full, VNPay Deposit, Cash
 */

const API_BASE = 'http://localhost:3001';

// Test data
const testListing = {
  _id: '694ac01d26825e2fa4f01d47', // Replace with actual listing ID
  creator: {
    _id: '694aa083f52a2bc7570cadfa' // Replace with actual host ID
  }
};

const testUser = {
  id: '694be959872d5cb8783f2ac4', // Replace with actual customer ID
  token: 'your-jwt-token-here' // Replace with actual token
};

const testBookingData = {
  listingId: testListing._id,
  hostId: testListing.creator._id,
  startDate: '2025-01-15',
  endDate: '2025-01-20',
  totalPrice: 7000000,
  guestCount: 2
};

// Color console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.cyan}ℹ️  ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  title: (msg) => console.log(`\n${colors.bright}${colors.blue}━━━ ${msg} ━━━${colors.reset}\n`)
};

// Helper function to make API calls
async function apiCall(method, endpoint, data = null) {
  const url = `${API_BASE}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${testUser.token}`
    }
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);
    const json = await response.json();

    if (!response.ok) {
      throw new Error(json.message || 'API call failed');
    }

    return { success: true, data: json, status: response.status };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Test 1: Check Availability
async function testCheckAvailability() {
  log.title('TEST 1: Check Availability');

  const endpoint = `/entire-place-booking/check-availability?listingId=${testBookingData.listingId}&startDate=${testBookingData.startDate}&endDate=${testBookingData.endDate}`;

  const result = await apiCall('GET', endpoint);

  if (result.success) {
    log.success('Availability check successful');
    log.info(`Available: ${result.data.available}`);
    if (result.data.pricing) {
      log.info(`Total: ${result.data.pricing.total.toLocaleString('vi-VN')} VND`);
    }
    return result.data;
  } else {
    log.error(`Availability check failed: ${result.error}`);
    return null;
  }
}

// Test 2: Create BookingIntent (VNPay Full)
async function testCreateBookingIntentFull() {
  log.title('TEST 2: Create BookingIntent - VNPay Full');

  const data = {
    ...testBookingData,
    paymentType: 'full'
  };

  const result = await apiCall('POST', '/entire-place-booking/create-intent', data);

  if (result.success) {
    log.success('BookingIntent created (Full Payment)');
    log.info(`Temp Order ID: ${result.data.tempOrderId}`);
    log.info(`Payment Amount: ${result.data.paymentAmount?.toLocaleString('vi-VN')} VND`);
    log.info(`Payment Type: ${result.data.paymentType}`);
    return result.data;
  } else {
    log.error(`BookingIntent creation failed: ${result.error}`);
    return null;
  }
}

// Test 3: Create BookingIntent (VNPay Deposit)
async function testCreateBookingIntentDeposit() {
  log.title('TEST 3: Create BookingIntent - VNPay Deposit');

  const data = {
    ...testBookingData,
    paymentType: 'deposit'
  };

  const result = await apiCall('POST', '/entire-place-booking/create-intent', data);

  if (result.success) {
    log.success('BookingIntent created (Deposit 30%)');
    log.info(`Temp Order ID: ${result.data.tempOrderId}`);
    log.info(`Payment Amount: ${result.data.paymentAmount?.toLocaleString('vi-VN')} VND (30%)`);
    log.info(`Payment Type: ${result.data.paymentType}`);
    return result.data;
  } else {
    log.error(`BookingIntent creation failed: ${result.error}`);
    return null;
  }
}

// Test 4: Create Cash Booking
async function testCreateCashBooking() {
  log.title('TEST 4: Create Cash Booking');

  const data = {
    ...testBookingData
  };

  const result = await apiCall('POST', '/entire-place-booking/create-cash', data);

  if (result.success) {
    log.success('Cash booking created');
    log.info(`Booking ID: ${result.data._id}`);
    log.info(`Booking Status: ${result.data.bookingStatus || result.data.status}`);
    log.info(`Payment Status: ${result.data.paymentStatus}`);
    log.info(`Total Price: ${result.data.totalPrice?.toLocaleString('vi-VN')} VND`);
    return result.data;
  } else {
    log.error(`Cash booking failed: ${result.error}`);
    return null;
  }
}

// Test 5: Confirm Cash Payment (Host)
async function testConfirmCashPayment(bookingId) {
  log.title('TEST 5: Confirm Cash Payment (Host)');

  if (!bookingId) {
    log.warn('Skipping - no booking ID provided');
    return null;
  }

  const data = {
    amount: testBookingData.totalPrice,
    notes: 'Test: Cash payment received at check-in'
  };

  const result = await apiCall('POST', `/entire-place-booking/${bookingId}/confirm-cash-payment`, data);

  if (result.success) {
    log.success('Cash payment confirmed');
    log.info(`Payment Status: ${result.data.booking?.paymentStatus}`);
    log.info(`Paid Amount: ${result.data.booking?.paidAmount?.toLocaleString('vi-VN')} VND`);
    return result.data;
  } else {
    log.error(`Cash payment confirmation failed: ${result.error}`);
    return null;
  }
}

// Test 6: Get Booking Details
async function testGetBooking(bookingId) {
  log.title('TEST 6: Get Booking Details');

  if (!bookingId) {
    log.warn('Skipping - no booking ID provided');
    return null;
  }

  const result = await apiCall('GET', `/entire-place-booking/${bookingId}`);

  if (result.success) {
    log.success('Booking details retrieved');
    log.info(`Booking Status: ${result.data.bookingStatus || result.data.status}`);
    log.info(`Payment Status: ${result.data.paymentStatus}`);
    log.info(`Payment Method: ${result.data.paymentMethod}`);
    log.info(`Payment Type: ${result.data.paymentType}`);
    return result.data;
  } else {
    log.error(`Get booking failed: ${result.error}`);
    return null;
  }
}

// Main test runner
async function runTests() {
  console.log(`\n${colors.bright}${colors.blue}╔════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}║    PAYMENT FLOWS v2.0 - MANUAL TESTING SCRIPT          ║${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}╚════════════════════════════════════════════════════════╝${colors.reset}\n`);

  log.info('API Base URL: ' + API_BASE);
  log.info('Listing ID: ' + testBookingData.listingId);
  log.info('Date Range: ' + testBookingData.startDate + ' → ' + testBookingData.endDate);

  // Run tests sequentially
  const availability = await testCheckAvailability();

  if (availability && availability.available) {
    // Test VNPay Full
    const intentFull = await testCreateBookingIntentFull();

    // Test VNPay Deposit
    const intentDeposit = await testCreateBookingIntentDeposit();

    // Test Cash Booking
    const cashBooking = await testCreateCashBooking();

    // If cash booking created, test payment confirmation
    if (cashBooking && cashBooking._id) {
      await testConfirmCashPayment(cashBooking._id);
      await testGetBooking(cashBooking._id);
    }

    // Summary
    log.title('TEST SUMMARY');
    log.success(`Check Availability: ${availability ? 'PASS' : 'FAIL'}`);
    log.success(`Create Intent (Full): ${intentFull ? 'PASS' : 'FAIL'}`);
    log.success(`Create Intent (Deposit): ${intentDeposit ? 'PASS' : 'FAIL'}`);
    log.success(`Create Cash Booking: ${cashBooking ? 'PASS' : 'FAIL'}`);

    console.log('\n' + colors.bright + colors.green + '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' + colors.reset);
    console.log(colors.bright + colors.green + '  ✅ MANUAL TESTS COMPLETED!' + colors.reset);
    console.log(colors.bright + colors.green + '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' + colors.reset + '\n');

    console.log(colors.cyan + '\n📋 NEXT STEPS:' + colors.reset);
    console.log('1. Test VNPay payment flows in browser');
    console.log('2. Test host approval/rejection');
    console.log('3. Test check-in/check-out flows');
    console.log('4. Run automated unit tests\n');

  } else {
    log.error('Cannot proceed - dates not available');
  }
}

// Error handling
process.on('unhandledRejection', (error) => {
  log.error('Unhandled error: ' + error.message);
  process.exit(1);
});

// Run tests
runTests().catch((error) => {
  log.error('Test runner failed: ' + error.message);
  process.exit(1);
});

