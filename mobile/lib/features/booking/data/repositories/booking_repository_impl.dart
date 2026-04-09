import 'package:injectable/injectable.dart';

import '../../domain/entities/booking_entity.dart';
import '../../domain/entities/booking_intent_entity.dart';
import '../../domain/repositories/i_booking_repository.dart';
import '../datasources/booking_remote_datasource.dart';
import '../models/booking_model.dart';
import '../models/booking_intent_model.dart';

@LazySingleton(as: IBookingRepository)
class BookingRepositoryImpl implements IBookingRepository {
  final BookingRemoteDataSource _remoteDataSource;

  BookingRepositoryImpl(this._remoteDataSource);

  @override
  Future<BookingEntity?> createCashBooking({
    required String listingId,
    required String hostId,
    required DateTime startDate,
    required DateTime endDate,
    required double totalPrice,
  }) async {
    final response = await _remoteDataSource.createCashBooking(
      listingId: listingId,
      hostId: hostId,
      startDate: startDate,
      endDate: endDate,
      totalPrice: totalPrice,
    );
    if (response != null) {
      return BookingModel.fromJson(response);
    }
    return null;
  }

  @override
  Future<BookingIntentEntity?> createBookingIntent({
    required String listingId,
    required String hostId,
    required DateTime startDate,
    required DateTime endDate,
    required double totalPrice,
    required String paymentType,
  }) async {
    final response = await _remoteDataSource.createBookingIntent(
      listingId: listingId,
      hostId: hostId,
      startDate: startDate,
      endDate: endDate,
      totalPrice: totalPrice,
      paymentType: paymentType,
    );
    if (response != null && response['success'] == true) {
      // The API returns tempOrderId and paymentAmount, but we construct a full intent representation
      // since the original implementation did so.
      return BookingIntentModel.fromJson({
        '_id': response['tempOrderId'],
        'tempOrderId': response['tempOrderId'],
        'intentId': response['tempOrderId'],
        'listingId': listingId,
        'customerId': '', // It's handled backend-side mostly,
        'hostId': hostId,
        'startDate': startDate.toIso8601String(),
        'endDate': endDate.toIso8601String(),
        'totalPrice': totalPrice,
        'paymentMethod': 'vnpay',
        'paymentType': paymentType,
        'paymentAmount': response['paymentAmount'] ?? totalPrice,
        'depositPercentage': paymentType == 'deposit' ? 30 : 0,
        'depositAmount': paymentType == 'deposit' ? (totalPrice * 0.3) : 0,
        'remainingAmount': paymentType == 'deposit' ? (totalPrice * 0.7) : 0,
        'expiresAt': DateTime.now().add(const Duration(minutes: 30)).toIso8601String(),
        'lockedAt': DateTime.now().toIso8601String(),
        'status': 'locked',
      });
    }
    return null;
  }

  @override
  Future<String?> createVNPayPaymentUrl({
    required String tempOrderId,
    required double amount,
    required String orderInfo,
    required String returnUrl,
  }) async {
    return await _remoteDataSource.createVNPayPaymentUrl(
      tempOrderId: tempOrderId,
      amount: amount,
      orderInfo: orderInfo,
      returnUrl: returnUrl,
    );
  }

  @override
  Future<BookingEntity?> handlePaymentCallback({
    required String tempOrderId,
    required String transactionId,
    required Map<String, dynamic> paymentData,
  }) async {
    final response = await _remoteDataSource.handlePaymentCallback(
      tempOrderId: tempOrderId,
      transactionId: transactionId,
      paymentData: paymentData,
    );
    if (response != null) {
      return BookingModel.fromJson(response);
    }
    return null;
  }

  @override
  Future<Map<String, dynamic>> checkAvailability({
    required String listingId,
    required DateTime startDate,
    required DateTime endDate,
    String? userId,
  }) async {
    return await _remoteDataSource.checkAvailability(
      listingId: listingId,
      startDate: startDate,
      endDate: endDate,
      userId: userId,
    );
  }

  @override
  Future<BookingEntity?> getBookingById(String bookingId) async {
    final response = await _remoteDataSource.getBookingById(bookingId);
    if (response != null) {
      return BookingModel.fromJson(response);
    }
    return null;
  }

  @override
  Future<List<BookingEntity>> getUserTrips() async {
    final responseList = await _remoteDataSource.getUserTrips();
    return responseList.map((json) => BookingModel.fromJson(json)).toList();
  }

  @override
  Future<Map<String, dynamic>?> requestExtension({
    required String bookingId,
    required DateTime newEndDate,
  }) async {
    return await _remoteDataSource.requestExtension(
      bookingId: bookingId,
      newEndDate: newEndDate,
    );
  }

  @override
  Future<bool> cancelBookingIntent(String intentId) async {
    return await _remoteDataSource.cancelBookingIntent(intentId);
  }

  @override
  Future<String?> initiatePayment({
    required String bookingId,
    required String paymentType,
    required double amount,
  }) async {
    return await _remoteDataSource.initiatePayment(
      bookingId: bookingId,
      paymentType: paymentType,
      amount: amount,
    );
  }

  @override
  Future<Map<String, dynamic>?> checkPaymentStatus(String bookingId) async {
    return await _remoteDataSource.checkPaymentStatus(bookingId);
  }
}
