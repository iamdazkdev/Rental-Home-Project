# Models Documentation

## Overview
This folder contains domain models for the client application. Models provide a structured way to work with data, including validation, computed properties, and data transformation.

---

## Structure

```
models/
├── types.js          # Type constants and enums
├── PaymentInfo.js    # Payment information model
├── Booking.js        # Booking model
├── User.js           # User model
├── Listing.js        # Listing/Property model
├── index.js          # Central export point
└── README.md         # This file
```

---

## Models

### 1. Types (`types.js`)
Defines constants for various entity types:
- `PaymentMethod` - Payment methods (vnpay_full, vnpay_deposit, cash)
- `PaymentStatus` - Payment statuses (paid, partially_paid, unpaid)
- `BookingStatus` - Booking statuses (pending, approved, rejected, etc.)
- `ExtensionStatus` - Extension statuses (pending, approved, rejected)
- `ListingStatus` - Listing statuses (active, inactive, pending)
- `UserRole` - User roles (user, host, admin)
- `PropertyType` - Property types (entire place, room, shared room)

**Usage:**
```javascript
import { PaymentMethod, BookingStatus } from '@/models';

if (payment.method === PaymentMethod.VNPAY_FULL) {
  // Handle full payment
}
```

---

### 2. PaymentInfo (`PaymentInfo.js`)
Handles payment-related information.

**Properties:**
- `method` - Payment method
- `status` - Payment status
- `depositAmount` - Deposit amount (for partial payments)
- `depositPercentage` - Deposit percentage
- `totalAmount` - Total payment amount
- `transactionId` - Transaction/Payment ID
- `paidAt` - Payment date

**Computed Properties:**
- `isFullPayment` - Is full payment?
- `isDeposit` - Is deposit payment?
- `isCash` - Is cash payment?
- `isPaid` - Is fully paid?
- `isPartiallyPaid` - Is partially paid?
- `remainingAmount` - Remaining amount to pay
- `formattedTotalAmount` - Formatted total (Vietnamese format)
- `formattedDepositAmount` - Formatted deposit
- `formattedRemainingAmount` - Formatted remaining

**Methods:**
- `getPaymentMethodLabel()` - Get human-readable payment method
- `getPaymentStatusLabel()` - Get human-readable status
- `isValid()` - Validate payment info
- `static fromApiResponse(data)` - Create from API response
- `toApiPayload()` - Convert to API payload
- `clone()` - Create a copy

**Usage:**
```javascript
import { PaymentInfo } from '@/models';

// From API response
const payment = PaymentInfo.fromApiResponse(apiData);

// Access properties
console.log(payment.formattedTotalAmount); // "10.000.000"
console.log(payment.remainingAmount); // 7000000
console.log(payment.getPaymentMethodLabel()); // "VNPay - Deposit (30%)"

// Check status
if (payment.isPartiallyPaid) {
  alert(`Remaining: ${payment.formattedRemainingAmount} VND`);
}
```

---

### 3. Booking (`Booking.js`)
Represents a booking/reservation.

**Properties:**
- `id` - Booking ID
- `customerId` - Customer user ID
- `hostId` - Host user ID
- `listingId` - Property listing ID
- `startDate` - Check-in date
- `endDate` - Check-out date
- `totalPrice` - Original total price
- `finalTotalPrice` - Final price (after extensions)
- `status` - Booking status
- `paymentInfo` - PaymentInfo instance
- Extension fields (extensionDays, newEndDate, etc.)
- Review fields (homeReview, homeRating, etc.)
- Populated data (customer, host, listing objects)

**Computed Properties:**
- `numberOfNights` - Number of nights
- `isPending` - Is pending approval?
- `isApproved` - Is approved/accepted?
- `isRejected` - Is rejected?
- `isCancelled` - Is cancelled?
- `isCompleted` - Is completed?
- `isCheckedOut` - Is checked out?
- `isActive` - Is active (pending or approved)?
- `hasExtension` - Has extension?
- `canCheckout` - Can checkout now?
- `canReview` - Can leave review?
- `formattedDateRange` - Formatted date range

