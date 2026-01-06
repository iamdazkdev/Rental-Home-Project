class AppNotification {
  final String id;
  final String userId;
  final String type;
  final String message;
  final Map<String, dynamic>? data;
  final bool isRead;
  final DateTime? createdAt;

  AppNotification({
    required this.id,
    required this.userId,
    required this.type,
    required this.message,
    this.data,
    this.isRead = false,
    this.createdAt,
  });

  factory AppNotification.fromJson(Map<String, dynamic> json) {
    return AppNotification(
      id: json['_id'] ?? json['id'] ?? '',
      userId: json['userId'] ?? '',
      type: json['type'] ?? '',
      message: json['message'] ?? '',
      data: json['data'],
      isRead: json['isRead'] ?? false,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'userId': userId,
      'type': type,
      'message': message,
      'data': data,
      'isRead': isRead,
      'createdAt': createdAt?.toIso8601String(),
    };
  }
}

