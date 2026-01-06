# BUSINESS ANALYSIS DOCUMENT
# Rental Home Platform - Graduation Project

**Document Version:** 2.0  
**Date:** December 29, 2025  
**Business Analyst:** GitHub Copilot  
**Project Owner:** [Your Name]
**Last Updated:** December 29, 2025

---

## EXECUTIVE SUMMARY

This platform is a **multi-process rental accommodation system** with **THREE DISTINCT BUSINESS PROCESSES**, each serving different user needs and market segments. The processes are **intentionally separated** to ensure clear business logic, appropriate payment flows, and tailored user experiences.

### Current Implementation Status:
- ✅ **Process 1: Entire Place Rental** - Fully implemented with concurrent booking protection
- ✅ **Process 2: Room Rental** - Implemented with agreement workflow
- ✅ **Process 3: Roommate Matching** - Implemented as connection-based matching

---

## PROCESS OVERVIEW

```
┌─────────────────────────────────────────────────────────────────┐
│          RENTAL HOME PLATFORM - 3 DISTINCT PROCESSES             │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  1️⃣  ENTIRE PLACE RENTAL                                         │
│      └─ Traditional property rental (Airbnb-like)                │
│      └─ Payment: VNPay Full/Deposit (30%) / Cash                 │
│      └─ Concurrent booking protection with BookingIntent         │
│                                                                   │
│  2️⃣  ROOM RENTAL (Shared Living)                                 │
│      └─ Rent a private room in shared house                      │
│      └─ Monthly-based with Digital Agreement                     │
│      └─ Requires Identity Verification                           │
│                                                                   │
│  3️⃣  ROOMMATE MATCHING                                            │
│      └─ Find compatible people to live with                      │
│      └─ NO payment through platform                              │
│      └─ Requires Identity Verification                           │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

# PROCESS 1: ENTIRE PLACE RENTAL

## 1.1 Business Objective

**Goal:** Enable property owners to rent out entire properties (houses, apartments, villas) to guests for short-term or long-term stays.

**Target Market:**
- Property owners with vacant properties
- Tourists/travelers seeking temporary accommodation
- Business travelers
- People relocating temporarily

**Revenue Model:**
- Platform commission on each booking (10-15%)
- Optional premium listing fees
- Transaction fees

---

## 1.2 User Roles

### 1.2.1 Host (Property Owner)
**Capabilities:**
- List entire properties (type: "An entire place")
- Set pricing (daily rate)
- Manage listing visibility (active/inactive)
- Review booking requests
- Accept/Reject bookings
- Communicate with guests via real-time chat
- View booking history and revenue
- Extend guest stays

**Responsibilities:**
- Maintain property condition
- Ensure accurate listing information
- Respond to booking requests promptly
- Prepare property for guests

### 1.2.2 Guest (Renter)
**Capabilities:**
- Search for entire properties
- View property details with host info
- Send booking requests with payment
- Choose payment method (VNPay Full/Deposit/Cash)
- Communicate with hosts
- Check-in/Check-out
- Request stay extension
- Cancel bookings (with reason)
- Leave reviews

**Responsibilities:**
- Pay on time
- Follow house rules
- Maintain property condition
- Provide feedback

---

## 1.3 Business Process Flow

```
┌─────────────────────────────────────────────────────────────────┐
│              PROCESS 1: ENTIRE PLACE RENTAL FLOW                 │
└─────────────────────────────────────────────────────────────────┘

Guest Journey:
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Search  │ →  │  View    │ →  │  Select  │ →  │ Choose   │
│ Property │    │ Details  │    │  Dates   │    │ Payment  │
└──────────┘    └──────────┘    └──────────┘    │  Method  │
                                                 └──────────┘
                                                      ↓
                                                 ┌──────────┐
                                                 │ VNPay    │
                                                 │ Full 100%│
                                                 ├──────────┤
                                                 │ VNPay    │
                                                 │ Deposit  │
                                                 │   30%    │
                                                 ├──────────┤
                                                 │ Cash at  │
                                                 │ Check-in │
                                                 └──────────┘
                                                      ↓
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ Check-out│ ←  │  Stay &  │ ←  │  Host    │ ←  │  Booking │
│ & Review │    │  Enjoy   │    │ Approves │    │ Created  │
└──────────┘    └──────────┘    └──────────┘    └──────────┘