**Methods:**
- `static fromApiResponse(data)` - Create from API
- `toApiPayload()` - Convert to API payload
- `clone()` - Create a copy

**Usage:**
```javascript
import { Booking } from '@/models';

// From API response
const booking = Booking.fromApiResponse(apiData);

// Access properties
console.log(booking.numberOfNights); // 5
console.log(booking.formattedDateRange); // "01/01/2025 - 06/01/2025"

// Check status
if (booking.canCheckout) {
  // Show checkout button
}

// Access payment info
if (booking.paymentInfo.isPartiallyPaid) {
  console.log(`Remaining: ${booking.paymentInfo.formattedRemainingAmount}`);
}
```

---

### 4. User (`User.js`)
Represents a user in the system.

**Properties:**
- `id` - User ID
- `firstName` - First name
- `lastName` - Last name
- `email` - Email address
- `profileImagePath` - Profile image URL
- `tripList` - User's trips (bookings)
- `wishList` - Wishlisted properties
- `propertyList` - User's properties (if host)
- `reservationList` - Reservations (if host)
- `hostProfile` - Host profile data

**Computed Properties:**
- `fullName` - Full name
- `initials` - Initials (e.g., "JD")
- `isHost` - Is a host?
- `hasTrips` - Has any trips?
- `hasWishlist` - Has wishlist items?

**Methods:**
- `static fromApiResponse(data)` - Create from API
- `toApiPayload()` - Convert to API payload
- `clone()` - Create a copy

**Usage:**
```javascript
import { User } from '@/models';

const user = User.fromApiResponse(apiData);

console.log(user.fullName); // "John Doe"
console.log(user.initials); // "JD"

if (user.isHost) {
  // Show host dashboard
}
```

---

### 5. Listing (`Listing.js`)
Represents a property listing.

**Properties:**
- `id` - Listing ID
- `creator` - Creator user ID
- `category` - Property category
- `type` - Property type (Entire place, Room, Shared room)
- Address fields (streetAddress, city, province, country)
- Capacity fields (guestCount, bedroomCount, bedCount, bathroomCount)
- `amenities` - List of amenities
- `listingPhotoPaths` - Photo URLs
- `title` - Listing title
- `description` - Description
- `highlight` - Highlight text
- `highlightDesc` - Highlight description
- `price` - Price per night
- `status` - Listing status (active, inactive)
- `averageRating` - Average rating
- `reviewCount` - Number of reviews
- `hostProfile` - Host profile (for Room/Shared room)

**Computed Properties:**
- `fullAddress` - Full formatted address
- `shortAddress` - Short address (city, country)
- `isEntirePlace` - Is entire place?
- `isRoom` - Is a room?
- `isSharedRoom` - Is shared room?
- `requiresHostProfile` - Requires host profile?
- `isActive` - Is active?
- `isInactive` - Is inactive?
- `formattedPrice` - Formatted price
- `mainPhoto` - Main photo URL
- `hasReviews` - Has reviews?
- `ratingStars` - Rating rounded to 0.5

**Methods:**
- `static fromApiResponse(data)` - Create from API
- `toApiPayload()` - Convert to API payload
- `clone()` - Create a copy

**Usage:**
```javascript
import { Listing } from '@/models';

const listing = Listing.fromApiResponse(apiData);

console.log(listing.shortAddress); // "Ho Chi Minh, Vietnam"
console.log(listing.formattedPrice); // "2.500.000"

if (listing.requiresHostProfile && !listing.hostProfile) {
  // Show host profile form
}
```

---

## Benefits of Using Models

### 1. **Type Safety (sort of)**
Even without TypeScript, models provide structure and validation.

### 2. **Computed Properties**
No need to repeat logic everywhere:
```javascript
// Before:
const remainingAmount = totalPrice - depositAmount;

// After:
const remainingAmount = booking.paymentInfo.remainingAmount;
```

