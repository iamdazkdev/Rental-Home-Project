class ApiConfig {
  // Base URL - Production (Render)
  static String baseUrl = 'https://rental-home-project-qssf.onrender.com';

  // Development URLs (uncomment for local testing):
  // For iOS Simulator: use 'http://localhost:3001'
  // For Android Emulator: use 'http://10.0.2.2:3001'
  // For Physical Device: use your computer's IP, e.g., 'http://192.168.1.100:3001'
  // static String baseUrl = 'http://192.168.1.37:3001'; // Local development

  // API Endpoints
  static const String auth = '/auth';
  static const String register = '/auth/register';
  static const String login = '/auth/login';
  static const String forgotPassword = '/auth/forgot-password';
  static const String resetPassword = '/auth/reset-password';

  static const String listings = '/listing';
  static const String search = '/search';
  static const String listingDetails = '/listing';

  static const String bookings = '/booking';
  static const String trips = '/user';
  static const String reservations = '/user';

  static const String wishlist = '/user';
  static const String addToWishlist = '/user';

  static const String messages = '/messages';
  static const String conversations = '/messages/conversations';
  static const String unreadMessages = '/messages/unread';

  static const String notifications = '/notifications';
  static const String markNotificationRead = '/notifications';

  static const String hostProfile = '/host';
  static const String hostReviews = '/host-reviews/host';

  static const String reviews = '/reviews';
  static const String listingReviews = '/reviews/listing';

  static const String properties = '/properties';

  // WebSocket - Production (Render)
  static const String socketUrl =
      'https://rental-home-project-qssf.onrender.com';

  // Development WebSocket (uncomment for local testing):
  // static const String socketUrl = 'http://localhost:3001';
  // static const String socketUrl = 'http://192.168.1.37:3001'; // Your local IP

  // Headers
  static Map<String, String> headers({String? token}) {
    final Map<String, String> defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (token != null) {
      defaultHeaders['Authorization'] = 'Bearer $token';
    }

    return defaultHeaders;
  }

  // Multipart Headers
  static Map<String, String> multipartHeaders({String? token}) {
    final Map<String, String> defaultHeaders = {
      'Accept': 'application/json',
    };

    if (token != null) {
      defaultHeaders['Authorization'] = 'Bearer $token';
    }

    return defaultHeaders;
  }
}
