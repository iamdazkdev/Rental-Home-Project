import 'dart:convert';

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
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  // ==================== CONVERSATIONS ====================

  /// Fetch all conversations for a user
  Future<List<Conversation>> getConversations(String userId) async {
    try {
      print('📞 Fetching conversations for user: $userId');

      final response = await http.get(
        Uri.parse('$baseUrl/messages/conversations/$userId'),
        headers: await _getHeaders(),
      );

      print('📥 Conversations response status: ${response.statusCode}');

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final conversations = (data['conversations'] as List)
            .map((json) => Conversation.fromJson(json))
            .toList();

        print('✅ Fetched ${conversations.length} conversations');
        return conversations;
      } else {
        print('❌ Failed to fetch conversations: ${response.body}');
        throw Exception('Failed to load conversations');
      }
    } catch (e) {
      print('❌ Error fetching conversations: $e');
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
      print(
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

      print('📥 Get/create conversation response: ${response.statusCode}');

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = json.decode(response.body);
        final conversation = Conversation.fromJson(data['conversation']);
        print('✅ Got conversation: ${conversation.conversationId}');
        return conversation;
      } else {
        print('❌ Failed to get/create conversation: ${response.body}');
        throw Exception('Failed to create conversation');
      }
    } catch (e) {
      print('❌ Error getting/creating conversation: $e');
      rethrow;
    }
  }

  // ==================== MESSAGES ====================

  /// Fetch messages for a conversation
  Future<List<Message>> getMessages(String conversationId) async {
    try {
      print('📨 Fetching messages for conversation: $conversationId');

      final response = await http.get(
        Uri.parse('$baseUrl/messages/$conversationId'),
        headers: await _getHeaders(),
      );

      print('📥 Messages response status: ${response.statusCode}');

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

        print('✅ Fetched ${messages.length} messages');
        return messages;
      } else {
        print('❌ Failed to fetch messages: ${response.body}');
        throw Exception('Failed to load messages');
      }
    } catch (e) {
      print('❌ Error fetching messages: $e');
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
      print('📤 Sending message to conversation: $conversationId');

      final response = await http.post(
        Uri.parse('$baseUrl/messages'),
        headers: await _getHeaders(),
        body: json.encode({
          'conversationId': conversationId,
          'senderId': senderId,
          'receiverId': receiverId,
          'text': text,
          if (listingId != null) 'listingId': listingId,
        }),
      );

      print('📥 Send message response: ${response.statusCode}');

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = json.decode(response.body);
        final message = Message.fromJson(data['message']);
        print('✅ Message sent successfully');
        return message;
      } else {
        print('❌ Failed to send message: ${response.body}');
        throw Exception('Failed to send message');
      }
    } catch (e) {
      print('❌ Error sending message: $e');
      rethrow;
    }
  }

  /// Mark messages as read
  Future<void> markAsRead(String conversationId, String userId) async {
    try {
      print('✅ Marking messages as read: $conversationId');

      final response = await http.patch(
        Uri.parse('$baseUrl/messages/$conversationId/read'),
        headers: await _getHeaders(),
        body: json.encode({'userId': userId}),
      );

      if (response.statusCode == 200) {
        print('✅ Messages marked as read');
      } else {
        print('⚠️ Failed to mark as read: ${response.body}');
      }
    } catch (e) {
      print('❌ Error marking as read: $e');
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
      print('❌ Error fetching unread count: $e');
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