Host Journey:
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Create  │ →  │  Publish │ →  │ Receive  │ →  │  Review  │
│ Listing  │    │ Property │    │ Booking  │    │ Request  │
└──────────┘    └──────────┘    │ Request  │    └──────────┘
                                 └──────────┘         ↓
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ Receive  │ ←  │  Guest   │ ←  │  Confirm │ ← │  Accept/ │
│ Payment  │    │ Check-in │    │ Check-out│    │  Reject  │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
```

---

## 1.4 Booking States (Implemented)

Based on `Booking.js` model:

| State | Description | Actions Available | Next States |
|-------|-------------|-------------------|-------------|
| **draft** | Initial state before submission | N/A | pending |
| **pending** | Booking request submitted, awaiting host approval | Host: Accept/Reject<br>Guest: Cancel | approved, rejected, cancelled |
| **approved** | Host accepted booking | Guest: Check-in<br>Host: Monitor | checked_in, cancelled |
| **checked_in** | Guest has checked in | Guest: Check-out<br>Host: Monitor | checked_out |
| **checked_out** | Guest has checked out | Host: Complete booking | completed |
| **completed** | Booking finished, reviews enabled | Both: Leave reviews | Terminal state |
| **rejected** | Host rejected the booking | N/A | Terminal state |
| **cancelled** | Booking cancelled by guest/host | N/A | Terminal state |
| **expired** | Booking intent expired (concurrency) | N/A | Terminal state |

---

## 1.5 Payment Logic (Implemented)

### Payment Methods (from Booking model):

1. **VNPay Full Payment (100%)**
   - `paymentMethod: "vnpay"`
   - `paymentType: "full"`
   - Guest pays entire rental amount upfront via VNPay
   - Booking status auto-set to "approved" after successful payment
   - `depositPercentage: 0`
   - `remainingAmount: 0`

2. **VNPay Deposit (30%)**
   - `paymentMethod: "vnpay"`
   - `paymentType: "deposit"`
   - Guest pays 30% deposit via VNPay
   - `depositPercentage: 30`
   - `depositAmount` = 30% of total
   - `remainingAmount` = 70% of total
   - Remaining payment reminder sent before check-in
   - Guest can complete remaining via VNPay or Cash

3. **Cash Payment**
   - `paymentMethod: "cash"`
   - `paymentType: "cash"`
   - Full amount paid directly to host at check-in
   - Booking requires manual host approval
   - `paymentStatus: "unpaid"` until host confirms

### Payment Status (from Booking model):
- `unpaid` - No payment received
- `partially_paid` - Deposit paid, remaining pending
- `paid` - Full payment received
- `refunded` - Payment refunded

### Payment Flow with Concurrency Protection:
```
┌─────────────────────────────────────────────────────────────┐
│         PAYMENT FLOW WITH BOOKING INTENT PROTECTION          │
└─────────────────────────────────────────────────────────────┘

Step 1: Guest selects dates & payment method
                    ↓
Step 2: Create BookingIntent (LOCKED) - 10 min expiry
        → Prevents other users from booking same dates
                    ↓
Step 3: Process Payment
        ├─ VNPay → Redirect to VNPay gateway
        └─ Cash → Direct booking creation
                    ↓
Step 4: Handle Result
        ├─ VNPay Success → Create Booking, BookingIntent = PAID
        ├─ VNPay Failed → BookingIntent = FAILED/EXPIRED
        └─ Cash → Booking = PENDING (awaits host)
                    ↓
Step 5: Booking Created
        ├─ VNPay Full → bookingStatus = "approved" (auto)
        └─ VNPay Deposit/Cash → bookingStatus = "pending"
