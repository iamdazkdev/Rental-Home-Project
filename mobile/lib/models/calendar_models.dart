/// Calendar Models for Host Calendar Management
library;

class CalendarData {
  final ListingInfo listing;
  final CalendarPeriod period;
  final List<CalendarBooking> bookings;
  final List<BlockedDate> blockedDates;
  final List<CustomPrice> customPrices;

  CalendarData({
    required this.listing,
    required this.period,
    required this.bookings,
    required this.blockedDates,
    required this.customPrices,
  });

  factory CalendarData.fromJson(Map<String, dynamic> json) {
    try {
      print('📊 Parsing CalendarData from JSON');

      final bookingsList = (json['bookings'] as List? ?? [])
          .map((b) {
            try {
              return CalendarBooking.fromJson(b as Map<String, dynamic>);
            } catch (e) {
              print('⚠️ Skipping invalid booking: $e');
              return null;
            }
          })
          .whereType<CalendarBooking>()
          .toList();

      final blockedDatesList = (json['blockedDates'] as List? ?? [])
          .map((b) {
            try {
              return BlockedDate.fromJson(b as Map<String, dynamic>);
            } catch (e) {
              print('⚠️ Skipping invalid blocked date: $e');
              return null;
            }
          })
          .whereType<BlockedDate>()
          .toList();

      final customPricesList = (json['customPrices'] as List? ?? [])
          .map((c) {
            try {
              return CustomPrice.fromJson(c as Map<String, dynamic>);
            } catch (e) {
              print('⚠️ Skipping invalid custom price: $e');
              return null;
            }
          })
          .whereType<CustomPrice>()
          .toList();

      print(
          '✅ Parsed: ${bookingsList.length} bookings, ${blockedDatesList.length} blocked dates, ${customPricesList.length} custom prices');

      return CalendarData(
        listing: ListingInfo.fromJson(json['listing'] as Map<String, dynamic>),
        period: CalendarPeriod.fromJson(json['period'] as Map<String, dynamic>),
        bookings: bookingsList,
        blockedDates: blockedDatesList,
        customPrices: customPricesList,
      );
    } catch (e) {
      print('❌ Error parsing CalendarData: $e');
      print('   JSON structure: ${json.keys}');
      rethrow;
    }
  }
}

class ListingInfo {
  final String id;
  final String title;
  final double basePrice;

  ListingInfo({
    required this.id,
    required this.title,
    required this.basePrice,
  });

  factory ListingInfo.fromJson(Map<String, dynamic> json) {
    return ListingInfo(
      id: json['id']?.toString() ?? '',
      title: json['title']?.toString() ?? 'Unknown Listing',
      basePrice: (json['basePrice'] ?? 0).toDouble(),
    );
  }
}

class CalendarPeriod {
  final int month;
  final int year;
  final DateTime startDate;
  final DateTime endDate;

  CalendarPeriod({
    required this.month,
    required this.year,
    required this.startDate,
    required this.endDate,
  });

  factory CalendarPeriod.fromJson(Map<String, dynamic> json) {
    return CalendarPeriod(
      month: json['month'],
      year: json['year'],
      startDate: DateTime.parse(json['startDate']),
      endDate: DateTime.parse(json['endDate']),
    );
  }
}

class CalendarBooking {
  final String id;
  final String? customerId;
  final String customerName;
  final String customerEmail;
  final String? customerPhone;
  final String? customerAvatar;
  final DateTime checkIn;
  final DateTime checkOut;
  final String status;
  final String paymentStatus;
  final double totalPrice;
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

  factory CalendarBooking.fromJson(Map<String, dynamic> json) {
    try {
      return CalendarBooking(
        id: json['id']?.toString() ?? '',
        customerId: json['customerId']?.toString(),
        customerName: json['customerName']?.toString() ?? 'Unknown',
        customerEmail: json['customerEmail']?.toString() ?? '',
        customerPhone: json['customerPhone']?.toString(),
        customerAvatar: json['customerAvatar']?.toString(),
        checkIn:
            DateTime.parse(json['checkIn'] ?? DateTime.now().toIso8601String()),
        checkOut: DateTime.parse(
            json['checkOut'] ?? DateTime.now().toIso8601String()),
        status: json['status']?.toString() ?? 'pending',
        paymentStatus: json['paymentStatus']?.toString() ?? 'unpaid',
        totalPrice: (json['totalPrice'] ?? 0).toDouble(),
        numberOfGuests: json['numberOfGuests'] ?? 1,
      );
    } catch (e) {
      print('❌ Error parsing CalendarBooking: $e');
      print('   JSON data: $json');
      rethrow;
    }
  }

