import 'package:injectable/injectable.dart';

import '../entities/booking_entity.dart';
import '../entities/booking_intent_entity.dart';
import '../repositories/i_booking_repository.dart';

@injectable
class CreateCashBookingUseCase {
  final IBookingRepository repository;

  CreateCashBookingUseCase(this.repository);

  Future<BookingEntity?> call({
    required String listingId,
    required String hostId,
    required DateTime startDate,
    required DateTime endDate,
    required double totalPrice,
  }) async {
    return await repository.createCashBooking(
      listingId: listingId,
      hostId: hostId,
      startDate: startDate,
      endDate: endDate,
      totalPrice: totalPrice,
    );
  }
}

@injectable
class CreateBookingIntentUseCase {
  final IBookingRepository repository;

  CreateBookingIntentUseCase(this.repository);

  Future<BookingIntentEntity?> call({
    required String listingId,
    required String hostId,
    required DateTime startDate,
    required DateTime endDate,
    required double totalPrice,
    required String paymentType,
  }) async {
    return await repository.createBookingIntent(
      listingId: listingId,
      hostId: hostId,
      startDate: startDate,
      endDate: endDate,
      totalPrice: totalPrice,
      paymentType: paymentType,
    );
  }
}

@injectable
class InitiateVNPayPaymentUseCase {
  final IBookingRepository repository;

  InitiateVNPayPaymentUseCase(this.repository);

  Future<String?> call({
    required String tempOrderId,
    required double amount,
    required String orderInfo,
    required String returnUrl,
  }) async {
    return await repository.createVNPayPaymentUrl(
      tempOrderId: tempOrderId,
      amount: amount,
      orderInfo: orderInfo,
      returnUrl: returnUrl,
    );
  }
}

@injectable
class HandlePaymentCallbackUseCase {
  final IBookingRepository repository;

  HandlePaymentCallbackUseCase(this.repository);

  Future<BookingEntity?> call({
    required String tempOrderId,
    required String transactionId,
    required Map<String, dynamic> paymentData,
  }) async {
    return await repository.handlePaymentCallback(
      tempOrderId: tempOrderId,
      transactionId: transactionId,
      paymentData: paymentData,
    );
  }
}

@injectable
class GetUserTripsUseCase {
  final IBookingRepository repository;

  GetUserTripsUseCase(this.repository);

  Future<List<BookingEntity>> call() async {
    return await repository.getUserTrips();
  }
}

@injectable
class CheckAvailabilityUseCase {
  final IBookingRepository repository;

  CheckAvailabilityUseCase(this.repository);

  Future<Map<String, dynamic>> call({
    required String listingId,
    required DateTime startDate,
    required DateTime endDate,
    String? userId,
  }) async {
    return await repository.checkAvailability(
      listingId: listingId,
      startDate: startDate,
      endDate: endDate,
      userId: userId,
    );
  }
}

@injectable
class CancelBookingIntentUseCase {
  final IBookingRepository repository;

  CancelBookingIntentUseCase(this.repository);

  Future<bool> call(String intentId) async {
    return await repository.cancelBookingIntent(intentId);
  }
}
