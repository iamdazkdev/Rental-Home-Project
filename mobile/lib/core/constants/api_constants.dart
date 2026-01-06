class ApiConstants {
  // For Android Emulator use: 10.0.2.2
  // For iOS Simulator use: 127.0.0.1 or your machine IP
  // For Real Device use: Your machine's local IP (e.g., 192.168.1.x)
  // To find your IP: Run `ipconfig getifaddr en0` on macOS or `ipconfig` on Windows

  static const bool isProduction = false;

  // Development URLs
  static const String _devBaseUrl = 'http://10.0.2.2:3001'; // Android Emulator
  static const String _devBaseUrlIOS = 'http://127.0.0.1:3001'; // iOS Simulator

  // ⚠️ UPDATE THIS WITH YOUR MACHINE'S IP ADDRESS
  // Run: ipconfig getifaddr en0 (macOS) or ipconfig (Windows)
  static const String _devBaseUrlDevice = 'http://192.168.1.180:3001'; // Real device

  // Production URL
  static const String _prodBaseUrl = 'https://api.yourapp.com';

  // Auto-detect platform and return appropriate URL
  static String get baseUrl {
    if (isProduction) return _prodBaseUrl;
    // Using device URL for real device testing
    return _devBaseUrlDevice;
  }

  // Auth endpoints
  static String get loginUrl => '$baseUrl/auth/login';
  static String get registerUrl => '$baseUrl/auth/register';
  static String get refreshTokenUrl => '$baseUrl/auth/refresh';
  static String get logoutUrl => '$baseUrl/auth/logout';

  // Booking endpoints
  static String get bookingsUrl => '$baseUrl/bookings';
  static String bookingByIdUrl(String id) => '$baseUrl/bookings/$id';
  static String get bookingIntentUrl => '$baseUrl/bookings/intent';
  static String bookingIntentConfirmUrl(String intentId) => '$baseUrl/bookings/intent/$intentId/confirm';
  static String bookingIntentCancelUrl(String intentId) => '$baseUrl/bookings/intent/$intentId/cancel';

  // Payment endpoints
  static String get paymentsUrl => '$baseUrl/payments';
  static String paymentByIdUrl(String id) => '$baseUrl/payments/$id';
  static String paymentCallbackUrl(String provider) => '$baseUrl/payments/callback/$provider';

  // Listing endpoints
  static String get listingsUrl => '$baseUrl/listings';
  static String listingByIdUrl(String id) => '$baseUrl/listings/$id';

  // Agreement endpoints
  static String get agreementsUrl => '$baseUrl/agreements';
  static String agreementByIdUrl(String id) => '$baseUrl/agreements/$id';
  static String agreementSignUrl(String id) => '$baseUrl/agreements/$id/sign';
}


