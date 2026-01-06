# Booking Intent & VNPay Payment Error Fix

## Problem 1: BookingIntent Creation Failed
Mobile app was failing to create BookingIntent with error:
```
Creating BookingIntent: {listingId: 6952b312ac474ebe6c17c37d, hostId: 6952a9d8ac474ebe6c17c2a9, startDate: 2026-01-06T00:00:00.000, endDate: 2026-01-15T00:00:00.000, totalPrice: 14400000.0, paymentType: full}
flutter: ❌ Failed to create booking intent: Failed to create BookingIntent
```

### Root Cause
The `BookingIntent` MongoDB model requires a field called `intentId` (marked as required):
```javascript
intentId: {
  type: String,
  required: true,
  unique: true,
  index: true,
}
```

However, the `bookingService.js` was only creating `tempOrderId` without `intentId`, causing validation errors when saving to MongoDB.

### Solution
Updated the `createBookingIntent` method to include both `intentId` and `tempOrderId`:

```javascript
// Before
const tempOrderId = `INTENT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
const bookingIntent = new BookingIntent({
  tempOrderId,
  customerId,
  hostId,
  // ... other fields
});

// After
const intentId = `INTENT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
const tempOrderId = intentId; // Use same value for compatibility
const bookingIntent = new BookingIntent({
  intentId,
  tempOrderId,
  customerId,
  hostId,
  // ... other fields
});
```

---

## Problem 2: VNPay Payment URL Creation Failed
After successfully creating BookingIntent, the payment URL creation was failing with:
```
💳 Creating VNPay payment URL: {tempOrderId: INTENT_1767594510918_73p5j5k0y, amount: 20000000.0, orderInfo: Full payment - INTENT_1767594510918_73p5j5k0y, returnUrl: yourapp://payment-callback}
flutter: ❌ Failed to create payment URL: Booking data is required
```

### Root Cause
The `/payment/create-payment-url` endpoint was expecting a full `bookingData` object (for the old flow), but the new Entire Place Rental flow only sends `tempOrderId`, `amount`, `orderInfo`, and `returnUrl`.

The endpoint had this validation:
```javascript
if (!bookingData) {
  return res.status(400).json({
    message: "Booking data is required",
  });
}
```

### Solution
Updated `/payment/create-payment-url` to support BOTH flows:

#### New Flow (Entire Place Rental with BookingIntent)
- Check if `tempOrderId` is provided
- Use the existing BookingIntent (already in database)
- Create VNPay payment URL directly

```javascript
if (providedTempOrderId) {
  console.log("🔄 Using existing BookingIntent:", providedTempOrderId);
  
  const paymentParams = {
    orderId: providedTempOrderId,
    amount,
    orderInfo: orderInfo || `Payment - ${providedTempOrderId}`,
    // ...
  };
  
  const paymentUrl = vnpayService.createPaymentUrl(paymentParams);
  return res.json({ paymentUrl, tempOrderId: providedTempOrderId, amount });
}
```

#### Old Flow (Backward Compatibility)
- If `bookingData` is provided, create PendingBooking
- Works as before for existing features

---

## Mobile Improvements

### 1. Enhanced Error Handling (mobile/lib/data/repositories/booking_repository.dart)
- Added proper error response handling with status code checks
- Improved error message extraction from server responses
- Added debug logging for better troubleshooting

### 2. Better Error Messages (mobile/lib/presentation/booking/cubit/booking_cubit.dart)
- Catch specific Exception types
- Parse and display server error messages
- Provide user-friendly fallback messages
- Mark errors as retryable

---

## Testing
After these fixes:
1. ✅ BookingIntent creation succeeds
2. ✅ VNPay payment URL creation succeeds using tempOrderId
3. ✅ Server accepts both new flow (tempOrderId) and old flow (bookingData)
4. ✅ Mobile app displays appropriate error messages if something fails
5. ✅ User can retry failed operations

---

## API Contracts

### 1. Create BookingIntent
**Endpoint:** `POST /entire-place-booking/create-intent`

**Request:**
```json
{
  "listingId": "string",
  "hostId": "string",
  "startDate": "ISO8601 date string",
  "endDate": "ISO8601 date string",
  "totalPrice": "number",
  "paymentType": "full | deposit"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "tempOrderId": "INTENT_1234567890_abc123",
  "paymentAmount": 14400000,
  "paymentType": "full",
  "message": "BookingIntent created successfully"
}
```

### 2. Create VNPay Payment URL (Updated)
**Endpoint:** `POST /payment/create-payment-url`

**Request (New Flow - with tempOrderId):**
```json
{
  "tempOrderId": "INTENT_1234567890_abc123",
  "amount": 14400000,
  "orderInfo": "Full payment - Property Name",
  "returnUrl": "yourapp://payment-callback"
}
```

**Request (Old Flow - with bookingData):**
```json
{
  "bookingData": {
    "customerId": "string",
    "hostId": "string",
    "listingId": "string",
    "startDate": "ISO8601 date",
    "endDate": "ISO8601 date",
    "totalPrice": "number",
    "paymentMethod": "vnpay_full | vnpay_deposit",
    "depositPercentage": "number (optional)",
    "depositAmount": "number (optional)"
  },
  "amount": "number",
  "ipAddr": "string (optional)"
}
```

**Success Response (200):**
```json
{
  "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?...",
  "tempOrderId": "INTENT_1234567890_abc123",
  "amount": 14400000
}
```

**Error Response (4xx/5xx):**
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

---

## Related Files Modified
1. `/server/services/bookingService.js` - Added intentId field
2. `/server/routes/payment.js` - Support both tempOrderId and bookingData flows
3. `/mobile/lib/data/repositories/booking_repository.dart` - Improved error handling
4. `/mobile/lib/presentation/booking/cubit/booking_cubit.dart` - Better error messages

---

## Notes
- Other BookingIntent creation points (`concurrentBookingService.js`, `bookingIntent.js`) already had `intentId` field
- These fixes ensure consistency across all BookingIntent creation methods
- The payment endpoint is backward compatible with existing API consumers
- Both Web and Mobile now use the same flow for Entire Place Rental

---

## Flow Diagram

```
┌─────────────┐
│   Mobile    │
│  App User   │
└──────┬──────┘
       │
       │ 1. Select listing & dates
       ▼
┌─────────────────────────────────┐
│ POST /entire-place-booking/     │
│      create-intent              │
│                                 │
│ • Creates BookingIntent         │
│ • Returns tempOrderId           │
└──────────┬──────────────────────┘
           │
           │ 2. Use tempOrderId
           ▼
┌─────────────────────────────────┐
│ POST /payment/create-payment-url│
│                                 │
│ • Send: tempOrderId, amount     │
│ • Get: VNPay payment URL        │
└──────────┬──────────────────────┘
           │
           │ 3. Redirect to VNPay
           ▼
┌─────────────────────────────────┐
│      VNPay Payment Page         │
│                                 │
│ • User completes payment        │
│ • VNPay callback to backend     │
└──────────┬──────────────────────┘
           │
           │ 4. Payment success
           ▼
┌─────────────────────────────────┐
│  Backend creates actual Booking │
│  from BookingIntent             │
└─────────────────────────────────┘
```

