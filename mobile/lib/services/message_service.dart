import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';
import '../models/conversation.dart';
import '../models/message.dart';
import 'storage_service.dart';

class MessageService {
  final StorageService _storageService = StorageService();

  // Get conversations for user
  Future<List<Conversation>> getConversations(String userId) async {
    try {
      final uri = Uri.parse('${ApiConfig.baseUrl}${ApiConfig.conversations}/$userId');

      debugPrint('📞 Fetching conversations for userId: $userId');
      debugPrint('📡 URL: $uri');

      final response = await http.get(uri, headers: ApiConfig.headers());

      debugPrint('📥 Response status: ${response.statusCode}');

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        debugPrint('✅ Conversations fetched: ${data.length}');
        return data.map((json) => Conversation.fromJson(json)).toList();
      }

      debugPrint('❌ Failed to fetch conversations: ${response.statusCode}');
      return [];
    } catch (e) {
      debugPrint('❌ Error fetching conversations: $e');
      return [];
    }
  }

  // Get messages for conversation
  Future<List<Message>> getMessages(String conversationId, String userId) async {
    try {
      final uri = Uri.parse(
        '${ApiConfig.baseUrl}${ApiConfig.messages}/messages/$conversationId?userId=$userId',
      );

      debugPrint('📨 Fetching messages for conversation: $conversationId');
      debugPrint('📡 URL: $uri');

      final response = await http.get(uri, headers: ApiConfig.headers());

      debugPrint('📥 Response status: ${response.statusCode}');

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        debugPrint('✅ Messages fetched: ${data.length}');
        return data.map((json) => Message.fromJson(json)).toList();
      }

      debugPrint('❌ Failed to fetch messages: ${response.statusCode}');
      return [];
    } catch (e) {
      debugPrint('❌ Error fetching messages: $e');
      return [];
    }
  }

  // Send message via HTTP (fallback if socket fails)
  Future<Map<String, dynamic>> sendMessage({
    required String conversationId,
    required String senderId,
    required String receiverId,
    required String message,
    String? listingId,
  }) async {
    try {
      final token = await _storageService.getToken();
      if (token == null) {
        return {'success': false, 'message': 'Not authenticated'};
      }

      final uri = Uri.parse('${ApiConfig.baseUrl}${ApiConfig.messages}/send');

      debugPrint('📤 Sending message via HTTP');

      final response = await http.post(
        uri,
        headers: ApiConfig.headers(token: token),
        body: json.encode({
          'conversationId': conversationId,
          'senderId': senderId,
          'receiverId': receiverId,
          'message': message,
          if (listingId != null) 'listingId': listingId,
        }),
      );

      debugPrint('📥 Send message response: ${response.statusCode}');

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = json.decode(response.body);
        return {
          'success': true,
          'message': data['message'],
          'conversationId': data['conversationId'],
        };
      } else {
        final error = json.decode(response.body);
        return {
          'success': false,
          'message': error['message'] ?? 'Failed to send message',
        };
      }
    } catch (e) {
      debugPrint('❌ Error sending message: $e');
      return {
        'success': false,
        'message': 'An error occurred while sending message',
      };
    }
  }

  // Mark messages as read
  Future<bool> markAsRead(String conversationId, String userId) async {
    try {
      final token = await _storageService.getToken();
      if (token == null) return false;

      final uri = Uri.parse(
        '${ApiConfig.baseUrl}${ApiConfig.messages}/mark-read/$conversationId',
      );

      final response = await http.patch(
        uri,
        headers: ApiConfig.headers(token: token),
        body: json.encode({'userId': userId}),
      );

      return response.statusCode == 200;
    } catch (e) {
      debugPrint('❌ Error marking as read: $e');
      return false;
    }
  }

  // Get unread count
  Future<int> getUnreadCount(String userId) async {
    try {
      final uri = Uri.parse('${ApiConfig.baseUrl}${ApiConfig.unreadMessages}/$userId');

      final response = await http.get(uri, headers: ApiConfig.headers());

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['unreadCount'] ?? 0;
      }

      return 0;
    } catch (e) {
      debugPrint('❌ Error fetching unread count: $e');
      return 0;
    }
  }
}

