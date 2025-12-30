# Concurrent Booking Test Scripts

This directory contains test scripts for testing the concurrent booking functionality of the rental application.

## Purpose

These scripts simulate multiple users trying to book the same listing at the same time to verify that:
1. Only one user can successfully lock a listing at a time
2. Other users receive proper error messages
3. Locks are released correctly after cancellation or timeout
4. Payment confirmation creates bookings correctly

## Prerequisites

1. **Server must be running** on `localhost:3001`
2. **MongoDB** must be connected
3. **At least one listing** must exist in the database
4. **axios** package must be installed (already in package.json)

## Available Scripts

### 1. testConcurrentBooking.js

Runs a comprehensive test suite with multiple scenarios automatically.

```bash
cd server
node scripts/testConcurrentBooking.js
```

**What it tests:**
- 5 users booking at the same time
- Lock expiration and retry
- Payment confirmation flow
- 10 rapid sequential requests

### 2. testBookingScenarios.js

Runs individual test scenarios with detailed output.

```bash
cd server

# Run all scenarios
node scripts/testBookingScenarios.js all

# Run a specific scenario
node scripts/testBookingScenarios.js 1
```

**Available scenarios:**

| # | Scenario | Description |
|---|----------|-------------|
| 1 | Basic Lock Creation | One user creates a booking intent |
| 2 | Second User Blocked | User A locks, User B gets blocked |
| 3 | Same User Gets Own Lock | User requests twice, gets same lock |
| 4 | Lock Release After Cancel | User A cancels, User B can lock |
| 5 | Payment Confirmation | Lock → Payment → Booking created |
| 6 | Stress Test | 20 users try to book simultaneously |
| 7 | Availability Check API | Test the availability check endpoint |

## Test Output

The scripts use color-coded output:
- 🟢 **Green**: Success
- 🔴 **Red**: Failure/Error
- 🟡 **Yellow**: Warning/In Progress
- 🔵 **Blue**: Steps
- 🟣 **Magenta**: Headers
- 🔵 **Cyan**: Information

## Example Output

```
═══════════════════════════════════════════════════════════════════
📋 TEST SCENARIO 1: Concurrent Booking Attempts
═══════════════════════════════════════════════════════════════════
Simulating 5 users trying to book the same listing simultaneously

🚀 Starting concurrent booking attempts...

[User A] 🔄 Attempting to create booking intent...
[User B] 🔄 Attempting to create booking intent...
[User C] 🔄 Attempting to create booking intent...
[User D] 🔄 Attempting to create booking intent...
[User E] 🔄 Attempting to create booking intent...
[User A] ✅ SUCCESS! Got booking lock (45ms)
[User B] 🔒 BLOCKED! Listing locked by another user (48ms)
[User C] 🔒 BLOCKED! Listing locked by another user (52ms)
[User D] 🔒 BLOCKED! Listing locked by another user (55ms)
[User E] 🔒 BLOCKED! Listing locked by another user (58ms)

──────────────────────────────────────────────────────────────────
📊 RESULTS SUMMARY
──────────────────────────────────────────────────────────────────
✅ Successful locks: 1
❌ Blocked requests: 4
⏱️ Total time: 58ms

🎉 PASS! Only one user got the lock as expected.
   Winner: User A
```

## Manual Testing with curl

You can also test the API endpoints manually:

### Create Booking Intent
```bash
curl -X POST http://localhost:3001/booking-intent/create \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "test_user_001",
    "hostId": "HOST_ID_HERE",
    "listingId": "LISTING_ID_HERE",
    "startDate": "2025-02-01",
    "endDate": "2025-02-03",
    "totalPrice": 3000000,
    "paymentMethod": "vnpay",
    "paymentType": "full"
  }'
```

### Check Availability
```bash
curl "http://localhost:3001/booking-intent/check-availability/LISTING_ID?startDate=2025-02-01&endDate=2025-02-03&userId=test_user"
```

### Cancel Booking Intent
```bash
curl -X PUT http://localhost:3001/booking-intent/INTENT_ID/cancel \
  -H "Content-Type: application/json" \
  -d '{"userId": "test_user_001", "reason": "Changed my mind"}'
```

### Confirm Payment
```bash
curl -X PUT http://localhost:3001/booking-intent/INTENT_ID/confirm \
  -H "Content-Type: application/json" \
  -d '{"transactionId": "TXN_123456"}'
```

## Expected Results

For a correctly implemented concurrent booking system:

1. **Scenario 1 (Basic Lock)**: Should create lock successfully
2. **Scenario 2 (Second User Blocked)**: Second user should get 409 Conflict
3. **Scenario 3 (Same User)**: Should return existing lock with `isExisting: true`
4. **Scenario 4 (Cancel & Retry)**: Second user should successfully lock after cancellation
5. **Scenario 5 (Payment)**: Should create booking with correct status
6. **Scenario 6 (Stress Test)**: Exactly 1 user should get the lock out of 20
7. **Scenario 7 (Availability)**: Should correctly report availability status

## Troubleshooting

### "No listings found"
Create at least one listing in the database before running tests.

### "Connection refused"
Make sure the server is running on port 3001.

### Tests creating permanent bookings
Scenario 5 creates a real booking. If you need to clean up, delete bookings from the database manually.

### Lock timeout not working
The default lock timeout is 10 minutes. For faster testing, you can modify `LOCK_TIMEOUT_MINUTES` in `bookingIntent.js`.

## Cron Job for Expired Locks

In production, set up a cron job to release expired locks:

```javascript
// Run every minute
const cron = require('node-cron');
const axios = require('axios');

cron.schedule('* * * * *', async () => {
  try {
    await axios.post('http://localhost:3001/booking-intent/release-expired');
  } catch (error) {
    console.error('Failed to release expired locks:', error.message);
  }
});
```

Or trigger manually:
```bash
curl -X POST http://localhost:3001/booking-intent/release-expired
```

