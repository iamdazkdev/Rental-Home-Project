class Conversation {
  final String conversationId;
  final Map<String, dynamic> otherUser;
  final Map<String, dynamic>? listing;
  final String lastMessage;
  final DateTime? lastMessageAt;
  final int unreadCount;

  Conversation({
    required this.conversationId,
    required this.otherUser,
    this.listing,
    required this.lastMessage,
    this.lastMessageAt,
    this.unreadCount = 0,
  });

  factory Conversation.fromJson(Map<String, dynamic> json) {
    return Conversation(
      conversationId: json['conversationId'] ?? '',
      otherUser: Map<String, dynamic>.from(json['otherUser'] ?? {}),
      listing: json['listing'] != null
          ? Map<String, dynamic>.from(json['listing'])
          : null,
      lastMessage: json['lastMessage'] ?? '',
      lastMessageAt: json['lastMessageAt'] != null
          ? DateTime.parse(json['lastMessageAt'])
          : null,
      unreadCount: json['unreadCount'] ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'conversationId': conversationId,
      'otherUser': otherUser,
      'listing': listing,
      'lastMessage': lastMessage,
      'lastMessageAt': lastMessageAt?.toIso8601String(),
      'unreadCount': unreadCount,
    };
  }

  String get otherUserName {
    final firstName = otherUser['firstName'] ?? '';
    final lastName = otherUser['lastName'] ?? '';
    return '$firstName $lastName'.trim();
  }

  String? get otherUserImage {
    return otherUser['profileImagePath'];
  }

  String get otherUserId {
    return otherUser['_id'] ?? otherUser['id'] ?? '';
  }

  String? get listingTitle {
    return listing?['title'];
  }

  List<String> get listingPhotos {
    final photos = listing?['listingPhotoPaths'];
    if (photos is List) {
      return photos.map((p) => p.toString()).toList();
    }
    return [];
  }
}

