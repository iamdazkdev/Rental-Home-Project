/// Calendar Models for Host Calendar Management
library;

import 'package:json_annotation/json_annotation.dart';

import '../core/utils/json_converters.dart';

part 'calendar_models.g.dart';

@JsonSerializable()
class CalendarData {
  @JsonKey(name: 'listing')
  final CalendarListingInfo listing;

  @JsonKey(name: 'period')
  final CalendarPeriod period;

  @JsonKey(name: 'bookings', defaultValue: [])
  final List<CalendarBooking> bookings;

  @JsonKey(name: 'blockedDates', defaultValue: [])
  final List<BlockedDate> blockedDates;

  @JsonKey(name: 'customPrices', defaultValue: [])
  final List<CustomPrice> customPrices;

  CalendarData({
    required this.listing,
    required this.period,
    required this.bookings,
    required this.blockedDates,
    required this.customPrices,
  });

  factory CalendarData.fromJson(Map<String, dynamic> json) =>
      _$CalendarDataFromJson(json);

  Map<String, dynamic> toJson() => _$CalendarDataToJson(this);
}

@JsonSerializable()
class CalendarListingInfo {
  @JsonKey(name: 'id', defaultValue: '')
  final String id;

  @JsonKey(name: 'title', defaultValue: 'Unknown Listing')
  final String title;

  @JsonKey(name: 'basePrice')
  @SafeDoubleConverter()
  final double basePrice;

  CalendarListingInfo({
    required this.id,
    required this.title,
    required this.basePrice,
  });

  factory CalendarListingInfo.fromJson(Map<String, dynamic> json) =>
      _$CalendarListingInfoFromJson(json);

  Map<String, dynamic> toJson() => _$CalendarListingInfoToJson(this);
}

/// Backward compat alias
typedef ListingInfo = CalendarListingInfo;

@JsonSerializable()
class CalendarPeriod {
  @JsonKey(name: 'month')
  final int month;

  @JsonKey(name: 'year')
  final int year;

  @JsonKey(name: 'startDate')
  @SafeDateTimeConverter()
  final DateTime startDate;

  @JsonKey(name: 'endDate')
  @SafeDateTimeConverter()
  final DateTime endDate;

  CalendarPeriod({
    required this.month,
    required this.year,
    required this.startDate,
    required this.endDate,
  });

  factory CalendarPeriod.fromJson(Map<String, dynamic> json) =>
      _$CalendarPeriodFromJson(json);

  Map<String, dynamic> toJson() => _$CalendarPeriodToJson(this);
}

@JsonSerializable()
class CalendarBooking {
  @JsonKey(name: 'id', defaultValue: '')
  final String id;

  @JsonKey(name: 'customerId')
  final String? customerId;

  @JsonKey(name: 'customerName', defaultValue: 'Unknown')
  final String customerName;

  @JsonKey(name: 'customerEmail', defaultValue: '')
  final String customerEmail;

  @JsonKey(name: 'customerPhone')
  final String? customerPhone;

  @JsonKey(name: 'customerAvatar')
  final String? customerAvatar;

  @JsonKey(name: 'checkIn')
  @SafeDateTimeConverter()
  final DateTime checkIn;

  @JsonKey(name: 'checkOut')
  @SafeDateTimeConverter()
  final DateTime checkOut;

  @JsonKey(name: 'status', defaultValue: 'pending')
  final String status;

  @JsonKey(name: 'paymentStatus', defaultValue: 'unpaid')
  final String paymentStatus;

  @JsonKey(name: 'totalPrice')
  @SafeDoubleConverter()
  final double totalPrice;

  @JsonKey(name: 'numberOfGuests', defaultValue: 1)
  final int numberOfGuests;

  CalendarBooking({
    required this.id,
    this.customerId,
    required this.customerName,
    required this.customerEmail,
    this.customerPhone,
    this.customerAvatar,
    required this.checkIn,
    required this.checkOut,
    required this.status,
    required this.paymentStatus,
    required this.totalPrice,
    required this.numberOfGuests,
  });

  factory CalendarBooking.fromJson(Map<String, dynamic> json) =>
      _$CalendarBookingFromJson(json);

  Map<String, dynamic> toJson() => _$CalendarBookingToJson(this);

  bool isOnDate(DateTime date) {
    final dateOnly = DateTime(date.year, date.month, date.day);
    final checkInOnly = DateTime(checkIn.year, checkIn.month, checkIn.day);
    final checkOutOnly = DateTime(checkOut.year, checkOut.month, checkOut.day);
    return dateOnly.isAfter(checkInOnly.subtract(const Duration(days: 1))) &&
        dateOnly.isBefore(checkOutOnly.add(const Duration(days: 1)));
  }
}

