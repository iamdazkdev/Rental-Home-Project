import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';

import '../services/fcm_service.dart';
import '../services/notification_service.dart';
import '../services/storage_service.dart';

/// Notification Provider
/// Manages FCM notifications and integrates with app state
class NotificationProvider with ChangeNotifier {
  final FCMService _fcmService = FCMService();
  final NotificationService _notificationService = NotificationService();
  final StorageService _storage = StorageService();

  String? _fcmToken;
  List<Map<String, dynamic>> _notifications = [];
  int _unreadCount = 0;
  bool _isLoading = false;

  String? get fcmToken => _fcmToken;

  List<Map<String, dynamic>> get notifications => _notifications;

  int get unreadCount => _unreadCount;

  bool get isLoading => _isLoading;

  /// Initialize notifications
  Future<void> initialize() async {
    // Get FCM token
    _fcmToken = _fcmService.fcmToken;
    notifyListeners();

    // Setup message handlers
    _fcmService.onMessageReceived = _onMessageReceived;
    _fcmService.onMessageOpenedApp = _onMessageOpenedApp;
    _fcmService.onTokenRefresh = _onTokenRefresh;

    // Fetch notifications from server
    await fetchNotifications();

    // Send token to server
    if (_fcmToken != null) {
      await _sendTokenToServer(_fcmToken!);
    }
  }

  /// Fetch notifications from server
  Future<void> fetchNotifications() async {
    _isLoading = true;
    notifyListeners();

    try {
      final result = await _notificationService.getUserNotifications();

      if (result['success']) {
        _notifications = (result['notifications'] as List)
            .map((n) => {
                  'id': n['_id'] ?? n['id'],
                  'title': n['title'] ?? 'Notification',
                  'body': n['message'] ?? n['body'] ?? '',
                  'data': n['data'] ?? {},
                  'timestamp':
                      n['createdAt'] ?? DateTime.now().toIso8601String(),
                  'isRead': n['isRead'] ?? false,
                  'type': n['type'] ?? 'general',
                })
            .toList();

        _unreadCount = result['unreadCount'] ?? 0;

        debugPrint(
            '✅ Loaded ${_notifications.length} notifications from server');
      } else {
        debugPrint('❌ Failed to fetch notifications: ${result['message']}');
      }
    } catch (e) {
      debugPrint('❌ Error fetching notifications: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
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

  /// Mark notification as read
  Future<void> markAsRead(String notificationId) async {
    final index = _notifications.indexWhere((n) => n['id'] == notificationId);
    if (index != -1 && _notifications[index]['isRead'] == false) {
      // Update locally first
      _notifications[index]['isRead'] = true;
      _unreadCount--;
      notifyListeners();

      // Sync with server
      await _notificationService.markAsRead(notificationId);
    }
  }

  /// Mark all notifications as read
  Future<void> markAllAsRead() async {
    // Update locally first
    for (var notification in _notifications) {
      notification['isRead'] = true;
    }
    _unreadCount = 0;
    notifyListeners();

    // Sync with server
    await _notificationService.markAllAsRead();
  }

  /// Clear all notifications
  Future<void> clearAll() async {
    // Clear locally
    _notifications.clear();
    _unreadCount = 0;
    notifyListeners();

    // Delete from server
    await _notificationService.deleteAllNotifications();
  }

  /// Delete single notification
  Future<void> deleteNotification(String notificationId) async {
    final index = _notifications.indexWhere((n) => n['id'] == notificationId);
    if (index != -1) {
      final wasUnread = _notifications[index]['isRead'] == false;

      // Remove locally
      _notifications.removeAt(index);
      if (wasUnread) _unreadCount--;
      notifyListeners();

      // Delete from server
      await _notificationService.deleteNotification(notificationId);
    }
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
