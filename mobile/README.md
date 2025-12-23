# Rental Home Mobile App

Flutter mobile application for the Rental Home platform - A property booking and rental management system.

## Features

### ✅ Completed Features

#### Authentication
- User registration with profile image
- Email/password login
- Password reset functionality
- Secure token storage
- Auto-login on app restart

#### Home & Listings
- Browse listings by category
- Grid view of properties
- Category filter (Beachfront, Cabins, Trending, etc.)
- Listing cards with images and pricing
- Pull to refresh

#### User Profile
- View profile information
- Display user statistics (properties, wishlist, trips)
- Logout functionality

#### Navigation
- Bottom navigation bar with 5 tabs:
  - Home: Browse all listings
  - Explore: Search and filter
  - Trips: View bookings
  - Messages: Chat with hosts/guests
  - Profile: User account

### 🚧 Features to Implement

1. **Listing Details**
   - Full property information
   - Photo gallery with zoom
   - Amenities list
   - Host profile preview
   - Reviews and ratings
   - Booking interface

2. **Search & Filter**
   - Advanced search filters
   - Map view integration
   - Price range slider
   - Guest/bedroom/bathroom filters
   - Amenities filter

3. **Bookings**
   - Create booking request
   - View trip list (upcoming/past)
   - Booking status tracking
   - Check-in/check-out dates
   - Early checkout option
   - Extend stay request

4. **Host Features**
   - Create/edit listings
   - Upload property photos
   - Manage bookings (approve/reject)
   - View reservation requests
   - Extension request management
   - Property visibility toggle

5. **Reviews**
   - Submit property reviews
   - Submit host reviews
   - Quick review suggestions
   - View listing reviews
   - Host rating display

6. **Messages**
   - Real-time chat with Socket.IO
   - Conversation list
   - Unread message count
   - Contact host from listing
   - Message notifications

7. **Notifications**
   - Push notifications
   - In-app notification center
   - Booking status updates
   - Message alerts
   - Extension requests

8. **Wishlist**
   - Add/remove from wishlist
   - Wishlist screen
   - Heart icon on listings

9. **Property Management**
   - Host's property list
   - Edit property details
   - Hide/show listings
   - Delete properties
   - View booking calendar

10. **Shared Room Features**
    - Host profile form (habits, personality)
    - Display host information
    - Compatibility matching
    - Monthly/daily pricing toggle

## Setup Instructions

### Prerequisites
- Flutter SDK (>=3.0.0)
- Dart SDK
- Android Studio / Xcode
- Backend server running on `http://localhost:3001`

### Installation

1. Clone the repository
2. Navigate to mobile directory:
```bash
cd mobile
```

3. Install dependencies:
```bash
flutter pub get
```

4. Configure API endpoint in `lib/config/api_config.dart`:
```dart
static const String baseUrl = 'http://YOUR_IP:3001'; // Change for device testing
```

5. Run the app:
```bash
# For Android
flutter run

# For iOS
flutter run -d ios

# For specific device
flutter devices
flutter run -d <device_id>
```

## Configuration

### API Configuration
Edit `lib/config/api_config.dart` to update:
- Base URL
- API endpoints
- Socket URL

### Theme Customization
Edit `lib/config/app_theme.dart` to customize:
- Primary colors
- Text styles
- Component themes

### Constants
Edit `lib/config/app_constants.dart` to update:
- Categories
- Amenities
- App settings

## Project Structure

```
lib/
├── config/              # App configuration
│   ├── api_config.dart
│   ├── app_theme.dart
│   └── app_constants.dart
├── models/              # Data models
│   ├── user.dart
│   ├── listing.dart
│   ├── booking.dart
│   ├── review.dart
│   ├── message.dart
│   └── notification.dart
├── services/            # API services
│   ├── auth_service.dart
│   ├── listing_service.dart
│   └── storage_service.dart
├── providers/           # State management
│   └── auth_provider.dart
├── screens/             # UI screens
│   ├── auth/
│   ├── home/
│   ├── explore/
│   ├── trips/
│   ├── messages/
│   └── profile/
└── main.dart           # Entry point
```

## Technologies Used

- **Framework**: Flutter 3.x
- **State Management**: Provider
- **HTTP Client**: http, dio
- **Local Storage**: shared_preferences, flutter_secure_storage
- **Image Handling**: image_picker, cached_network_image
- **Real-time**: socket_io_client
- **Maps**: google_maps_flutter, geolocator
- **UI Components**: google_fonts, shimmer, carousel_slider

## Testing

### Run Tests
```bash
flutter test
```

### Run on Device/Emulator
```bash
# List devices
flutter devices

# Run on specific device
flutter run -d <device_id>

# Run in release mode
flutter run --release
```

## Build for Production

### Android
```bash
flutter build apk --release
# Or
flutter build appbundle --release
```

### iOS
```bash
flutter build ios --release
```

## Troubleshooting

### Common Issues

1. **Network Error on Device**
   - Update `baseUrl` in `api_config.dart` to use your computer's IP instead of `localhost`
   - Ensure device and computer are on same network

2. **Image Not Loading**
   - Check network permissions in AndroidManifest.xml / Info.plist
   - Verify image URLs are accessible

3. **Build Errors**
   - Run `flutter clean` then `flutter pub get`
   - Check Flutter and Dart SDK versions

## Next Steps

To complete the mobile app:

1. Implement listing details screen with full information
2. Add search and filter functionality
3. Create booking flow with date picker
4. Implement real-time messaging with Socket.IO
5. Add notifications system
6. Create property management for hosts
7. Implement reviews and ratings
8. Add wishlist functionality
9. Create booking history screens
10. Add image upload for creating listings

## Support

For issues or questions, please contact the development team.

## License

This project is part of the Rental Home platform.

