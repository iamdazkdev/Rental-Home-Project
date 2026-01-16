import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';

import '../services/fcm_service.dart';
import '../services/storage_service.dart';

/// Notification Provider
/// Manages FCM notifications and integrates with app state
class NotificationProvider with ChangeNotifier {
  final FCMService _fcmService = FCMService();
  final StorageService _storage = StorageService();

  String? _fcmToken;
  List<Map<String, dynamic>> _notifications = [];
  int _unreadCount = 0;

  String? get fcmToken => _fcmToken;

  List<Map<String, dynamic>> get notifications => _notifications;

  int get unreadCount => _unreadCount;

  /// Initialize notifications
  Future<void> initialize() async {
    // Get FCM token
    _fcmToken = _fcmService.fcmToken;
    notifyListeners();

    // Setup message handlers
    _fcmService.onMessageReceived = _onMessageReceived;
    _fcmService.onMessageOpenedApp = _onMessageOpenedApp;
    _fcmService.onTokenRefresh = _onTokenRefresh;

    // Load saved notifications
    await _loadNotifications();

    // Send token to server
    if (_fcmToken != null) {
      await _sendTokenToServer(_fcmToken!);
    }
  }

  /// Handle foreground message
  void _onMessageReceived(RemoteMessage message) {
    debugPrint('📨 Notification received in provider');

    // Add to local notifications list
    _notifications.insert(0, {
      'id': DateTime.now().millisecondsSinceEpoch.toString(),
      'title': message.notification?.title ?? 'New Notification',
      'body': message.notification?.body ?? '',
      'data': message.data,
      'timestamp': DateTime.now().toIso8601String(),
      'isRead': false,
    });

    _unreadCount++;
    notifyListeners();

    // Save to local storage
    _saveNotifications();
  }

  /// Handle message when app opened from notification
  void _onMessageOpenedApp(RemoteMessage message) {
    debugPrint('📱 App opened from notification in provider');

    // Mark notification as read if exists
    final index = _notifications.indexWhere(
      (n) => n['data']['id'] == message.data['id'],
    );

    if (index != -1 && _notifications[index]['isRead'] == false) {
      _notifications[index]['isRead'] = true;
      _unreadCount--;
      notifyListeners();
      _saveNotifications();
    }

    // Handle navigation will be done by FCM service
  }

  /// Handle token refresh
  void _onTokenRefresh(String newToken) {
    debugPrint('🔄 FCM Token refreshed in provider: $newToken');
    _fcmToken = newToken;
    notifyListeners();

    // Send new token to server
    _sendTokenToServer(newToken);
  }

  /// Send FCM token to server
  Future<void> _sendTokenToServer(String token) async {
    try {
      final userId = await _storage.getUserId();
      if (userId == null) {
        debugPrint('⚠️ No user ID, skipping token upload');
        return;
      }

      // TODO: Send token to your server
      // Example:
      // await http.post(
      //   Uri.parse('${ApiConfig.baseUrl}/users/$userId/fcm-token'),
      //   body: {'fcmToken': token},
      // );

      debugPrint('✅ FCM token sent to server: $token');
    } catch (e) {
      debugPrint('❌ Error sending token to server: $e');
    }
  }

  /// Load notifications from local storage
  Future<void> _loadNotifications() async {
    try {
      // Load from SharedPreferences or local database
      // For now, start with empty list
      _notifications = [];
      _unreadCount = 0;
      notifyListeners();
    } catch (e) {
      debugPrint('❌ Error loading notifications: $e');
    }
  }

  /// Save notifications to local storage
  Future<void> _saveNotifications() async {
    try {
      // Save to SharedPreferences or local database
      // Implement based on your storage strategy
    } catch (e) {
      debugPrint('❌ Error saving notifications: $e');
    }
  }

  /// Mark notification as read
  void markAsRead(String notificationId) {
    final index = _notifications.indexWhere((n) => n['id'] == notificationId);
    if (index != -1 && _notifications[index]['isRead'] == false) {
      _notifications[index]['isRead'] = true;
      _unreadCount--;
      notifyListeners();
      _saveNotifications();
    }
  }

  /// Mark all notifications as read
  void markAllAsRead() {
    for (var notification in _notifications) {
      notification['isRead'] = true;
    }
    _unreadCount = 0;
    notifyListeners();
    _saveNotifications();
  }

  /// Clear all notifications
  void clearAll() {
    _notifications.clear();
    _unreadCount = 0;
    notifyListeners();
    _saveNotifications();
  }

  /// Subscribe to topic
  Future<void> subscribeToTopic(String topic) async {
    await _fcmService.subscribeToTopic(topic);
  }

  /// Unsubscribe from topic
  Future<void> unsubscribeFromTopic(String topic) async {
    await _fcmService.unsubscribeFromTopic(topic);
  }

  /// Delete FCM token (on logout)
  Future<void> deleteToken() async {
    await _fcmService.deleteToken();
    _fcmToken = null;
    _notifications.clear();
    _unreadCount = 0;
    notifyListeners();
  }
}