### 3. **Data Transformation**
Centralized conversion between API and UI:
```javascript
// From API
const booking = Booking.fromApiResponse(apiData);

// To API
const payload = booking.toApiPayload();
```

### 4. **Consistency**
Same data structure everywhere in the app.

### 5. **Easier Testing**
Models can be tested independently.

### 6. **Better IDE Support**
IDEs can provide better autocomplete with classes.

---

## Usage Examples

### Example 1: Fetching and Displaying Bookings
```javascript
import { Booking } from '@/models';

// In component
const fetchBookings = async () => {
  const response = await fetch('/api/bookings');
  const data = await response.json();
  
  // Convert to model instances
  const bookings = data.map(Booking.fromApiResponse);
  
  setBookings(bookings);
};

// In render
{bookings.map(booking => (
  <div key={booking.id}>
    <h3>{booking.listing?.title}</h3>
    <p>{booking.formattedDateRange}</p>
    <p>{booking.numberOfNights} nights</p>
    
    {booking.paymentInfo.isPartiallyPaid && (
      <div>
        <p>Deposit: {booking.paymentInfo.formattedDepositAmount} VND</p>
        <p>Remaining: {booking.paymentInfo.formattedRemainingAmount} VND</p>
      </div>
    )}
    
    {booking.canCheckout && <button>Check Out</button>}
  </div>
))}
```

### Example 2: Creating a Booking
```javascript
import { Booking, PaymentInfo, PaymentMethod, PaymentStatus } from '@/models';

const createBooking = async () => {
  // Create payment info
  const payment = new PaymentInfo({
    method: PaymentMethod.VNPAY_DEPOSIT,
    status: PaymentStatus.PARTIALLY_PAID,
    depositAmount: 3000000,
    depositPercentage: 30,
    totalAmount: 10000000,
  });
  
  // Create booking
  const booking = new Booking({
    customerId: user.id,
    hostId: listing.creator,
    listingId: listing.id,
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-01-05'),
    totalPrice: 10000000,
    paymentInfo: payment,
  });
  
  // Send to API
  const response = await fetch('/api/bookings', {
    method: 'POST',
    body: JSON.stringify(booking.toApiPayload()),
  });
};
```

### Example 3: Filtering Listings
```javascript
import { Listing, PropertyType } from '@/models';

const listings = apiData.map(Listing.fromApiResponse);

// Filter active entire places
const entirePlaces = listings.filter(l => 
  l.isActive && l.isEntirePlace
);

// Filter rooms that need host profile
const roomsNeedingProfile = listings.filter(l =>
  l.requiresHostProfile && !l.hostProfile
);
```

---

## Migration Guide

### Before (Plain Objects):
```javascript
// Direct API response
const bookings = apiResponse;

// Manual calculations
const remainingAmount = booking.totalPrice - booking.depositAmount;

// Repeated logic
const isDeposit = booking.paymentMethod === 'vnpay_deposit';
```

### After (Using Models):
```javascript
import { Booking } from '@/models';

// Convert to models
const bookings = apiResponse.map(Booking.fromApiResponse);

// Use computed properties
const remainingAmount = booking.paymentInfo.remainingAmount;

// Use built-in checks
const isDeposit = booking.paymentInfo.isDeposit;
```

---

## Future Enhancements

Potential additions:
1. **Validation library** (e.g., Yup, Zod)
2. **TypeScript** for real type safety
3. **More models** (Review, Message, Notification, etc.)
4. **Serialization** (JSON, localStorage)
5. **Immutability** (using Immer)
6. **State management integration** (Redux Toolkit slices)

---

## Contributing

When adding new models:
1. Follow existing patterns
2. Include JSDoc comments
3. Add `fromApiResponse()` static method
4. Add `toApiPayload()` method
5. Add `clone()` method
6. Update this README
7. Export from `index.js`

---

**Last Updated:** December 25, 2025

