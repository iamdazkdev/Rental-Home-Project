class AppConfig {
  // API Configuration
  static const String baseUrl = 'http://localhost:3001';
  static const String socketUrl = 'http://localhost:3001';

  // For production
  // static const String baseUrl = 'https://your-api.com';
  // static const String socketUrl = 'https://your-api.com';

  // API Endpoints
  static const String authEndpoint = '/auth';
  static const String listingEndpoint = '/properties';
  static const String bookingEndpoint = '/bookings';
  static const String messagesEndpoint = '/messages';
  static const String userEndpoint = '/user';
  static const String reviewsEndpoint = '/reviews';

  // App Configuration
  static const String appName = 'Rental Home';
  static const int itemsPerPage = 20;
  static const Duration requestTimeout = Duration(seconds: 30);

  // Storage Keys
  static const String tokenKey = 'auth_token';
  static const String userKey = 'user_data';
  static const String themeKey = 'theme_mode';

  // Socket Events
  static const String socketConnect = 'connect';
  static const String socketDisconnect = 'disconnect';
  static const String userOnline = 'user_online';
  static const String sendMessage = 'send_message';
  static const String receiveMessage = 'receive_message';
  static const String typing = 'typing';
  static const String userTyping = 'user_typing';
}

