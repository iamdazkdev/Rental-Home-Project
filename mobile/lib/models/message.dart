class Message {
  final String id;
  final String conversationId;
  final String senderId;
  final String content;
  final DateTime timestamp;
  final bool isRead;

  // Populated fields
  final dynamic sender;

  Message({
    required this.id,
    required this.conversationId,
    required this.senderId,
    required this.content,
    required this.timestamp,
    this.isRead = false,
    this.sender,
  });

  factory Message.fromJson(Map<String, dynamic> json) {
    return Message(
      id: json['_id'] ?? json['id'] ?? '',
      conversationId: json['conversationId'] ?? '',
      senderId: json['senderId'] is String
          ? json['senderId']
          : json['senderId']?['_id'] ?? '',
      content: json['content'] ?? '',
      timestamp: json['timestamp'] != null
          ? DateTime.parse(json['timestamp'])
          : DateTime.now(),
      isRead: json['isRead'] ?? false,
      sender: json['senderId'] is Map ? json['senderId'] : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'conversationId': conversationId,
      'senderId': senderId,
      'content': content,
      'timestamp': timestamp.toIso8601String(),
      'isRead': isRead,
    };
  }
}

class Conversation {
  final String id;
  final List<String> participants;
  final String? listingId;
  final Message? lastMessage;
  final int unreadCount;
  final DateTime? updatedAt;

  // Populated fields
  final List<dynamic>? participantDetails;
  final dynamic listing;

  Conversation({
    required this.id,
    required this.participants,
    this.listingId,
    this.lastMessage,
    this.unreadCount = 0,
    this.updatedAt,
    this.participantDetails,
    this.listing,
  });

  factory Conversation.fromJson(Map<String, dynamic> json) {
    return Conversation(
      id: json['_id'] ?? json['id'] ?? '',
      participants: json['participants'] != null
          ? List<String>.from(json['participants'].map((p) {
              if (p is String) return p;
              if (p is Map) return p['_id'] ?? '';
              return '';
            }))
          : [],
      listingId: json['listingId'] is String
          ? json['listingId']
          : json['listingId']?['_id'],
      lastMessage: json['lastMessage'] != null
          ? Message.fromJson(json['lastMessage'])
          : null,
      unreadCount: json['unreadCount'] ?? 0,
      updatedAt: json['updatedAt'] != null
          ? DateTime.parse(json['updatedAt'])
          : null,
      participantDetails: json['participants'] is List
          ? json['participants']
              .where((p) => p is Map)
              .toList()
          : null,
      listing: json['listingId'] is Map ? json['listingId'] : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'participants': participants,
      'listingId': listingId,
      'lastMessage': lastMessage?.toJson(),
      'unreadCount': unreadCount,
      'updatedAt': updatedAt?.toIso8601String(),
    };
  }
}