```

### Payment History Tracking:
Each booking maintains a `paymentHistory` array:
```javascript
paymentHistory: [{
  amount: Number,
  method: "vnpay" | "cash" | "bank_transfer",
  status: "pending" | "paid" | "failed" | "refunded",
  transactionId: String,
  type: "deposit" | "partial" | "full" | "remaining",
  paidAt: Date,
  notes: String
}]
```

---

## 1.6 Concurrent Booking Protection (BookingIntent)

### Purpose:
Prevents overbooking when multiple users try to book the same listing simultaneously.

### BookingIntent States:
| State | Description |
|-------|-------------|
| **locked** | Listing dates are temporarily locked for this user |
| **paid** | Payment successful, booking created |
| **expired** | Lock timeout (default 10 min), dates released |
| **cancelled** | User cancelled before payment |
| **failed** | Payment failed |

### How It Works:
1. User initiates booking → Backend creates BookingIntent with `status: "locked"`
2. Lock expires after 10 minutes (configurable)
3. If another user tries to book same dates → Rejected with "Currently being booked by another user"
4. On successful payment → BookingIntent `status: "paid"` → Booking created
5. On timeout/failure → BookingIntent released → Dates available again

### Automatic Lock Release:
Background job (cron) runs periodically to:
- Find expired BookingIntents
- Mark them as `expired`
- Release listing locks

---

## 1.7 Business Rules (Implemented)

### Booking Rules:
1. Guest can only book available dates
2. Minimum booking period: 1 night
3. Maximum booking period: Unlimited
4. Check-in/Check-out times: Set by host
5. Guest cannot book their own listing
6. Only one booking per date range (enforced by BookingIntent)

### Payment Rules:
1. VNPay payments must complete within 10 minutes (BookingIntent expiry)
2. Deposit payments are 30% of total
3. Remaining payment reminder sent 1 day before check-in
4. Deposit payments require remaining payment before/at check-in
5. Cash payments are marked paid only when host confirms

### Cancellation Policy:
1. Guest can cancel pending bookings with reason
2. Host can reject pending bookings with reason
3. Cancellation reason stored in `cancellationReason` field
4. Rejection reason stored in `rejectionReason` field

---

# PROCESS 2: ROOM RENTAL (Shared Living)

## 2.1 Business Objective

**Goal:** Enable homeowners to rent out individual rooms in their shared living spaces to compatible tenants on a monthly basis.

**Key Difference from Entire Place:**
- Monthly pricing (not daily)
- Requires lifestyle compatibility
- Digital agreement workflow
- **Requires Identity Verification before posting**

---

## 2.2 User Roles

### 2.2.1 Host (Room Owner)
**Capabilities:**
- List individual rooms (type: "Room(s)")
- Set monthly rent price
- Set room area (m²)
- Define lifestyle preferences (hostProfile)
- Review tenant applications
- Accept/Reject rental requests
- Generate and sign digital agreements
- Track rental payments

**Requirements:**
- ✅ Must complete Identity Verification before posting
- Must provide: Full name, Phone, Date of Birth, ID Card (front/back)
- Admin must approve verification

### 2.2.2 Tenant (Room Seeker)
**Capabilities:**
- Search for compatible rooms
- View room details with host lifestyle info
- Submit rental request with:
  - Self-introduction message (50-1000 chars)
  - Intended move-in date
  - Intended stay duration (months)
- Review and sign digital agreement
- Track rental payments

**Requirements:**
- ✅ Must complete Identity Verification before requesting
- Must provide: Full name, Phone, Date of Birth, ID Card (front/back)

---

## 2.3 Business Process Flow

```
┌─────────────────────────────────────────────────────────────────┐
│              PROCESS 2: ROOM RENTAL FLOW                         │
└─────────────────────────────────────────────────────────────────┘

