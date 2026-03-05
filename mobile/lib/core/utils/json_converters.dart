import 'package:json_annotation/json_annotation.dart';

/// Extracts a MongoDB `_id` from a JSON value.
/// Handles both `String` IDs and populated `Map` objects with `_id` field.
class MongoIdConverter implements JsonConverter<String, dynamic> {
  const MongoIdConverter();

  @override
  String fromJson(dynamic json) {
    if (json == null) return '';
    if (json is String) return json;
    if (json is Map) return json['_id']?.toString() ?? '';
    return json.toString();
  }

  @override
  dynamic toJson(String object) => object;
}

/// Same as [MongoIdConverter] but nullable.
class NullableMongoIdConverter implements JsonConverter<String?, dynamic> {
  const NullableMongoIdConverter();

  @override
  String? fromJson(dynamic json) {
    if (json == null) return null;
    if (json is String) return json;
    if (json is Map) return json['_id']?.toString();
    return json.toString();
  }

  @override
  dynamic toJson(String? object) => object;
}

/// Safely parses a `DateTime` from JSON.
/// Falls back to `DateTime.now()` on null or invalid input.
class SafeDateTimeConverter implements JsonConverter<DateTime, dynamic> {
  const SafeDateTimeConverter();

  @override
  DateTime fromJson(dynamic json) {
    if (json == null) return DateTime.now();
    if (json is DateTime) return json;
    return DateTime.tryParse(json.toString()) ?? DateTime.now();
  }

  @override
  String toJson(DateTime object) => object.toIso8601String();
}

/// Safely parses a nullable `DateTime` from JSON.
class NullableDateTimeConverter implements JsonConverter<DateTime?, dynamic> {
  const NullableDateTimeConverter();

  @override
  DateTime? fromJson(dynamic json) {
    if (json == null) return null;
    if (json is DateTime) return json;
    return DateTime.tryParse(json.toString());
  }

  @override
  String? toJson(DateTime? object) => object?.toIso8601String();
}

/// Safely converts any numeric JSON value to `double`.
class SafeDoubleConverter implements JsonConverter<double, dynamic> {
  const SafeDoubleConverter();

  @override
  double fromJson(dynamic json) {
    if (json == null) return 0.0;
    if (json is double) return json;
    if (json is int) return json.toDouble();
    return double.tryParse(json.toString()) ?? 0.0;
  }

  @override
  dynamic toJson(double object) => object;
}

/// Safely converts any numeric JSON value to nullable `double`.
class NullableSafeDoubleConverter implements JsonConverter<double?, dynamic> {
  const NullableSafeDoubleConverter();

  @override
  double? fromJson(dynamic json) {
    if (json == null) return null;
    if (json is double) return json;
    if (json is int) return json.toDouble();
    return double.tryParse(json.toString());
  }

  @override
  dynamic toJson(double? object) => object;
}

/// Safely converts any numeric JSON value to `int`.
class SafeIntConverter implements JsonConverter<int, dynamic> {
  const SafeIntConverter();

  @override
  int fromJson(dynamic json) {
    if (json == null) return 0;
    if (json is int) return json;
    if (json is double) return json.toInt();
    return int.tryParse(json.toString()) ?? 0;
  }

  @override
  dynamic toJson(int object) => object;
}

/// Safely converts any numeric JSON value to nullable `int`.
class NullableSafeIntConverter implements JsonConverter<int?, dynamic> {
  const NullableSafeIntConverter();

  @override
  int? fromJson(dynamic json) {
    if (json == null) return null;
    if (json is int) return json;
    if (json is double) return json.toInt();
    return int.tryParse(json.toString());
  }

  @override
  dynamic toJson(int? object) => object;
}

/// Converts a `List<String>` from JSON, handling null and non-list values.
class StringListConverter implements JsonConverter<List<String>, dynamic> {
  const StringListConverter();

  @override
  List<String> fromJson(dynamic json) {
    if (json == null) return [];
    if (json is List) return json.map((e) => e.toString()).toList();
    return [];
  }

  @override
  dynamic toJson(List<String> object) => object;
}

/// Nullable version of [StringListConverter].
class NullableStringListConverter
    implements JsonConverter<List<String>?, dynamic> {
  const NullableStringListConverter();

  @override
  List<String>? fromJson(dynamic json) {
    if (json == null) return null;
    if (json is List) return json.map((e) => e.toString()).toList();
    return null;
  }

  @override
  dynamic toJson(List<String>? object) => object;
}
