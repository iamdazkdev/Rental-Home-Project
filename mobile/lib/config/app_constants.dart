class AppConstants {
  // App Info
  static const String appName = 'Rental Home';
  static const String appVersion = '1.0.0';

  // Categories
  static const List<String> categories = [
    'All',
    'Beachfront',
    'Cabins',
    'Trending',
    'Countryside',
    'Pools',
    'Islands',
    'Lake',
    'Skiing',
    'Castles',
    'Caves',
    'Camping',
    'Arctic',
    'Desert',
    'Barns',
    'Lux',
    'Modern',
  ];

  // Property Types
  static const List<String> propertyTypes = [
    'An entire place',
    'Room(s)',
    'A Shared Room',
  ];

  // Amenities
  static const List<String> amenities = [
    'Wifi',
    'Kitchen',
    'Washer',
    'Dryer',
    'Air Conditioning',
    'Heating',
    'Dedicated Workspace',
    'TV',
    'Hair Dryer',
    'Iron',
    'Pool',
    'Hot Tub',
    'Free Parking',
    'EV Charger',
    'Crib',
    'Gym',
    'BBQ Grill',
    'Breakfast',
    'Indoor Fireplace',
    'Smoking Allowed',
    'Beachfront',
    'Waterfront',
    'Ski-in/Ski-out',
  ];

  // Booking Status
  static const String bookingPending = 'pending';
  static const String bookingApproved = 'approved';
  static const String bookingRejected = 'rejected';
  static const String bookingCancelled = 'cancelled';
  static const String bookingCompleted = 'completed';
  static const String bookingCheckedOut = 'checkedOut';

  // Notification Types
  static const String notificationBookingRequest = 'booking_request';
  static const String notificationBookingApproved = 'booking_approved';
  static const String notificationBookingRejected = 'booking_rejected';
  static const String notificationBookingCancelled = 'booking_cancelled';
  static const String notificationCheckoutReminder = 'checkout_reminder';
  static const String notificationReviewRequest = 'review_request';
  static const String notificationNewMessage = 'new_message';
  static const String notificationExtensionRequest = 'extension_request';
  static const String notificationExtensionApproved = 'extension_approved';
  static const String notificationExtensionRejected = 'extension_rejected';

  // Storage Keys
  static const String keyToken = 'auth_token';
  static const String keyUser = 'user_data';
  static const String keyOnboarding = 'onboarding_completed';
  static const String keyThemeMode = 'theme_mode';

  // Validation
  static const int minPasswordLength = 6;
  static const int maxNameLength = 50;
  static const int maxDescriptionLength = 1000;

  // Pagination
  static const int itemsPerPage = 20;

  // Map
  static const double defaultLatitude = 10.762622; // Ho Chi Minh City
  static const double defaultLongitude = 106.660172;
  static const double defaultZoom = 14.0;

  // Date Format
  static const String dateFormat = 'dd/MM/yyyy';
  static const String dateTimeFormat = 'dd/MM/yyyy HH:mm';
  static const String timeFormat = 'HH:mm';

  // Quick Review Suggestions
  static const List<String> homeReviewSuggestions = [
    'Clean and comfortable',
    'Great location',
    'Spacious and well-equipped',
    'Peaceful neighborhood',
    'Beautiful view',
    'Modern amenities',
    'Well-maintained property',
    'Exceeded expectations',
  ];

  static const List<String> hostReviewSuggestions = [
    'Very responsive',
    'Friendly and welcoming',
    'Helpful with recommendations',
    'Great communication',
    'Respectful of privacy',
    'Professional host',
    'Quick to resolve issues',
    'Made us feel at home',
  ];

  // Extension Fee Multiplier
  static const double extensionFeeMultiplier = 1.3; // 30% increase

  // Living Habits
  static const List<String> sleepSchedules = [
    'Early bird (before 10 PM)',
    'Normal (10 PM - 12 AM)',
    'Night owl (after 12 AM)',
  ];

  static const List<String> cleanlinessLevels = [
    'Very clean',
    'Moderately clean',
    'Relaxed about cleaning',
  ];

  static const List<String> personalityTypes = [
    'Introverted',
    'Balanced',
    'Extroverted',
  ];

  static const List<String> noiseLevels = [
    'Very quiet',
    'Moderate noise',
    'Lively/social',
  ];

  // Price Type
  static const String priceTypeDaily = 'daily';
  static const String priceTypeMonthly = 'monthly';

  // Days in Month
  static const int daysInMonth = 30;
}

