import 'package:json_annotation/json_annotation.dart';

import '../core/utils/json_converters.dart';

part 'message.g.dart';

/// Extracts an ID from a field that can be String, Map with _id, or null.
String _extractId(dynamic field) {
  if (field == null) return '';
  if (field is String) return field;
  if (field is Map) return field['_id']?.toString() ?? '';
  return field.toString();
}

/// Unified Message model.
/// Combines old Message + MessageModel into a single class.
@JsonSerializable()
class Message {
  @JsonKey(name: '_id')
  @MongoIdConverter()
  final String id;

  @JsonKey(name: 'conversationId', defaultValue: '')
  final String conversationId;

  @JsonKey(name: 'senderId', fromJson: _extractId)
  final String senderId;

  @JsonKey(name: 'receiverId', fromJson: _extractId)
  final String receiverId;

  @JsonKey(name: 'message', defaultValue: '')
  final String message;

  @JsonKey(name: 'messageType', defaultValue: 'text')
  final String messageType;

  @JsonKey(name: 'listingId')
  final String? listingId;

  @JsonKey(name: 'isRead')
  final bool? isRead;

  @JsonKey(name: 'createdAt')
  @SafeDateTimeConverter()
  final DateTime createdAt;

  @JsonKey(name: 'updatedAt')
  @SafeDateTimeConverter()
  final DateTime updatedAt;

  Message({
    required this.id,
    required this.conversationId,
    required this.senderId,
    required this.receiverId,
    required this.message,
    this.messageType = 'text',
    this.listingId,
    this.isRead,
    required this.createdAt,
    required this.updatedAt,
  });

  /// Custom fromJson to handle field aliases (text↔message, read↔isRead).
  factory Message.fromJson(Map<String, dynamic> json) {
    final normalized = Map<String, dynamic>.from(json);
    // Normalize: 'text' → 'message'
    normalized['message'] = json['message'] ?? json['text'] ?? '';
    // Normalize: 'read' → 'isRead'
    normalized['isRead'] = json['isRead'] ?? json['read'];
    // Ensure updatedAt exists
    normalized['updatedAt'] = json['updatedAt'] ?? json['createdAt'];
    return _$MessageFromJson(normalized);
  }

  Map<String, dynamic> toJson() => _$MessageToJson(this);

  /// Backward-compat alias for old `text` field
  String get text => message;

  /// Backward-compat alias for old `read` field
  bool get read => isRead ?? false;

  /// Formatted time for UI display
  String get formattedTime {
    final now = DateTime.now();
    final difference = now.difference(createdAt);

    if (difference.inDays == 0) {
      return '${createdAt.hour.toString().padLeft(2, '0')}:${createdAt.minute.toString().padLeft(2, '0')}';
    } else if (difference.inDays == 1) {
      return 'Yesterday ${createdAt.hour.toString().padLeft(2, '0')}:${createdAt.minute.toString().padLeft(2, '0')}';
    } else {
      return '${createdAt.day}/${createdAt.month}/${createdAt.year}';
    }
  }
}

/// Backward-compatible alias
typedef MessageModel = Message;
