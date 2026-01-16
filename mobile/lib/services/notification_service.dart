import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

import '../config/api_config.dart';
import 'storage_service.dart';

/// Notification Service
/// Handles fetching and managing notifications from server
class NotificationService {
  final StorageService _storage = StorageService();

  /// Fetch user notifications from server
  Future<Map<String, dynamic>> getUserNotifications({
    bool unreadOnly = false,
  }) async {
    try {
      final userId = await _storage.getUserId();
      if (userId == null) {
        throw Exception('User not logged in');
      }

      final url = Uri.parse(
        '${ApiConfig.baseUrl}/notifications/$userId${unreadOnly ? '?unreadOnly=true' : ''}',
      );

      debugPrint('📡 Fetching notifications from: $url');

      final response = await http.get(
        url,
        headers: {'Content-Type': 'application/json'},
      );

      debugPrint('📥 Notifications response status: ${response.statusCode}');

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        debugPrint(
            '✅ Fetched ${data['notifications']?.length ?? 0} notifications');
        return {
          'success': true,
          'notifications': data['notifications'] ?? [],
          'unreadCount': data['unreadCount'] ?? 0,
        };
      } else {
        debugPrint('❌ Failed to fetch notifications: ${response.body}');
        return {
          'success': false,
          'message': 'Failed to fetch notifications',
          'notifications': [],
          'unreadCount': 0,
        };
      }
    } catch (e) {
      debugPrint('❌ Error fetching notifications: $e');
      return {
        'success': false,
        'message': e.toString(),
        'notifications': [],
        'unreadCount': 0,
      };
    }
  }

  /// Mark notification as read
  Future<bool> markAsRead(String notificationId) async {
    try {
      final url = Uri.parse(
        '${ApiConfig.baseUrl}/notifications/$notificationId/read',
      );

      debugPrint('📡 Marking notification as read: $notificationId');

      final response = await http.patch(
        url,
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        debugPrint('✅ Notification marked as read');
        return true;
      } else {
        debugPrint('❌ Failed to mark notification as read: ${response.body}');
        return false;
      }
    } catch (e) {
      debugPrint('❌ Error marking notification as read: $e');
      return false;
    }
  }

  /// Mark all notifications as read
  Future<bool> markAllAsRead() async {
    try {
      final userId = await _storage.getUserId();
      if (userId == null) {
        throw Exception('User not logged in');
      }

      final url = Uri.parse(
        '${ApiConfig.baseUrl}/notifications/user/$userId/read-all',
      );

      debugPrint('📡 Marking all notifications as read for user: $userId');

      final response = await http.patch(
        url,
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        debugPrint('✅ All notifications marked as read');
        return true;
      } else {
        debugPrint(
            '❌ Failed to mark all notifications as read: ${response.body}');
        return false;
      }
    } catch (e) {
      debugPrint('❌ Error marking all notifications as read: $e');
      return false;
    }
  }

  /// Delete notification
  Future<bool> deleteNotification(String notificationId) async {
    try {
      final url = Uri.parse(
        '${ApiConfig.baseUrl}/notifications/$notificationId',
      );

      debugPrint('📡 Deleting notification: $notificationId');

      final response = await http.delete(
        url,
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        debugPrint('✅ Notification deleted');
        return true;
      } else {
        debugPrint('❌ Failed to delete notification: ${response.body}');
        return false;
      }
    } catch (e) {
      debugPrint('❌ Error deleting notification: $e');
      return false;
    }
  }

  /// Delete all notifications
  Future<bool> deleteAllNotifications() async {
    try {
      final userId = await _storage.getUserId();
      if (userId == null) {
        throw Exception('User not logged in');
      }

      final url = Uri.parse(
        '${ApiConfig.baseUrl}/notifications/user/$userId',
      );

      debugPrint('📡 Deleting all notifications for user: $userId');

      final response = await http.delete(
        url,
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        debugPrint('✅ All notifications deleted');
        return true;
      } else {
        debugPrint('❌ Failed to delete all notifications: ${response.body}');
        return false;
      }
    } catch (e) {
      debugPrint('❌ Error deleting all notifications: $e');
      return false;
    }
  }
}
