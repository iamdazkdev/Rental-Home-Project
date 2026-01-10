class Conversation {
  final String id;
  final String conversationId;
  final OtherUser otherUser;
  final ListingInfo? listing;
  final String? lastMessage;
  final DateTime? lastMessageAt;
  final String? lastMessageSenderId;
  final int unreadCount;

  Conversation({
    required this.id,
    required this.conversationId,
    required this.otherUser,
    this.listing,
    this.lastMessage,
    this.lastMessageAt,
    this.lastMessageSenderId,
    this.unreadCount = 0,
  });

  // Getter for listingId
  String? get listingId => listing?.id;

  // Getter for listingTitle
  String? get listingTitle => listing?.title;

  factory Conversation.fromJson(Map<String, dynamic> json) {
    // Helper to extract ID from field (can be String or Object)
    String? extractId(dynamic field) {
      if (field == null) return null;
      if (field is String) return field;
      if (field is Map) return field['_id']?.toString();
      return field.toString();
    }

    return Conversation(
      id: json['_id'] ?? '',
      conversationId: json['conversationId'] ?? '',
      otherUser: OtherUser.fromJson(json['otherUser'] ?? {}),
      listing: json['listing'] != null
          ? ListingInfo.fromJson(json['listing'])
          : null,
      lastMessage: json['lastMessage'],
      lastMessageAt: json['lastMessageAt'] != null
          ? DateTime.parse(json['lastMessageAt'])
          : null,
      lastMessageSenderId: extractId(json['lastMessageSenderId']),
      unreadCount: json['unreadCount'] ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'conversationId': conversationId,
      'otherUser': otherUser.toJson(),
      'listing': listing?.toJson(),
      'lastMessage': lastMessage,
      'lastMessageAt': lastMessageAt?.toIso8601String(),
      'lastMessageSenderId': lastMessageSenderId,
      'unreadCount': unreadCount,
    };
  }

  String get formattedTime {
    if (lastMessageAt == null) return '';

    final now = DateTime.now();
    final difference = now.difference(lastMessageAt!);

    if (difference.inDays == 0) {
      return '${lastMessageAt!.hour.toString().padLeft(2, '0')}:${lastMessageAt!.minute.toString().padLeft(2, '0')}';
    } else if (difference.inDays == 1) {
      return 'Yesterday';
    } else if (difference.inDays < 7) {
      return '${difference.inDays}d ago';
    } else {
      return '${lastMessageAt!.day}/${lastMessageAt!.month}/${lastMessageAt!.year}';
    }
  }
}

class OtherUser {
  final String id;
  final String firstName;
  final String lastName;
  final String? profileImagePath;

  OtherUser({
    required this.id,
    required this.firstName,
    required this.lastName,
    this.profileImagePath,
  });

  String get fullName => '$firstName $lastName';

  factory OtherUser.fromJson(Map<String, dynamic> json) {
    return OtherUser(
      id: json['_id'] ?? '',
      firstName: json['firstName'] ?? 'Unknown',
      lastName: json['lastName'] ?? 'User',
      profileImagePath: json['profileImagePath'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'firstName': firstName,
      'lastName': lastName,
      'profileImagePath': profileImagePath,
    };
  }
}

class ListingInfo {
  final String id;
  final String title;
  final List<String> listingPhotoPaths;

  ListingInfo({
    required this.id,
    required this.title,
    required this.listingPhotoPaths,
  });

  factory ListingInfo.fromJson(Map<String, dynamic> json) {
    return ListingInfo(
      id: json['_id'] ?? '',
      title: json['title'] ?? 'Unknown Listing',
      listingPhotoPaths: List<String>.from(json['listingPhotoPaths'] ?? []),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'title': title,
      'listingPhotoPaths': listingPhotoPaths,
    };
  }

  String? get firstPhoto =>
      listingPhotoPaths.isNotEmpty ? listingPhotoPaths.first : null;
}

/// ConversationModel for state management (flatter structure, no nested objects)
class ConversationModel {
  final String id;
  final List<String> participants;
  final UserInfo otherUser;
  final String? listingId;
  final String? listingTitle;
  final List<String>? listingPhotoPaths;
  final String lastMessage;
  final DateTime lastMessageAt;
  final String? lastMessageSenderId;
  final int unreadCount;

  ConversationModel({
    required this.id,
    required this.participants,
    required this.otherUser,
    this.listingId,
    this.listingTitle,
    this.listingPhotoPaths,
    required this.lastMessage,
    required this.lastMessageAt,
    this.lastMessageSenderId,
    this.unreadCount = 0,
  });

  factory ConversationModel.fromJson(Map<String, dynamic> json) {
    // Safe parsing of otherUser
    Map<String, dynamic> otherUserMap = {};
    if (json['otherUser'] != null) {
      if (json['otherUser'] is Map) {
        otherUserMap = Map<String, dynamic>.from(json['otherUser']);
      }
    }

    // Safe parsing of listing
    String? listingId;
    String? listingTitle;
    List<String>? listingPhotos;

    if (json['listing'] != null && json['listing'] is Map) {
      final listing = Map<String, dynamic>.from(json['listing']);
      listingId = listing['_id']?.toString();
      listingTitle = listing['title']?.toString();

      if (listing['listingPhotoPaths'] != null &&
          listing['listingPhotoPaths'] is List) {
        listingPhotos = List<String>.from(listing['listingPhotoPaths']);
      }
    }

    return ConversationModel(
      id: json['conversationId'] ?? json['_id'] ?? '',
      participants: List<String>.from(json['participants'] ?? []),
      otherUser: UserInfo.fromJson(otherUserMap),
      listingId: listingId,
      listingTitle: listingTitle,
      listingPhotoPaths: listingPhotos,
      lastMessage: json['lastMessage']?.toString() ?? '',
      lastMessageAt: json['lastMessageAt'] != null
          ? DateTime.tryParse(json['lastMessageAt'].toString()) ??
              DateTime.now()
          : DateTime.now(),
      lastMessageSenderId: json['lastMessageSenderId']?.toString(),
      unreadCount: json['unreadCount'] is int ? json['unreadCount'] : 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'conversationId': id,
      'participants': participants,
      'otherUser': otherUser.toJson(),
      'listingId': listingId,
      'listingTitle': listingTitle,
      'listingPhotoPaths': listingPhotoPaths,
      'lastMessage': lastMessage,
      'lastMessageAt': lastMessageAt.toIso8601String(),
      'lastMessageSenderId': lastMessageSenderId,
      'unreadCount': unreadCount,
    };
  }
}

/// UserInfo class for ConversationModel (simpler than OtherUser)
class UserInfo {
  final String id;
  final String firstName;
  final String lastName;
  final String? profileImagePath;

  UserInfo({
    required this.id,
    required this.firstName,
    required this.lastName,
    this.profileImagePath,
  });

  factory UserInfo.fromJson(Map<String, dynamic> json) {
    return UserInfo(
      id: json['_id']?.toString() ?? json['id']?.toString() ?? '',
      firstName: json['firstName']?.toString() ?? '',
      lastName: json['lastName']?.toString() ?? '',
      profileImagePath: json['profileImagePath']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'firstName': firstName,
      'lastName': lastName,
      'profileImagePath': profileImagePath,
    };
  }
}
