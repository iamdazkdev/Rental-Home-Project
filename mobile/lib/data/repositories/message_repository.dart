import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import '../../config/api_config.dart';
import '../../services/storage_service.dart';
import '../models/message_model.dart';

class MessageRepository {
  final StorageService _storageService = StorageService();

  /// Send a message
  Future<MessageModel?> sendMessage({
    required String conversationId,
    required String senderId,
    required String receiverId,
    required String text,
  }) async {
    try {
      final token = await _storageService.getToken();

      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/messages'),
        headers: ApiConfig.headers(token: token),
        body: json.encode({
          'conversationId': conversationId,
          'senderId': senderId,
          'receiverId': receiverId,
          'text': text,
        }),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = json.decode(response.body);
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

      final response = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/messages/$conversationId'),
        headers: ApiConfig.headers(token: token),
      );

      if (response.statusCode == 200) {
        final List data = json.decode(response.body);
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
  }) async {
    try {
      final token = await _storageService.getToken();

      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/conversations'),
        headers: ApiConfig.headers(token: token),
        body: json.encode({
          'userId1': userId1,
          'userId2': userId2,
        }),
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

