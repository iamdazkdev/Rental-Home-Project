import 'package:json_annotation/json_annotation.dart';

import '../core/utils/json_converters.dart';

part 'notification.g.dart';

@JsonSerializable()
class AppNotification {
  @JsonKey(name: '_id')
  @MongoIdConverter()
  final String id;

  @JsonKey(name: 'userId')
  final String userId;

  @JsonKey(name: 'type')
  final String type;

  @JsonKey(name: 'message')
  final String message;

  @JsonKey(name: 'data')
  final Map<String, dynamic>? data;

  @JsonKey(name: 'isRead', defaultValue: false)
  final bool isRead;

  @JsonKey(name: 'createdAt')
  @NullableDateTimeConverter()
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

  factory AppNotification.fromJson(Map<String, dynamic> json) =>
      _$AppNotificationFromJson(json);

  Map<String, dynamic> toJson() => _$AppNotificationToJson(this);
}
