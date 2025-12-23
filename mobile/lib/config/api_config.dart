class ApiConfig {
  // Base URL - Change this for production
  static const String baseUrl = 'http://localhost:3001';

  // API Endpoints
  static const String auth = '/auth';
  static const String register = '/auth/register';
  static const String login = '/auth/login';
  static const String forgotPassword = '/auth/forgot-password';
  static const String resetPassword = '/auth/reset-password';

  static const String listings = '/listings';
  static const String search = '/search';
  static const String listingDetails = '/listings';

  static const String bookings = '/bookings';
  static const String trips = '/users/trips';
  static const String reservations = '/users/reservations';

  static const String wishlist = '/users/wishlist';
  static const String addToWishlist = '/users/wishlist';

  static const String messages = '/messages';
  static const String conversations = '/messages/conversations';
  static const String unreadMessages = '/messages/unread';

  static const String notifications = '/notifications';
  static const String markNotificationRead = '/notifications/mark-read';

  static const String hostProfile = '/host';
  static const String hostReviews = '/host-reviews/host';

  static const String reviews = '/reviews';
  static const String listingReviews = '/reviews/listing';

  static const String propertyManagement = '/property-management';

  static const String user = '/users';
  static const String updateProfile = '/users/profile';

  // WebSocket
  static const String socketUrl = 'http://localhost:3001';

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