Tenant Journey:
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ Complete │ →  │  Search  │ →  │  View    │ →  │  Submit  │
│ Identity │    │  Rooms   │    │  Room    │    │ Rental   │
│ Verify   │    │  (Filter)│    │ Details  │    │ Request  │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
                                                      ↓
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ Move In  │ ←  │  Sign    │ ← │  Review  │ ← │  Host    │
│ & Live   │    │Agreement │    │Agreement │    │Approves  │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
```

---

## 2.4 Data Models (Implemented)

### RentalRequest Model:
```javascript
{
  roomId: ObjectId,          // Reference to Listing
  tenantId: ObjectId,        // Reference to User (requester)
  hostId: ObjectId,          // Reference to User (room owner)
  message: String,           // Self-introduction (50-1000 chars)
  moveInDate: Date,
  intendedStayDuration: Number, // in months (min: 1)
  status: "REQUESTED" | "APPROVED" | "REJECTED" | "CANCELLED",
  rejectionReason: String
}
```

### RentalAgreement Model:
```javascript
{
  roomId: ObjectId,
  tenantId: ObjectId,
  hostId: ObjectId,
  rentalRequestId: ObjectId,
  rentAmount: Number,
  depositAmount: Number,
  paymentMethod: "ONLINE" | "CASH" | "MIXED",
  noticePeriod: Number,      // in days (default: 30)
  houseRules: String,
  status: "DRAFT" | "ACTIVE" | "TERMINATED",
  agreedByTenantAt: Date,    // Digital signature timestamp
  agreedByHostAt: Date,      // Digital signature timestamp
  startDate: Date,
  endDate: Date
}
```

### RentalPayment Model:
```javascript
{
  agreementId: ObjectId,
  tenantId: ObjectId,
  hostId: ObjectId,
  amount: Number,
  paymentType: "DEPOSIT" | "MONTHLY",
  method: "ONLINE" | "CASH",
  status: "UNPAID" | "PARTIALLY_PAID" | "PAID",
  paidAmount: Number,
  paidAt: Date,
  dueDate: Date,
  month: String,            // Format: "YYYY-MM"
  transactionId: String
}
```

---

## 2.5 Application States (Room Rental)

| State | Description | Actions | Next States |
|-------|-------------|---------|-------------|
| **REQUESTED** | Tenant submitted rental request | Host: Review | APPROVED, REJECTED, CANCELLED |
| **APPROVED** | Host accepted request | Generate Agreement | DRAFT Agreement |
| **REJECTED** | Host rejected request | N/A | Terminal |
| **CANCELLED** | Tenant cancelled request | N/A | Terminal |

### Agreement States:
| State | Description | Actions | Next States |
|-------|-------------|---------|-------------|
| **DRAFT** | Agreement generated, awaiting signatures | Both: Sign | ACTIVE |
| **ACTIVE** | Both parties signed, rental active | Manage payments | TERMINATED |
| **TERMINATED** | Rental ended | N/A | Terminal |

---

## 2.6 Identity Verification (Implemented)

### Purpose:
Required for Room Rental and Roommate posting to ensure safety and trust.

### IdentityVerification Model:
```javascript
{
  userId: ObjectId,          // One verification per user
  fullName: String,
  phoneNumber: String,
  dateOfBirth: Date,
  idCardFront: String,       // Cloudinary URL
  idCardBack: String,        // Cloudinary URL
  status: "pending" | "approved" | "rejected",
  rejectionReason: String,
  submittedAt: Date,
  reviewedAt: Date,
  reviewedBy: ObjectId       // Admin who reviewed
}
```

### Verification Flow:
1. User selects Room(s) or Shared Room type
2. System checks verification status
3. If not verified → Show IdentityVerificationForm
4. User submits: Name, Phone, DOB, ID Card photos
5. Admin reviews in Admin Dashboard
6. Admin approves/rejects with reason
7. If approved → User can post/request
8. If rejected → User must resubmit

---

## 2.7 Host Profile (for Room Listings)

When creating a Room listing, host provides lifestyle info:
```javascript
hostProfile: {
  sleepSchedule: "early_bird" | "night_owl" | "flexible",
  smoking: "yes" | "no" | "outside_only",
  personality: "introvert" | "extrovert" | "ambivert",
  cleanliness: "very_clean" | "moderate" | "relaxed",
  occupation: String,
  hobbies: String,
  houseRules: String,
  additionalInfo: String
}
```

---

# PROCESS 3: ROOMMATE MATCHING

## 3.1 Business Objective

**Goal:** Connect people looking for compatible roommates to share housing costs. **NO PROPERTY TRANSACTIONS** - platform only facilitates matching and communication.

**Key Characteristics:**
- Peer-to-peer matching (no host/guest distinction)
- No booking, no payment through platform
- Connection-based workflow
- Requires Identity Verification

---

## 3.2 User Roles

### Roommate Seeker (SEEKER)
Looking for someone to share a place with.

### Room Provider (PROVIDER)
Has a place and looking for a roommate.

---

## 3.3 Business Process Flow

```
┌─────────────────────────────────────────────────────────────────┐
│              PROCESS 3: ROOMMATE MATCHING FLOW                   │
└─────────────────────────────────────────────────────────────────┘