@JsonSerializable()
class BlockedDate {
  @JsonKey(name: 'id', defaultValue: '')
  final String id;

  @JsonKey(name: 'startDate')
  @SafeDateTimeConverter()
  final DateTime startDate;

  @JsonKey(name: 'endDate')
  @SafeDateTimeConverter()
  final DateTime endDate;

  @JsonKey(name: 'reason', defaultValue: 'other')
  final String reason;

  @JsonKey(name: 'note')
  final String? note;

  @JsonKey(name: 'recurring')
  final RecurringInfo? recurring;

  BlockedDate({
    required this.id,
    required this.startDate,
    required this.endDate,
    required this.reason,
    this.note,
    this.recurring,
  });

  factory BlockedDate.fromJson(Map<String, dynamic> json) =>
      _$BlockedDateFromJson(json);

  Map<String, dynamic> toJson() => _$BlockedDateToJson(this);

  bool isOnDate(DateTime date) {
    final dateOnly = DateTime(date.year, date.month, date.day);
    final startOnly = DateTime(startDate.year, startDate.month, startDate.day);
    final endOnly = DateTime(endDate.year, endDate.month, endDate.day);
    return dateOnly.isAfter(startOnly.subtract(const Duration(days: 1))) &&
        dateOnly.isBefore(endOnly.add(const Duration(days: 1)));
  }

  String get reasonDisplay {
    switch (reason) {
      case 'maintenance':
        return 'Bảo trì';
      case 'personal':
        return 'Sử dụng cá nhân';
      case 'holiday':
        return 'Nghỉ lễ';
      case 'renovation':
        return 'Sửa chữa';
      default:
        return 'Khác';
    }
  }
}

@JsonSerializable()
class RecurringInfo {
  @JsonKey(name: 'enabled', defaultValue: false)
  final bool enabled;

  @JsonKey(name: 'pattern', defaultValue: '')
  final String pattern;

  @JsonKey(name: 'endRecurring')
  @NullableDateTimeConverter()
  final DateTime? endRecurring;

  RecurringInfo({
    required this.enabled,
    required this.pattern,
    this.endRecurring,
  });

  factory RecurringInfo.fromJson(Map<String, dynamic> json) =>
      _$RecurringInfoFromJson(json);

  Map<String, dynamic> toJson() => _$RecurringInfoToJson(this);
}

@JsonSerializable()
class CustomPrice {
  @JsonKey(name: 'id', defaultValue: '')
  final String id;

  @JsonKey(name: 'date')
  @SafeDateTimeConverter()
  final DateTime date;

  @JsonKey(name: 'price')
  @SafeDoubleConverter()
  final double price;

  @JsonKey(name: 'reason')
  final String? reason;

  CustomPrice({
    required this.id,
    required this.date,
    required this.price,
    this.reason,
  });

  factory CustomPrice.fromJson(Map<String, dynamic> json) =>
      _$CustomPriceFromJson(json);

  Map<String, dynamic> toJson() => _$CustomPriceToJson(this);

  bool isOnDate(DateTime checkDate) {
    final dateOnly = DateTime(date.year, date.month, date.day);
    final checkOnly = DateTime(checkDate.year, checkDate.month, checkDate.day);
    return dateOnly == checkOnly;
  }
}

@JsonSerializable()
class BlockDateRequest {
  @JsonKey(name: 'startDate')
  @SafeDateTimeConverter()
  final DateTime startDate;

  @JsonKey(name: 'endDate')
  @SafeDateTimeConverter()
  final DateTime endDate;

  @JsonKey(name: 'reason')
  final String reason;

  @JsonKey(name: 'note')
  final String? note;

  BlockDateRequest({
    required this.startDate,
    required this.endDate,
    required this.reason,
    this.note,
  });

  factory BlockDateRequest.fromJson(Map<String, dynamic> json) =>
      _$BlockDateRequestFromJson(json);

  Map<String, dynamic> toJson() => _$BlockDateRequestToJson(this);
}

@JsonSerializable()
class CustomPriceRequest {
  @JsonKey(name: 'date')
  @SafeDateTimeConverter()
  final DateTime date;

  @JsonKey(name: 'price')
  @SafeDoubleConverter()
  final double price;

  @JsonKey(name: 'reason')
  final String? reason;

  CustomPriceRequest({
    required this.date,
    required this.price,
    this.reason,
  });

  factory CustomPriceRequest.fromJson(Map<String, dynamic> json) =>
      _$CustomPriceRequestFromJson(json);

  Map<String, dynamic> toJson() => _$CustomPriceRequestToJson(this);
}