  bool isOnDate(DateTime date) {
    final dateOnly = DateTime(date.year, date.month, date.day);
    final checkInOnly = DateTime(checkIn.year, checkIn.month, checkIn.day);
    final checkOutOnly = DateTime(checkOut.year, checkOut.month, checkOut.day);

    return dateOnly.isAfter(checkInOnly.subtract(const Duration(days: 1))) &&
        dateOnly.isBefore(checkOutOnly.add(const Duration(days: 1)));
  }
}

class BlockedDate {
  final String id;
  final DateTime startDate;
  final DateTime endDate;
  final String reason;
  final String? note;
  final RecurringInfo? recurring;

  BlockedDate({
    required this.id,
    required this.startDate,
    required this.endDate,
    required this.reason,
    this.note,
    this.recurring,
  });

  factory BlockedDate.fromJson(Map<String, dynamic> json) {
    try {
      return BlockedDate(
        id: json['id']?.toString() ?? '',
        startDate: DateTime.parse(
            json['startDate'] ?? DateTime.now().toIso8601String()),
        endDate:
            DateTime.parse(json['endDate'] ?? DateTime.now().toIso8601String()),
        reason: json['reason']?.toString() ?? 'other',
        note: json['note']?.toString(),
        recurring:
            json['recurring'] != null && json['recurring']['enabled'] == true
                ? RecurringInfo.fromJson(json['recurring'])
                : null,
      );
    } catch (e) {
      print('❌ Error parsing BlockedDate: $e');
      print('   JSON data: $json');
      rethrow;
    }
  }

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

class RecurringInfo {
  final bool enabled;
  final String pattern;
  final DateTime? endRecurring;

  RecurringInfo({
    required this.enabled,
    required this.pattern,
    this.endRecurring,
  });

  factory RecurringInfo.fromJson(Map<String, dynamic> json) {
    return RecurringInfo(
      enabled: json['enabled'] ?? false,
      pattern: json['pattern'] ?? '',
      endRecurring: json['endRecurring'] != null
          ? DateTime.parse(json['endRecurring'])
          : null,
    );
  }
}

class CustomPrice {
  final String id;
  final DateTime date;
  final double price;
  final String? reason;

  CustomPrice({
    required this.id,
    required this.date,
    required this.price,
    this.reason,
  });

  factory CustomPrice.fromJson(Map<String, dynamic> json) {
    try {
      return CustomPrice(
        id: json['id']?.toString() ?? '',
        date: DateTime.parse(json['date'] ?? DateTime.now().toIso8601String()),
        price: (json['price'] ?? 0).toDouble(),
        reason: json['reason']?.toString(),
      );
    } catch (e) {
      print('❌ Error parsing CustomPrice: $e');
      print('   JSON data: $json');
      rethrow;
    }
  }

  bool isOnDate(DateTime checkDate) {
    final dateOnly = DateTime(date.year, date.month, date.day);
    final checkOnly = DateTime(checkDate.year, checkDate.month, checkDate.day);
    return dateOnly == checkOnly;
  }
}

class BlockDateRequest {
  final DateTime startDate;
  final DateTime endDate;
  final String reason;
  final String? note;

  BlockDateRequest({
    required this.startDate,
    required this.endDate,
    required this.reason,
    this.note,
  });

  Map<String, dynamic> toJson() {
    return {
      'startDate': startDate.toIso8601String(),
      'endDate': endDate.toIso8601String(),
      'reason': reason,
      if (note != null) 'note': note,
    };
  }
}

class CustomPriceRequest {
  final DateTime date;
  final double price;
  final String? reason;

  CustomPriceRequest({
    required this.date,
    required this.price,
    this.reason,
  });

  Map<String, dynamic> toJson() {
    return {
      'date': date.toIso8601String(),
      'price': price,
      if (reason != null) 'reason': reason,
    };
  }
}