User A Journey:
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ Complete │ →  │  Create  │ →  │  Browse  │ →  │  Send    │
│ Identity │    │  Post    │    │  Other   │    │ Request  │
│ Verify   │    │ (SEEKER/ │    │  Posts   │    │ to Match │
│          │    │ PROVIDER)│    └──────────┘    └──────────┘
└──────────┘    └──────────┘                          ↓
                                ┌──────────┐    ┌──────────┐
                                │  Chat &  │ ← │  Other   │
                                │  Connect │    │  Accepts │
                                └──────────┘    └──────────┘
                                      ↓
                                ┌──────────┐
                                │  Found   │
                                │ Housing! │
                                │ (Close)  │
                                └──────────┘
```

---

## 3.4 Data Models (Implemented)

### RoommatePost Model:
```javascript
{
  userId: ObjectId,
  postType: "SEEKER" | "PROVIDER",
  title: String,
  description: String,
  // Location
  city: String,
  province: String,
  country: String,
  // Budget
  budgetMin: Number,
  budgetMax: Number,
  // Move-in
  moveInDate: Date,
  // Preferences
  genderPreference: "MALE" | "FEMALE" | "ANY",
  ageRangeMin: Number,
  ageRangeMax: Number,
  // Lifestyle
  lifestyle: {
    sleepSchedule: "EARLY_BIRD" | "NIGHT_OWL" | "FLEXIBLE",
    smoking: "YES" | "NO" | "OUTSIDE_ONLY",
    pets: "YES" | "NO" | "NEGOTIABLE",
    cleanliness: "VERY_CLEAN" | "MODERATE" | "RELAXED",
    occupation: "STUDENT" | "PROFESSIONAL" | "FREELANCER" | "OTHER"
  },
  // Contact
  preferredContact: "CHAT" | "PHONE" | "EMAIL",
  contactEmail: String,
  contactPhone: String,
  // Images
  images: [String],
  // Status
  status: "ACTIVE" | "MATCHED" | "CLOSED",
  matchedWith: ObjectId,
  matchedAt: Date,
  // Stats
  viewCount: Number,
  requestCount: Number
}
```

### RoommateRequest Model:
```javascript
{
  postId: ObjectId,
  senderId: ObjectId,
  receiverId: ObjectId,
  message: String,
  status: "PENDING" | "ACCEPTED" | "REJECTED"
}
```

### RoommateMatch Model:
```javascript
{
  postId: ObjectId,
  userAId: ObjectId,
  userBId: ObjectId,
  matchedAt: Date
}
```

---

## 3.5 Post States

| State | Description | Actions | Next States |
|-------|-------------|---------|-------------|
| **ACTIVE** | Post is visible in search | Receive requests, Edit, Close | MATCHED, CLOSED |
| **MATCHED** | User found a roommate | N/A | CLOSED |
| **CLOSED** | Post manually closed | N/A | Terminal |

### Request States:
| State | Description | Actions | Next States |
|-------|-------------|---------|-------------|
| **PENDING** | Request sent, awaiting response | Accept/Reject | ACCEPTED, REJECTED |
| **ACCEPTED** | Request accepted, can chat | Chat | Match created |
| **REJECTED** | Request rejected | N/A | Terminal |

---

## 3.6 Payment (None)

**IMPORTANT:** Platform does NOT handle any payments for roommate matching.
- No booking fees
- No deposits
- No rent payments

Users arrange all financial matters externally.

---

# CROSS-PROCESS COMPARISON (Updated)

| Feature | Process 1: Entire Place | Process 2: Room Rental | Process 3: Roommate |
|---------|-------------------------|------------------------|---------------------|
| **Primary Goal** | Short-term accommodation | Long-term shared living | Find compatible roommates |
| **Property Owner** | Host | Host | External/N/A |
| **User Relationship** | Guest ↔ Host | Tenant ↔ Host | Peer ↔ Peer |
| **Pricing** | Daily | Monthly | N/A |
| **Payment Methods** | VNPay Full/Deposit/Cash | VNPay/Cash | None |
| **Payment Amount** | Full or 30% deposit | Deposit + Monthly | None |
| **Identity Verification** | Not required | ✅ Required | ✅ Required |
| **Agreement** | Booking agreement | Digital lease agreement | None |
| **Concurrency Protection** | BookingIntent | N/A | N/A |
| **Approval Process** | Host accepts/rejects | Host accepts → Agreement | Mutual acceptance |
| **Duration** | 1+ nights | 1+ months | Until matched |

---

# ADMIN FEATURES (Implemented)

## Admin Dashboard
Accessible only to users with `role: "admin"`.

### Capabilities:
1. **System Statistics**
   - Total users
   - Total listings
   - Total bookings
   - Revenue tracking

2. **User Management**
   - View all users
   - Enable/Disable users

3. **Listing Management**
   - View all listings
   - Manage listing visibility

4. **Identity Verification Management**
   - Review pending verifications
   - Approve/Reject with reason
   - View verification history

5. **Categories/Facilities Management**
   - Add/Edit/Delete categories
   - Add/Edit/Delete facilities

---

# TECHNICAL IMPLEMENTATION (Current State)

## Backend Architecture (Node.js + Express + MongoDB)

### Route Structure:
```
server/routes/
├── auth.js                 # Login, Register
├── booking.js              # Entire place bookings
├── payment.js              # VNPay integration
├── paymentReminder.js      # Deposit remaining payment
├── concurrentBooking.js    # BookingIntent handling
├── roomRental.js           # Room rental requests & agreements
├── roommate.js             # Roommate posts & matching
├── identityVerification.js # ID verification
├── listing.js              # Property listings
├── user.js                 # User profile
└── admin.js                # Admin operations
```

### Service Layer:
```
server/services/
├── concurrentBookingService.js  # BookingIntent logic
├── bookingService.js            # Booking operations
├── vnpayService.js              # VNPay payment processing
├── paymentReminderService.js    # Cron job for reminders
└── cloudinaryService.js         # Image upload
```

## Frontend Architecture (React)

### Page Structure:
```
client/src/pages/
├── home/HomePage.jsx           # Main landing with 3 process tabs
├── host/CreateListing.jsx      # Create listing (all types)
├── listing/
│   ├── ListDetailPage.jsx      # Entire place details
│   └── BookingCheckoutPage.jsx # Payment flow
├── entirePlace/
│   ├── EntirePlaceSearch.jsx
│   ├── BookingReview.jsx
│   └── BookingConfirmation.jsx
├── roomRental/
│   ├── RoomRentalDetail.jsx
│   ├── HostRequests.jsx
│   ├── MyAgreements.jsx
│   └── ...
├── roommate/
│   ├── RoommateSearch.jsx
│   ├── RoommatePostForm.jsx
│   ├── RoommatePostDetail.jsx
│   └── MyRoommateRequests.jsx
├── admin/
│   └── AdminDashboard.jsx
└── profile/
    └── EditProfilePage.jsx
