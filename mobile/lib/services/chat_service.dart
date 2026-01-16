import 'dart:convert';

import 'package:flutter/cupertino.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;

import '../config/api_config.dart';
import '../models/conversation.dart';
import '../models/message.dart';

class ChatService {
  final String baseUrl = ApiConfig.baseUrl;
  final _storage = const FlutterSecureStorage();

  // Get authorization header
  Future<Map<String, String>> _getHeaders() async {
    final token = await _storage.read(key: 'auth_token');
    debugPrint(
        '🔑 Auth token: ${token != null ? "Present (${token.substring(0, 20)}...)" : "Missing"}');
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  // ==================== CONVERSATIONS ====================

  /// Fetch all conversations for a user
  Future<List<Conversation>> getConversations(String userId) async {
    try {
      debugPrint('📞 Fetching conversations for user: $userId');

      final response = await http.get(
        Uri.parse('$baseUrl/messages/conversations/$userId'),
        headers: await _getHeaders(),
      );

      debugPrint('📥 Conversations response status: ${response.statusCode}');

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final conversations = (data['conversations'] as List)
            .map((json) => Conversation.fromJson(json))
            .toList();

        debugPrint('✅ Fetched ${conversations.length} conversations');
        return conversations;
      } else {
        debugPrint('❌ Failed to fetch conversations: ${response.body}');
        throw Exception('Failed to load conversations');
      }
    } catch (e) {
      debugPrint('❌ Error fetching conversations: $e');
      rethrow;
    }
  }

  /// Get or create a conversation
  Future<Conversation> getOrCreateConversation({
    required String currentUserId,
    required String otherUserId,
    String? listingId,
  }) async {
    try {
      debugPrint(
          '🔄 Getting/creating conversation: $currentUserId <-> $otherUserId');

      final response = await http.post(
        Uri.parse('$baseUrl/messages/conversation'),
        headers: await _getHeaders(),
        body: json.encode({
          'senderId': currentUserId,
          'receiverId': otherUserId,
          if (listingId != null) 'listingId': listingId,
        }),
      );

      debugPrint('📥 Get/create conversation response: ${response.statusCode}');

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = json.decode(response.body);
        final conversation = Conversation.fromJson(data['conversation']);
        debugPrint('✅ Got conversation: ${conversation.conversationId}');
        return conversation;
      } else {
        debugPrint('❌ Failed to get/create conversation: ${response.body}');
        throw Exception('Failed to create conversation');
      }
    } catch (e) {
      debugPrint('❌ Error getting/creating conversation: $e');
      rethrow;
    }
  }

  // ==================== MESSAGES ====================

  /// Fetch messages for a conversation
  Future<List<Message>> getMessages(String conversationId) async {
    try {
      debugPrint('📨 Fetching messages for conversation: $conversationId');

      final response = await http.get(
        Uri.parse('$baseUrl/messages/$conversationId'),
        headers: await _getHeaders(),
      );

      debugPrint('📥 Messages response status: ${response.statusCode}');

      if (response.statusCode == 200) {
        final data = json.decode(response.body);

        // Backend returns messages directly as an array
        List<Message> messages;
        if (data is List) {
          messages = data.map((json) => Message.fromJson(json)).toList();
        } else if (data is Map && data.containsKey('messages')) {
          messages = (data['messages'] as List)
              .map((json) => Message.fromJson(json))
              .toList();
        } else {
          messages = [];
        }

        debugPrint('✅ Fetched ${messages.length} messages');
        return messages;
      } else {
        debugPrint('❌ Failed to fetch messages: ${response.body}');
        throw Exception('Failed to load messages');
      }
    } catch (e) {
      debugPrint('❌ Error fetching messages: $e');
      rethrow;
    }
  }

  /// Send a message
  Future<Message> sendMessage({
    required String conversationId,
    required String senderId,
    required String receiverId,
    required String text,
    String? listingId,
  }) async {
    try {
      debugPrint('📤 Sending message from $senderId to $receiverId');

      final requestBody = {
        'senderId': senderId,
        'receiverId': receiverId,
        'message': text,
        'messageType': 'text',
        if (listingId != null && listingId.isNotEmpty) 'listingId': listingId,
      };

      debugPrint('📡 Request URL: $baseUrl/messages/messages');
      debugPrint('📦 Request body: ${json.encode(requestBody)}');

      final response = await http.post(
        Uri.parse('$baseUrl/messages/messages'),
        headers: await _getHeaders(),
        body: json.encode(requestBody),
      );

      debugPrint('📥 Send message response: ${response.statusCode}');
      debugPrint('📄 Response body: ${response.body}');

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = json.decode(response.body);
        final message = Message.fromJson(data['message']);
        debugPrint('✅ Message sent successfully');
        return message;
      } else {
        debugPrint('❌ Failed to send message: ${response.body}');
        throw Exception(
            'Failed to send message: ${response.statusCode} - ${response.body}');
      }
    } catch (e) {
      debugPrint('❌ Error sending message: $e');
      rethrow;
    }
  }

  /// Mark messages as read
  Future<void> markAsRead(String conversationId, String userId) async {
    try {
      debugPrint('✅ Marking messages as read: $conversationId');

      final response = await http.patch(
        Uri.parse('$baseUrl/messages/$conversationId/read'),
        headers: await _getHeaders(),
        body: json.encode({'userId': userId}),
      );

      if (response.statusCode == 200) {
        debugPrint('✅ Messages marked as read');
      } else {
        debugPrint('⚠️ Failed to mark as read: ${response.body}');
      }
    } catch (e) {
      debugPrint('❌ Error marking as read: $e');
    }
  }

  /// Get unread count for user
  Future<int> getUnreadCount(String userId) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/messages/unread-count/$userId'),
        headers: await _getHeaders(),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['unreadCount'] ?? 0;
      } else {
        return 0;
      }
    } catch (e) {
      debugPrint('❌ Error fetching unread count: $e');
      return 0;
    }
  }

  // ==================== SOCKET.IO HELPERS ====================

  /// Format message for Socket.IO emission
  Map<String, dynamic> formatMessageForSocket(Message message) {
    return {
      'conversationId': message.conversationId,
      'senderId': message.senderId,
      'receiverId': message.receiverId,
      'text': message.text,
      'createdAt': message.createdAt.toIso8601String(),
    };
  }

  /// Parse Socket.IO message
  Message parseSocketMessage(Map<String, dynamic> data) {
    return Message.fromJson(data);
  }
}
