# 🏠 Rental Home Platform

A comprehensive multi-platform rental solution supporting **Entire Place Rentals**, **Room Rentals**, and **Roommate
Matching**. Built with React.js (Web), Flutter (Mobile), Node.js (Backend), and MongoDB.

![Platform](https://img.shields.io/badge/Platform-Web%20%7C%20Mobile-blue?style=for-the-badge)
![Version](https://img.shields.io/badge/version-3.0.0-success?style=for-the-badge)
![License](https://img.shields.io/badge/license-ISC-green?style=for-the-badge)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Core Features](#-core-features)
- [Business Processes](#-business-processes)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Environment Setup](#-environment-setup)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Documentation](#-documentation)

---

## 🌟 Overview

This platform serves three distinct rental processes:

1. **PROCESS 1: Entire Place Rental** - Short-term/nightly bookings with payment integration
2. **PROCESS 2: Room Rental** - Monthly room rentals with digital agreements
3. **PROCESS 3: Roommate Matching** - Find compatible roommates (no booking/payment)

### Key Differentiators

- ✅ **Multi-Process Architecture** - Each rental type has its own complete flow
- ✅ **Cross-Platform** - Web (React) + Mobile (Flutter)
- ✅ **Payment Integration** - VNPay gateway with multiple payment options
- ✅ **Identity Verification** - Required for shared living situations
- ✅ **Concurrent Booking Protection** - Prevents overbooking via BookingIntent system
- ✅ **Real-time Messaging** - Socket.io powered chat
- ✅ **Admin Dashboard** - Complete platform management

---

## ✨ Core Features

### 🔐 Authentication & Security

- User registration with profile image upload
- JWT-based authentication (7-day expiration)
- Password reset via email
- Identity verification (ID card upload) for shared rentals
- Admin role management
- Secure file uploads with Cloudinary

### 🏡 PROCESS 1: Entire Place Rental

- **Search & Discovery** with filters (dates, location, price, amenities)
- **Booking Widget** with real-time availability
- **Payment Options**:
    - VNPay Full Payment (100%)
    - VNPay Deposit (30%) + Cash
    - Cash on Check-in
- **BookingIntent** system prevents concurrent bookings
- **Booking lifecycle**: Pending → Approved → Check-in → Check-out → Completed
- **Payment reminders** for partial payments
- **Reviews & Ratings** post-checkout

### 🚪 PROCESS 2: Room Rental (Monthly)

- **Room search** with lifestyle compatibility filters
- **Rental Request** flow with host approval
- **Digital Agreement** generation and signing
- **Monthly rent cycle** with due date tracking
- **Move-in/Move-out** confirmation
- **Payment tracking** (Online/Cash)
- **Termination notice** handling

### 🤝 PROCESS 3: Roommate Matching

- **Post creation** (Seeker/Provider roles)
- **Search by lifestyle preferences** (sleep schedule, pets, cleanliness, etc.)
- **Request & Match** system
- **In-app chat** between matched users
- **No payment/booking** - pure matching platform
- **Post status**: Active → Matched → Closed

### 💬 Messaging System

- Real-time chat powered by Socket.io
- Conversation management
- Unread message notifications
- Contact host functionality
- Message history

### 📊 Admin Dashboard

- User management (view/suspend/delete)
- Identity verification approval
- Listing moderation
- Booking statistics
- Payment history
- System analytics

### 📅 Calendar Management

- **Host Calendar** - Visual booking calendar for hosts
- **Month/Year Navigation** - Easy date navigation
- **Booking Overview** - See all bookings at a glance
- **Status Indicators** - Color-coded booking status
- **Booking Details** - Guest info, check-in/out dates, payment status
- **Availability Management** - Block dates or set availability

### 🔔 Notification System

- **Real-time Notifications** - Instant updates via Socket.io
- **Push Notifications** - Firebase Cloud Messaging (FCM) for mobile
- **Email Notifications** - Important updates via email
- **Notification Types**:
    - Booking confirmations
    - Payment reminders
    - Message alerts
    - Review requests
    - Agreement signatures
    - Admin announcements
- **Notification Center** - View all notifications in one place
- **Read/Unread Status** - Track notification status

### 📱 Mobile Application (Flutter)

- All core web features available on mobile
- Native payment integration
- Push notifications
- Offline mode support
- Responsive UI optimized for mobile

---

## 💼 Business Processes

### PROCESS 1: Entire Place Rental Flow

```
Guest Search → View Listing → Select Dates → Choose Payment Method
→ Create BookingIntent (locks listing)
→ Complete Payment (VNPay/Cash)
→ Host Approves (auto-approve if full payment)
→ Check-in → Check-out → Reviews
```

### PROCESS 2: Room Rental Flow

```
Tenant Search → Submit Rental Request → Host Reviews
→ Generate Agreement → Both Parties Sign
→ Pay Deposit → Move-in Confirmation
→ Monthly Rent Cycle → Termination Notice → Move-out
```

### PROCESS 3: Roommate Flow

```
User Creates Post (Seeker/Provider)
→ Other Users Browse & Search
→ Send Request → Accept/Reject
→ Match Created → Chat Enabled
→ Close Post
```

---

## 🛠️ Tech Stack

### Frontend (Web)

- **React.js** 19.2.0 - UI framework
- **React Router** 7.9.5 - Navigation
- **Redux Toolkit** - State management
- **Sass** 1.93.3 - Styling
- **Material-UI** 7.3.4 - Component library
- **Socket.io Client** - Real-time communication
- **Axios** - HTTP client

### Frontend (Mobile)

- **Flutter** 3.24+ - Cross-platform framework
- **Dart** 3.4+ - Programming language
- **BLoC / Cubit** - State management (flutter_bloc)
- **Provider** - Lightweight state management
- **http** - API communication
- **socket_io_client** - Real-time messaging
- **Firebase Core** - Firebase SDK
- **Firebase Messaging** - Push notifications (FCM)
- **flutter_local_notifications** - Local notifications
- **image_picker** - Media upload
- **flutter_secure_storage** - Secure token storage
- **table_calendar** - Calendar widget for hosts
- **shared_preferences** - Local data persistence
- **cached_network_image** - Image caching

### Backend

- **Node.js** 20.14.0 - Runtime
- **Express.js** 5.1.0 - Web framework
- **MongoDB** 8.19.2 - Database
- **Mongoose** - ODM
- **Socket.io** - WebSocket server
- **JWT** 9.0.2 - Authentication
- **bcryptjs** - Password hashing
- **Multer** - File upload middleware
- **Cloudinary** - Image storage
- **node-cron** - Scheduled tasks
- **Firebase Admin SDK** - Push notifications server-side

### Payment Integration

- **VNPay** - Vietnamese payment gateway
- Support for QR, card, and bank transfer

### DevOps & Tools

- **dotenv** - Environment management
- **CORS** - Cross-origin security
- **Nodemon** - Development auto-reload
- **Make** - Build automation

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** v20.14.0 or higher
- **npm** or **yarn**
- **MongoDB** (local or Atlas)
- **Flutter SDK** 3.24+ (for mobile)
- **Git**
- **Cloudinary Account** (for image uploads)
- **VNPay Sandbox Account** (for payment testing)

### Installation

#### Option 1: Using Makefile (Recommended)

```bash
# Clone repository
git clone https://github.com/yourusername/Rental-Home-Project.git
cd Rental-Home-Project

# Setup and start entire project
make setup
make start

# Or individual commands
make install-server    # Install server dependencies
make install-client    # Install client dependencies
make start-server      # Start backend
make start-client      # Start frontend
```

#### Option 2: Manual Setup

**1. Clone Repository**

```bash
git clone https://github.com/yourusername/Rental-Home-Project.git
cd Rental-Home-Project
```

**2. Server Setup**

```bash
cd server
npm install
```

Create `.env` file in `server/` directory:

```env
# Database
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/rental-home-db

# Authentication
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# VNPay
VNPAY_TMN_CODE=your_tmn_code
VNPAY_HASH_SECRET=your_hash_secret
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=http://localhost:3000/payment/vnpay-callback

# Server
PORT=3001
NODE_ENV=development

# Email (Optional - for password reset)
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
```

**3. Client Setup**

```bash
cd ../client
npm install
```

**4. Mobile Setup (Optional)**

```bash
cd ../mobile
flutter pub get

# For iOS
cd ios && pod install && cd ..

# For Android - ensure Android SDK is configured
```

**5. Database Migration**

```bash
cd server
npm run migrate  # Seed initial data (categories, types, facilities)
```

**6. Start Development**

```bash
# Terminal 1 - Backend
cd server
npm start

# Terminal 2 - Frontend
cd client
npm start

# Terminal 3 - Mobile (optional)
cd mobile
flutter run
```

**7. Access Applications**

- **Web App**: http://localhost:3000
- **API Server**: http://localhost:3001
- **Mobile**: Use emulator or physical device

---

## 📁 Project Structure

```
Rental-Home-Project/
├── client/                          # React Web Application
│   ├── public/
│   │   ├── assets/
│   │   ├── favicon.ico
│   │   └── index.html
│   ├── src/
│   │   ├── components/              # Reusable UI components
│   │   │   ├── Navbar.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── ListingCard.jsx
│   │   │   └── ...
│   │   ├── pages/
│   │   │   ├── auth/                # Authentication pages
│   │   │   ├── entirePlace/         # Entire Place Rental
│   │   │   ├── roomRental/          # Room Rental
│   │   │   ├── roommate/            # Roommate Matching
│   │   │   ├── admin/               # Admin Dashboard
│   │   │   ├── messages/            # Chat system
│   │   │   └── ...
│   │   ├── redux/                   # State management
│   │   ├── styles/                  # SCSS stylesheets
│   │   ├── utils/                   # Helper functions
│   │   ├── config/                  # API endpoints
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
│
├── server/                          # Node.js Backend
│   ├── models/                      # Mongoose schemas
│   │   ├── User.js
│   │   ├── Listing.js
│   │   ├── Booking.js
│   │   ├── BookingIntent.js
│   │   ├── RoomRental.js
│   │   ├── RoommatePost.js
│   │   ├── Payment.js
│   │   └── ...
│   ├── routes/                      # API routes
│   │   ├── auth.js
│   │   ├── listing.js
│   │   ├── booking.js
│   │   ├── entirePlaceBooking.js
│   │   ├── roomRental.js
│   │   ├── roommate.js
│   │   ├── payment.js
│   │   └── ...
│   ├── services/                    # Business logic
│   │   ├── cloudinaryService.js
│   │   ├── vnpayService.js
│   │   ├── bookingService.js
│   │   └── ...
│   ├── middleware/
│   │   └── auth.js                  # JWT verification
│   ├── scripts/                     # Utility scripts
│   │   ├── testConcurrentBooking.js
│   │   └── ...
│   ├── .env
│   ├── index.js                     # Server entry point
│   └── package.json
│
├── mobile/                          # Flutter Mobile App
│   ├── android/
│   ├── ios/
│   ├── lib/
│   │   ├── main.dart
│   │   ├── config/
│   │   ├── models/
│   │   ├── providers/
│   │   ├── screens/
│   │   ├── services/
│   │   ├── widgets/
│   │   └── utils/
│   ├── assets/
│   ├── pubspec.yaml
│   └── README.md
│
├── docs/                            # Documentation
│   ├── BUSINESS_ANALYSIS.md
│   ├── USE_CASES_CURRENT.md
│   ├── SEQUENCE_DIAGRAMS.md
│   ├── COMPARISON.md
│   ├── PROJECT_REPORT.md
│   └── ...
│
├── Makefile                         # Build automation
├── README.md
└── package.json
```

---

## 🔌 API Documentation

### Base URL

```
Development: http://localhost:3001
Production: https://your-domain.com/api
```

### Authentication Endpoints

| Method | Endpoint                | Description            | Auth Required |
|--------|-------------------------|------------------------|---------------|
| POST   | `/auth/register`        | Register new user      | No            |
| POST   | `/auth/login`           | User login             | No            |
| POST   | `/auth/forgot-password` | Request password reset | No            |
| POST   | `/auth/reset-password`  | Reset password         | No            |
| GET    | `/auth/verify-token`    | Verify JWT token       | Yes           |

### Entire Place Booking Endpoints

| Method | Endpoint                                        | Description                   | Auth Required |
|--------|-------------------------------------------------|-------------------------------|---------------|
| GET    | `/entire-place/search`                          | Search entire place listings  | No            |
| GET    | `/entire-place/listing/:id`                     | Get listing details           | No            |
| POST   | `/booking-intent/create`                        | Create booking intent (lock)  | Yes           |
| POST   | `/booking-intent/confirm`                       | Confirm booking after payment | Yes           |
| GET    | `/booking-intent/check-availability/:listingId` | Check availability            | No            |
| POST   | `/payment/create-payment-url`                   | Generate VNPay payment URL    | Yes           |
| GET    | `/payment/vnpay-callback`                       | VNPay callback handler        | No            |

### Room Rental Endpoints

| Method | Endpoint                            | Description            | Auth Required |
|--------|-------------------------------------|------------------------|---------------|
| GET    | `/room-rental/search`               | Search room rentals    | No            |
| POST   | `/room-rental/request`              | Submit rental request  | Yes           |
| PUT    | `/room-rental/requests/:id/approve` | Host approves request  | Yes           |
| POST   | `/room-rental/agreement/sign`       | Sign digital agreement | Yes           |
| GET    | `/room-rental/my-rentals`           | Get user's rentals     | Yes           |

### Roommate Endpoints

| Method | Endpoint                        | Description           | Auth Required |
|--------|---------------------------------|-----------------------|---------------|
| POST   | `/roommate/posts`               | Create roommate post  | Yes           |
| GET    | `/roommate/search`              | Search roommate posts | No            |
| POST   | `/roommate/requests`            | Send roommate request | Yes           |
| PUT    | `/roommate/requests/:id/accept` | Accept request        | Yes           |
| PUT    | `/roommate/posts/:id/close`     | Close post            | Yes           |

### Admin Endpoints

| Method | Endpoint                           | Description                | Auth Required |
|--------|------------------------------------|----------------------------|---------------|
| GET    | `/admin/dashboard/stats`           | Get system statistics      | Admin         |
| GET    | `/admin/users`                     | Get all users              | Admin         |
| PUT    | `/admin/users/:id/suspend`         | Suspend user               | Admin         |
| GET    | `/admin/verifications`             | Get identity verifications | Admin         |
| PUT    | `/admin/verifications/:id/approve` | Approve verification       | Admin         |

### Request Example

```javascript
// Create Booking Intent
const response = await fetch('http://localhost:3001/booking-intent/create', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
        listingId: '507f1f77bcf86cd799439011',
        startDate: '2025-01-15',
        endDate: '2025-01-20',
        guests: 2,
        paymentMethod: 'vnpay',
        paymentType: 'full'
    })
});

const data = await response.json();
// Returns: { success: true, bookingIntent: {...}, expiresIn: 600 }
```

---

## 🔐 Environment Setup

### Server Environment Variables

Create `server/.env`:

```env
# Database Configuration
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/rental-home-db?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your-minimum-32-character-secret-key-change-in-production

# Cloudinary Configuration (Image Storage)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# VNPay Configuration (Payment Gateway)
VNPAY_TMN_CODE=your_vnpay_tmn_code
VNPAY_HASH_SECRET=your_vnpay_hash_secret
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=http://localhost:3000/payment/vnpay-callback

# Firebase Configuration (Push Notifications)
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY=your_firebase_private_key
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com

# Server Configuration
PORT=3001
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# Email Configuration (Optional - for password reset)
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_gmail_app_password

# Socket.io (Optional - default values work)
SOCKET_CORS_ORIGIN=http://localhost:3000
```

### Mobile Environment Configuration

Create `mobile/lib/config/env.dart`:

```dart
class Environment {
  static const String apiBaseUrl = 'http://localhost:3001';
  static const String socketUrl = 'http://localhost:3001';
  static const String cloudinaryBaseUrl = 'https://res.cloudinary.com';
}
```

For production, update to your deployed backend URL.

---

## 🧪 Testing

### Concurrent Booking Test

Test the BookingIntent system to ensure no overbooking:

```bash
cd server
npm run test:concurrent
```

This simulates 5+ users trying to book the same listing simultaneously.

### Manual Testing Scenarios

**Test PROCESS 1: Entire Place**

```bash
# 1. User A creates booking intent
# 2. User B tries to book same listing → Should be blocked
# 3. User A completes payment → Booking confirmed
# 4. User B can now retry
```

**Test PROCESS 2: Room Rental**

```bash
# 1. Tenant submits rental request
# 2. Host approves request
# 3. Both sign digital agreement
# 4. Tenant confirms move-in
```

**Test PROCESS 3: Roommate**

```bash
# 1. User A creates post (Seeker)
# 2. User B sends request
# 3. User A accepts → Match created
# 4. Chat enabled between users
```

---

## 🚀 Deployment

> **📖 For detailed deployment guide, see [DEPLOYMENT.md](./DEPLOYMENT.md)**

### Quick Overview

| Component  | Platform                                                    | Status      | Auto-Deploy       |
|------------|-------------------------------------------------------------|-------------|-------------------|
| **Server** | [Render.com](https://rental-home-project-qssf.onrender.com) | ✅ Live      | Yes (main branch) |
| **Client** | [Surge.sh](https://rental-home-iamdazk.surge.sh)            | ✅ Live      | Manual            |
| **Mobile** | -                                                           | Development | N/A               |

### Server (Render.com)

```bash
# Auto-deploy on push to main branch
git push origin main
# ✅ Render will auto-deploy!

# Check deployment config
cd server
make deploy-info
make render-check
```

### Client (Surge.sh)

```bash
cd client

# Deploy to production
make deploy

# Or manual:
npm run build
npm run deploy
```

### Mobile Deployment

**Android:**

```bash
cd mobile
flutter build apk --release
# APK: build/app/outputs/flutter-apk/app-release.apk
```

**iOS:**

```bash
cd mobile
flutter build ios --release
# Upload to App Store via Xcode
```

### Database (MongoDB Atlas)

1. Create cluster at https://cloud.mongodb.com
2. Create database user
3. Whitelist IP addresses (0.0.0.0/0 for testing)
4. Get connection string
5. Update `MONGO_URL` in environment variables

---

## 📚 Documentation

Comprehensive documentation is available in the `docs/` folder:

- **[BUSINESS_ANALYSIS.md](docs/BUSINESS_ANALYSIS.md)** - Detailed business logic and rules
- **[USE_CASES_CURRENT.md](docs/USE_CASES_CURRENT.md)** - All use cases with pre/post conditions
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Detailed deployment guide for all platforms
- **[DEPLOYMENT_QUICK_REFERENCE.md](DEPLOYMENT_QUICK_REFERENCE.md)** - Quick deployment reference

---

## 🎯 Key Design Decisions

### 1. BookingIntent System

**Problem:** Multiple users booking the same listing simultaneously causes overbooking.

**Solution:** Temporary reservation locks with expiration (10 minutes).

```javascript
// User A creates BookingIntent → Listing locked
// User B tries to book → Rejected (409 Conflict)
// User A completes payment → Booking confirmed
// OR User A times out → Lock released → User B can retry
```

### 2. Process Separation

Each rental process (Entire Place, Room, Roommate) has:

- ✅ Separate API routes
- ✅ Separate data models
- ✅ Separate state machines
- ✅ No cross-contamination

### 3. Identity Verification

Required for shared living (Room Rental & Roommate):

- Upload front/back of ID card
- Admin approval required
- Status: Pending → Approved → Rejected
- Cannot post without approval

### 4. Payment Flexibility

Three payment options for Entire Place:

1. **VNPay Full (100%)** - Auto-approve after payment
2. **VNPay Deposit (30%)** - Pay remaining before check-in
3. **Cash** - Pay at check-in (host approval required)

---

## 🛡️ Security Features

- **JWT Authentication** with httpOnly cookies (optional)
- **Password hashing** with bcrypt (12 salt rounds)
- **File upload validation** (type, size, malware check)
- **Rate limiting** on auth endpoints
- **CORS protection** with whitelist
- **Input sanitization** to prevent injection
- **Environment variable protection** (no secrets in code)
- **Admin-only routes** with middleware
- **Socket.io authentication** required for chat

---

## 📱 Mobile-Specific Features

### 🎨 User Experience

- **Dark Mode / Light Mode** - Theme switcher with system preference support
- **Responsive UI** - Optimized for all screen sizes
- **Smooth animations** - Native animations for better UX
- **Offline mode** - View cached listings without internet

### 📅 Host Features

- **Calendar Management** - Visual calendar for hosts to manage bookings
    - Month/year navigation
    - Color-coded booking status
    - Booking details on date selection
    - Check-in/check-out tracking
    - Guest information display

### 🔔 Notifications

- **Push Notifications** - Firebase Cloud Messaging (FCM) integration
    - Booking updates (new, approved, cancelled)
    - Payment reminders
    - Message notifications
    - Real-time alerts
- **In-app Notifications** - Notification center with read/unread status

### 📸 Media & Camera

- **Native camera integration** - ID card and property photo upload
- **Image picker** - Gallery and camera selection
- **Image compression** - Optimize before upload

### 🔐 Security & Auth

- **Biometric authentication** - Fingerprint/Face ID support (planned)
- **Secure storage** - Flutter Secure Storage for tokens
- **Auto logout** - Session timeout handling

### 🌍 Location Services

- **Location services** - Nearby listings with GPS
- **Map integration** - Google Maps for property locations
- **Location picker** - Select property location on map

### 💬 Real-time Features

- **Socket.io chat** - Real-time messaging
- **Typing indicators** - See when others are typing (planned)
- **Online status** - User presence detection (planned)

### 🔗 Deep Linking

- **Payment callbacks** - Handle VNPay return URLs
- **Share listings** - Deep links to specific properties
- **Email verification** - Email link handling

---

## 🐛 Troubleshooting

### Common Issues

**1. MongoDB Connection Failed**

```bash
# Check connection string format
MONGO_URL=mongodb+srv://user:password@cluster.mongodb.net/dbname

# Whitelist IP in MongoDB Atlas
# Verify network access settings
```

**2. Cloudinary Upload Error**

```bash
# Verify credentials
CLOUDINARY_CLOUD_NAME=xxxxx
CLOUDINARY_API_KEY=xxxxx
CLOUDINARY_API_SECRET=xxxxx

# Check file size limit (default 5MB)
```

**3. VNPay Payment Fails**

```bash
# Use sandbox credentials for testing
# Check return URL matches exactly
# Verify hash secret is correct
```

**4. Socket.io Not Connecting**

```bash
# Check CORS settings
# Verify Socket.io version compatibility
# Check firewall rules
```

**5. Mobile Build Errors**

```bash
# Flutter
flutter clean
flutter pub get
flutter doctor

# iOS
cd ios && pod install

# Android
flutter build apk --debug
```

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

### Code Standards

- **ESLint** for JavaScript
- **Prettier** for code formatting
- **Conventional Commits** for commit messages
- **JSDoc** for function documentation

---

## 📝 License

This project is licensed under the **ISC License**.

---

## 👨‍💻 Authors

**Development Team**

- Lead Developer: [@iamdazkdev](https://github.com/iamdazkdev)
- Project: [Rental-Home-Project](https://github.com/iamdazkdev/Rental-Home-Project)

---

## 🙏 Acknowledgments

- **React.js** community for excellent documentation
- **Flutter** team for cross-platform framework
- **MongoDB** for flexible database solutions
- **VNPay** for payment gateway integration
- **Cloudinary** for image hosting
- **Socket.io** for real-time communication

---

## 📞 Support

For support, email anhaaa2305@gmail.com or join our Discord channel.

---

<div align="center">

**Built with ❤️ using React, Flutter & Node.js**

[⬆ Back to Top](#-rental-home-platform)

</div>