```

---

# SUCCESS METRICS BY PROCESS

## Process 1: Entire Place Rental
- **Bookings per month**
- **Average booking value**
- **VNPay vs Cash payment ratio**
- **Booking completion rate**
- **Cancellation rate < 10%**
- **Average response time < 24 hours**
- **BookingIntent conversion rate**

## Process 2: Room Rental
- **Rental requests per month**
- **Request-to-agreement conversion > 30%**
- **Agreement signing rate**
- **Average rental duration (months)**
- **Identity verification completion rate**

## Process 3: Roommate Matching
- **Active posts count**
- **Connection request acceptance rate > 40%**
- **Posts successfully matched > 30%**
- **Identity verification completion rate**
- **Average time to match**

---

# APPENDIX: KEY BUSINESS RULES SUMMARY

## General Rules:
1. All users must register with valid email
2. Profile image recommended but optional
3. Real-time chat available between connected users
4. Notification system for all status changes

## Entire Place Rules:
1. BookingIntent expires after 10 minutes
2. VNPay Full → Auto-approved
3. VNPay Deposit/Cash → Requires host approval
4. Deposit is 30% of total
5. Guest can cancel with reason before approval
6. Host can reject with reason

## Room Rental Rules:
1. Must verify identity before posting/requesting
2. Request must include 50-1000 char message
3. Agreement requires both parties' digital signatures
4. Room becomes unavailable after active agreement

## Roommate Rules:
1. Must verify identity before posting
2. One active post per user recommended
3. Cannot send request to own post
4. Post auto-closes when matched

---

**Document Status:** UPDATED  
**Version:** 2.0  
**Last Modified:** December 29, 2025  

**Changes from v1.0:**
- Updated booking states based on actual Booking model
- Added BookingIntent concurrency protection details
- Added 30% deposit payment option (was 50%)
- Updated Identity Verification requirements
- Added Room Rental agreement workflow
- Added Roommate matching flow
- Updated technical architecture to match current code
- Added Admin features section
