import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

import '../../config/api_config.dart';
import '../../models/conversation.dart';
import '../../models/message.dart';
import '../../services/storage_service.dart';

class MessageRepository {
  final StorageService _storageService = StorageService();

  /// Get all conversations for a user
  Future<List<ConversationModel>> getConversations(String userId) async {
    try {
      final token = await _storageService.getToken();

      debugPrint('📞 Fetching conversations for user: $userId');

      final response = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/messages/conversations/$userId'),
        headers: ApiConfig.headers(token: token),
      );

      debugPrint('📥 Conversations response: ${response.statusCode}');

      if (response.statusCode == 200) {
        final List data = json.decode(response.body);
        debugPrint('✅ Found ${data.length} conversations');
        return data.map((json) => ConversationModel.fromJson(json)).toList();
      }

      return [];
    } catch (e) {
      debugPrint('❌ Error getting conversations: $e');
      return [];
    }
  }

  /// Send a message
  Future<MessageModel?> sendMessage({
    required String senderId,
    required String receiverId,
    required String text,
    String? listingId,
  }) async {
    try {
      final token = await _storageService.getToken();

      debugPrint('📤 Sending message from $senderId to $receiverId');

      final body = {
        'senderId': senderId,
        'receiverId': receiverId,
        'message': text,
        'messageType': 'text',
      };

      if (listingId != null) {
        body['listingId'] = listingId;
      }

      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/messages/messages'),
        headers: ApiConfig.headers(token: token),
        body: json.encode(body),
      );

      debugPrint('📥 Send message response: ${response.statusCode}');

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = json.decode(response.body);
        debugPrint('✅ Message sent successfully');
        return MessageModel.fromJson(data['message'] ?? data);
      }

      return null;
    } catch (e) {
      debugPrint('❌ Error sending message: $e');
      return null;
    }
  }

  /// Get messages for a conversation
  Future<List<MessageModel>> getMessages(String conversationId) async {
    try {
      final token = await _storageService.getToken();
      final userId = await _storageService.getUserId();

      debugPrint('📨 Fetching messages for conversation: $conversationId');

      final response = await http.get(
        Uri.parse(
            '${ApiConfig.baseUrl}/messages/messages/$conversationId?userId=$userId'),
        headers: ApiConfig.headers(token: token),
      );

      debugPrint('📥 Messages response: ${response.statusCode}');

      if (response.statusCode == 200) {
        final List data = json.decode(response.body);
        debugPrint('✅ Found ${data.length} messages');
        return data.map((json) => MessageModel.fromJson(json)).toList();
      }

      return [];
    } catch (e) {
      debugPrint('❌ Error getting messages: $e');
      return [];
    }
  }

  /// Mark message as read
  Future<bool> markAsRead(String messageId) async {
    try {
      final token = await _storageService.getToken();

      final response = await http.patch(
        Uri.parse('${ApiConfig.baseUrl}/messages/$messageId/read'),
        headers: ApiConfig.headers(token: token),
      );

      return response.statusCode == 200;
    } catch (e) {
      debugPrint('❌ Error marking message as read: $e');
      return false;
    }
  }

  /// Get or create conversation
  Future<String?> getOrCreateConversation({
    required String userId1,
    required String userId2,
    String? listingId,
  }) async {
    try {
      final token = await _storageService.getToken();

      final body = {
        'userId1': userId1,
        'userId2': userId2,
      };

      if (listingId != null) {
        body['listingId'] = listingId;
      }

      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/conversations'),
        headers: ApiConfig.headers(token: token),
        body: json.encode(body),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = json.decode(response.body);
        return data['conversationId'] ?? data['_id'];
      }

      return null;
    } catch (e) {
      debugPrint('❌ Error getting/creating conversation: $e');
      return null;
    }
  }
}
