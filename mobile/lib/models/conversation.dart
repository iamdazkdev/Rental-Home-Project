import 'package:json_annotation/json_annotation.dart';

import '../core/utils/json_converters.dart';

part 'conversation.g.dart';

@JsonSerializable()
class Conversation {
  @JsonKey(name: '_id')
  @MongoIdConverter()
  final String id;

  @JsonKey(name: 'conversationId', defaultValue: '')
  final String conversationId;

  @JsonKey(name: 'participants')
  @StringListConverter()
  final List<String> participants;

  @JsonKey(name: 'otherUser')
  final UserInfo otherUser;

  @JsonKey(name: 'listingId')
  final String? listingId;

  @JsonKey(name: 'listingTitle')
  final String? listingTitle;

  @JsonKey(name: 'listingPhotoPaths')
  @NullableStringListConverter()
  final List<String>? listingPhotoPaths;

  @JsonKey(name: 'lastMessage', defaultValue: '')
  final String lastMessage;

  @JsonKey(name: 'lastMessageAt')
  @SafeDateTimeConverter()
  final DateTime lastMessageAt;

  @JsonKey(name: 'lastMessageSenderId')
  final String? lastMessageSenderId;

  @JsonKey(name: 'unreadCount')
  @SafeIntConverter()
  final int unreadCount;

  Conversation({
    required this.id,
    this.conversationId = '',
    this.participants = const [],
    required this.otherUser,
    this.listingId,
    this.listingTitle,
    this.listingPhotoPaths,
    required this.lastMessage,
    required this.lastMessageAt,
    this.lastMessageSenderId,
    this.unreadCount = 0,
  });

  /// Listing info as computed object
  ListingInfo? get listing => listingId != null
      ? ListingInfo(
          id: listingId!,
          title: listingTitle ?? 'Unknown Listing',
          listingPhotoPaths: listingPhotoPaths ?? [],
        )
      : null;

  /// Formatted relative time for UI display
  String get formattedTime {
    final now = DateTime.now();
    final difference = now.difference(lastMessageAt);

    if (difference.inDays == 0) {
      return '${lastMessageAt.hour.toString().padLeft(2, '0')}:${lastMessageAt.minute.toString().padLeft(2, '0')}';
    } else if (difference.inDays == 1) {
      return 'Yesterday';
    } else if (difference.inDays < 7) {
      return '${difference.inDays}d ago';
    } else {
      return '${lastMessageAt.day}/${lastMessageAt.month}/${lastMessageAt.year}';
    }
  }

  /// Custom fromJson to handle nested listing and otherUser structures.
  factory Conversation.fromJson(Map<String, dynamic> json) {
    final normalized = Map<String, dynamic>.from(json);

    // Normalize conversationId
    normalized['conversationId'] = json['conversationId'] ?? json['_id'] ?? '';

    // Extract listing data from nested object
    if (json['listing'] is Map) {
      final listing = Map<String, dynamic>.from(json['listing']);
      normalized['listingId'] = listing['_id']?.toString();
      normalized['listingTitle'] = listing['title']?.toString();
      if (listing['listingPhotoPaths'] is List) {
        normalized['listingPhotoPaths'] = listing['listingPhotoPaths'];
      }
    }

    // Ensure otherUser exists
    if (json['otherUser'] == null || json['otherUser'] is! Map) {
      normalized['otherUser'] = {
        '_id': '',
        'firstName': 'Unknown',
        'lastName': 'User',
      };
    }

    return _$ConversationFromJson(normalized);
  }

  Map<String, dynamic> toJson() => _$ConversationToJson(this);
}

/// Backward-compatible alias
typedef ConversationModel = Conversation;

@JsonSerializable()
class UserInfo {
  @JsonKey(name: '_id')
  @MongoIdConverter()
  final String id;

  @JsonKey(name: 'firstName', defaultValue: 'Unknown')
  final String firstName;

  @JsonKey(name: 'lastName', defaultValue: 'User')
  final String lastName;

  @JsonKey(name: 'profileImagePath')
  final String? profileImagePath;

  UserInfo({
    required this.id,
    required this.firstName,
    required this.lastName,
    this.profileImagePath,
  });

  String get fullName => '$firstName $lastName';

  factory UserInfo.fromJson(Map<String, dynamic> json) =>
      _$UserInfoFromJson(json);

  Map<String, dynamic> toJson() => _$UserInfoToJson(this);
}

/// Backward-compatible alias
typedef OtherUser = UserInfo;

/// Listing info for conversation context
@JsonSerializable()
class ListingInfo {
  @JsonKey(name: '_id')
  @MongoIdConverter()
  final String id;

  @JsonKey(name: 'title', defaultValue: 'Unknown Listing')
  final String title;

  @JsonKey(name: 'listingPhotoPaths')
  @StringListConverter()
  final List<String> listingPhotoPaths;

  ListingInfo({
    required this.id,
    required this.title,
    required this.listingPhotoPaths,
  });

  factory ListingInfo.fromJson(Map<String, dynamic> json) =>
      _$ListingInfoFromJson(json);

  Map<String, dynamic> toJson() => _$ListingInfoToJson(this);

  String? get firstPhoto =>
      listingPhotoPaths.isNotEmpty ? listingPhotoPaths.first : null;
}
