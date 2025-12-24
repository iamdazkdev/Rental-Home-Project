class Message {
  final String id;
  final String conversationId;
  final String senderId;
  final String receiverId;
  final String message;
  final DateTime? createdAt;
  final bool isRead;

  Message({
    required this.id,
    required this.conversationId,
    required this.senderId,
    required this.receiverId,
    required this.message,
    this.createdAt,
    this.isRead = false,
  });

  factory Message.fromJson(Map<String, dynamic> json) {
    return Message(
      id: json['_id'] ?? json['id'] ?? '',
      conversationId: json['conversationId'] ?? '',
      senderId: json['senderId'] is String
          ? json['senderId']
          : json['senderId']?['_id'] ?? '',
      receiverId: json['receiverId'] is String
          ? json['receiverId']
          : json['receiverId']?['_id'] ?? '',
      message: json['message'] ?? '',
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : null,
      isRead: json['isRead'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'conversationId': conversationId,
      'senderId': senderId,
      'receiverId': receiverId,
      'message': message,
      'createdAt': createdAt?.toIso8601String(),
      'isRead': isRead,
    };
  }

  bool isSentByMe(String userId) {
    return senderId == userId;
  }
}

